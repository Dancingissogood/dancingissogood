import type { DatabaseClient } from "@dancingissogood/db";
import type Stripe from "stripe";

import { config } from "./config.js";
import { recordMarketingPreference } from "./marketing.js";

type CheckoutDependencies = {
  database: DatabaseClient;
  stripe: Stripe;
};

export type CheckoutSessionResult = {
  purchaseId: string;
  url: string;
};

type CheckoutAccount = {
  email: string;
  stripeCustomerId: string | null;
  userId: string;
};

export async function createPassCheckoutSession(
  { database, stripe }: CheckoutDependencies,
  passSlug: string,
  account: CheckoutAccount | null = null,
): Promise<CheckoutSessionResult | null> {
  const passProduct = await database.passProduct.findFirst({
    where: { active: true, slug: passSlug },
  });

  if (!passProduct?.stripePriceId) {
    return null;
  }

  const stripePrice = await stripe.prices.retrieve(passProduct.stripePriceId);

  if (
    !stripePrice.active ||
    stripePrice.currency !== passProduct.currency ||
    stripePrice.recurring !== null ||
    stripePrice.unit_amount !== passProduct.priceCents
  ) {
    throw new Error(`Stripe price configuration is invalid for pass product ${passProduct.id}.`);
  }

  const purchase = await database.passPurchase.create({
    data: {
      amountTotalCents: passProduct.priceCents,
      currency: passProduct.currency,
      passProductId: passProduct.id,
      userId: account?.userId,
    },
  });

  try {
    const customerParameters: Pick<
      Stripe.Checkout.SessionCreateParams,
      "customer" | "customer_creation" | "customer_email"
    > = account?.stripeCustomerId
      ? { customer: account.stripeCustomerId }
      : {
          customer_creation: "always",
          ...(account ? { customer_email: account.email } : {}),
        };
    const checkoutSession = await stripe.checkout.sessions.create({
      cancel_url: `${config.landingUrl}/#pass`,
      client_reference_id: purchase.id,
      ...customerParameters,
      consent_collection: { promotions: "auto" },
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      metadata: {
        passProductId: passProduct.id,
        passPurchaseId: purchase.id,
      },
      mode: "payment",
      success_url: `${config.landingUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    if (!checkoutSession.url) {
      throw new Error(`Stripe Checkout did not return a URL for purchase ${purchase.id}.`);
    }

    await database.passPurchase.update({
      data: { stripeCheckoutSessionId: checkoutSession.id },
      where: { id: purchase.id },
    });

    return { purchaseId: purchase.id, url: checkoutSession.url };
  } catch (error) {
    await database.passPurchase.update({
      data: { status: "FAILED" },
      where: { id: purchase.id },
    });
    throw error;
  }
}

export async function processStripeEvent(
  database: DatabaseClient,
  event: Stripe.Event,
): Promise<void> {
  const alreadyRecorded = await database.paymentEvent.findUnique({
    select: { id: true },
    where: { stripeEventId: event.id },
  });

  if (alreadyRecorded) {
    return;
  }

  try {
    await database.$transaction(async (transaction) => {
      const recordedEvent = await transaction.paymentEvent.create({
        data: {
          eventType: event.type,
          payload: summarizeStripeEvent(event),
          stripeEventId: event.id,
        },
      });

      if (event.type === "charge.refunded") {
        await handleChargeRefunded(transaction, event.data.object);
      }

      if (event.type === "charge.dispute.created") {
        await setPassStatusForPaymentIntent(
          transaction,
          event.data.object.payment_intent,
          { from: "ACTIVE", to: "CANCELED" },
        );
      }

      if (event.type === "charge.dispute.closed" && event.data.object.status === "won") {
        await setPassStatusForPaymentIntent(
          transaction,
          event.data.object.payment_intent,
          { from: "CANCELED", to: "ACTIVE" },
        );
      }

      if (isCheckoutSessionEvent(event)) {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = session.metadata?.passPurchaseId ?? session.client_reference_id;

        if (purchaseId) {
          if (event.type === "checkout.session.completed") {
            if (session.payment_status === "paid") {
              await markPurchasePaid(transaction, purchaseId, session, event.created);
            } else if (session.payment_status === "unpaid") {
              await markPurchaseProcessing(transaction, purchaseId, session);
            }
          }

          if (event.type === "checkout.session.async_payment_succeeded") {
            await markPurchasePaid(transaction, purchaseId, session, event.created);
          }

          if (event.type === "checkout.session.async_payment_failed") {
            await transaction.passPurchase.updateMany({
              data: { status: "FAILED" },
              where: { id: purchaseId, status: { in: ["PENDING", "PROCESSING"] } },
            });
          }

          if (event.type === "checkout.session.expired") {
            await transaction.passPurchase.updateMany({
              data: { status: "CANCELED" },
              where: { id: purchaseId, status: "PENDING" },
            });
          }

          const purchaserEmail = session.customer_details?.email ?? session.customer_email;
          if (
            purchaserEmail &&
            (session.consent?.promotions === "opt_in" ||
              session.consent?.promotions === "opt_out")
          ) {
            const purchase = await transaction.passPurchase.findUnique({
              select: { userId: true },
              where: { id: purchaseId },
            });
            await recordMarketingPreference(transaction, {
              email: purchaserEmail,
              source: "CHECKOUT",
              status:
                session.consent.promotions === "opt_in" ? "SUBSCRIBED" : "UNSUBSCRIBED",
              userId: purchase?.userId,
            });
          }
        }
      }

      await transaction.paymentEvent.update({
        data: { processedAt: new Date() },
        where: { id: recordedEvent.id },
      });
    });
  } catch (error) {
    // A concurrent delivery of the same event may have committed first. Any other
    // failure must reach Stripe as an error so the event is retried.
    if (isUniqueConstraintError(error)) {
      const recordedConcurrently = await database.paymentEvent.findUnique({
        select: { id: true },
        where: { stripeEventId: event.id },
      });

      if (recordedConcurrently) {
        return;
      }
    }

    throw error;
  }
}

type TransactionClient = Parameters<Parameters<DatabaseClient["$transaction"]>[0]>[0];

function paymentIntentId(value: string | Stripe.PaymentIntent | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function handleChargeRefunded(transaction: TransactionClient, charge: Stripe.Charge) {
  // Partial refunds leave the pass in place; only a full refund revokes it.
  if (!charge.refunded) {
    return;
  }

  const intentId = paymentIntentId(charge.payment_intent);
  if (!intentId) return;

  // Reservations are intentionally kept; the revoked pass can no longer book or join classes.
  await transaction.passPurchase.updateMany({
    data: { passStatus: "REFUNDED", status: "REFUNDED" },
    where: { status: "PAID", stripePaymentIntentId: intentId },
  });
}

async function setPassStatusForPaymentIntent(
  transaction: TransactionClient,
  paymentIntent: string | Stripe.PaymentIntent | null,
  change: { from: "ACTIVE" | "CANCELED"; to: "ACTIVE" | "CANCELED" },
) {
  const intentId = paymentIntentId(paymentIntent);
  if (!intentId) return;

  await transaction.passPurchase.updateMany({
    data: { passStatus: change.to },
    where: { passStatus: change.from, status: "PAID", stripePaymentIntentId: intentId },
  });
}

/**
 * Keeps an audit record of each Stripe event without storing customer personal data
 * (names, emails, addresses) from the event payload.
 */
function summarizeStripeEvent(event: Stripe.Event) {
  const object = event.data.object as unknown as Record<string, unknown>;
  const pick = (key: string) => (key in object ? object[key] ?? null : undefined);
  const summary: Record<string, unknown> = {
    created: event.created,
    id: event.id,
    livemode: event.livemode,
    object: {
      amount: pick("amount"),
      amount_refunded: pick("amount_refunded"),
      amount_total: pick("amount_total"),
      currency: pick("currency"),
      id: pick("id"),
      metadata: pick("metadata"),
      object: pick("object"),
      payment_intent: paymentIntentId(
        (pick("payment_intent") as string | Stripe.PaymentIntent | null | undefined) ?? null,
      ),
      payment_status: pick("payment_status"),
      reason: pick("reason"),
      refunded: pick("refunded"),
      status: pick("status"),
    },
    type: event.type,
  };

  return JSON.parse(JSON.stringify(summary));
}

function isCheckoutSessionEvent(event: Stripe.Event): boolean {
  return (
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.expired"
  );
}

async function markPurchaseProcessing(
  database: Pick<DatabaseClient, "passPurchase">,
  purchaseId: string,
  session: Stripe.Checkout.Session,
): Promise<void> {
  await database.passPurchase.updateMany({
    data: {
      purchaserEmail: session.customer_details?.email ?? session.customer_email,
      status: "PROCESSING",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    },
    where: { id: purchaseId, status: "PENDING" },
  });
}

async function markPurchasePaid(
  database: Pick<DatabaseClient, "passPurchase">,
  purchaseId: string,
  session: Stripe.Checkout.Session,
  eventCreatedAt: number,
): Promise<void> {
  // The pass's dates are set when its first class is booked (see pass-access.ts).
  await database.passPurchase.updateMany({
    data: {
      paidAt: new Date(eventCreatedAt * 1_000),
      passStatus: "ACTIVE",
      purchaserEmail: session.customer_details?.email ?? session.customer_email,
      status: "PAID",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    },
    where: { id: purchaseId, status: { in: ["PENDING", "PROCESSING"] } },
  });
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
