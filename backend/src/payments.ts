import type { DatabaseClient } from "@dancingissogood/db";
import type Stripe from "stripe";

import { config } from "./config.js";

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
      cancel_url: `${config.landingUrl}/#passes`,
      client_reference_id: purchase.id,
      ...customerParameters,
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
  try {
    await database.$transaction(async (transaction) => {
      const recordedEvent = await transaction.paymentEvent.create({
        data: {
          eventType: event.type,
          payload: JSON.parse(JSON.stringify(event)),
          stripeEventId: event.id,
        },
      });

      if (isCheckoutSessionEvent(event)) {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = session.metadata?.passPurchaseId ?? session.client_reference_id;

        if (purchaseId) {
          if (
            event.type === "checkout.session.completed" &&
            session.payment_status === "paid"
          ) {
            await markPurchasePaid(transaction, purchaseId, session, event.created);
          }

          if (event.type === "checkout.session.async_payment_succeeded") {
            await markPurchasePaid(transaction, purchaseId, session, event.created);
          }

          if (event.type === "checkout.session.async_payment_failed") {
            await transaction.passPurchase.updateMany({
              data: { status: "FAILED" },
              where: { id: purchaseId, status: "PENDING" },
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
    if (isDuplicateEventError(error)) {
      return;
    }

    throw error;
  }
}

function isCheckoutSessionEvent(event: Stripe.Event): boolean {
  return (
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.completed"
  );
}

async function markPurchasePaid(
  database: Pick<DatabaseClient, "passPurchase">,
  purchaseId: string,
  session: Stripe.Checkout.Session,
  eventCreatedAt: number,
): Promise<void> {
  await database.passPurchase.update({
    data: {
      paidAt: new Date(eventCreatedAt * 1_000),
      purchaserEmail: session.customer_details?.email ?? session.customer_email,
      status: "PAID",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    },
    where: { id: purchaseId },
  });
}

function isDuplicateEventError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
