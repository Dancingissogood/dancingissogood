import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { createDatabaseClient } from "@dancingissogood/db";
import Stripe from "stripe";

import { buildApp } from "../src/app.js";

const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
const stripeSecretKey = process.env["STRIPE_SECRET_KEY"];

if (!stripeSecretKey || !webhookSecret) {
  throw new Error("Stripe credentials are required for Stripe webhook tests.");
}

const configuredStripeSecretKey: string = stripeSecretKey;

async function createTestPassProduct() {
  const database = createDatabaseClient();
  const slug = `test-pass-${randomUUID()}`;
  const product = await database.passProduct.create({
    data: {
      accessDays: 3,
      accessEnds: "1:00 PM",
      accessStarts: "9:00 AM",
      name: "Test Pass",
      priceCents: 10_000,
      slug,
      stripePriceId: `price_${randomUUID().replaceAll("-", "")}`,
    },
  });

  return { database, product };
}

function createStripeMock() {
  let checkoutParameters: Stripe.Checkout.SessionCreateParams | undefined;
  const stripe = new Stripe(configuredStripeSecretKey, { apiVersion: "2026-06-24.dahlia" });

  stripe.prices.retrieve = (async (priceId) =>
    ({
      active: true,
      currency: "usd",
      id: priceId,
      object: "price",
      recurring: null,
      unit_amount: 10_000,
    }) as Stripe.Price) as typeof stripe.prices.retrieve;
  stripe.checkout.sessions.create = (async (parameters) => {
    checkoutParameters = parameters;
    return {
      id: `cs_test_${randomUUID().replaceAll("-", "")}`,
      object: "checkout.session",
      url: "https://checkout.stripe.com/c/pay/test-session",
    } as Stripe.Checkout.Session;
  }) as typeof stripe.checkout.sessions.create;

  return {
    getCheckoutParameters: () => checkoutParameters,
    stripe,
  };
}

test("checkout derives the amount from the server-owned Stripe price", async () => {
  const { database, product } = await createTestPassProduct();
  const stripeMock = createStripeMock();
  const app = await buildApp({ database, stripe: stripeMock.stripe });

  try {
    const response = await app.inject({
      method: "POST",
      payload: { passSlug: product.slug },
      url: "/v1/checkout-sessions",
    });

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.json(), { url: "https://checkout.stripe.com/c/pay/test-session" });
    assert.deepEqual(stripeMock.getCheckoutParameters()?.line_items, [
      { price: product.stripePriceId, quantity: 1 },
    ]);
    assert.equal("payment_method_types" in (stripeMock.getCheckoutParameters() ?? {}), false);

    const purchase = await database.passPurchase.findFirstOrThrow({
      where: { passProductId: product.id },
    });
    assert.equal(purchase.amountTotalCents, product.priceCents);
    assert.equal(purchase.status, "PENDING");
  } finally {
    await database.passPurchase.deleteMany({ where: { passProductId: product.id } });
    await database.passProduct.delete({ where: { id: product.id } });
    await app.close();
  }
});

test("Stripe webhook verifies its signature and processes a payment event once", async () => {
  const { database, product } = await createTestPassProduct();
  const purchase = await database.passPurchase.create({
    data: {
      amountTotalCents: product.priceCents,
      currency: product.currency,
      passProductId: product.id,
    },
  });
  const stripe = new Stripe(configuredStripeSecretKey, { apiVersion: "2026-06-24.dahlia" });
  const app = await buildApp({ database, stripe });
  const eventId = `evt_test_${randomUUID().replaceAll("-", "")}`;
  const sessionId = `cs_test_${randomUUID().replaceAll("-", "")}`;
  const payload = JSON.stringify({
    api_version: "2026-06-24.dahlia",
    created: 1_783_705_600,
    data: {
      object: {
        customer: "cus_test_customer",
        customer_details: { email: "guest@example.com" },
        id: sessionId,
        metadata: { passPurchaseId: purchase.id },
        object: "checkout.session",
        payment_intent: "pi_test_payment",
        payment_status: "paid",
      },
    },
    id: eventId,
    livemode: false,
    object: "event",
    pending_webhooks: 1,
    request: null,
    type: "checkout.session.completed",
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });

  try {
    const firstResponse = await app.inject({
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
      method: "POST",
      payload,
      url: "/v1/webhooks/stripe",
    });
    const repeatedResponse = await app.inject({
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
      method: "POST",
      payload,
      url: "/v1/webhooks/stripe",
    });

    assert.equal(firstResponse.statusCode, 200);
    assert.equal(repeatedResponse.statusCode, 200);

    const paidPurchase = await database.passPurchase.findUniqueOrThrow({
      where: { id: purchase.id },
    });
    assert.equal(paidPurchase.status, "PAID");
    assert.equal(paidPurchase.purchaserEmail, "guest@example.com");
    assert.equal(paidPurchase.stripeCheckoutSessionId, sessionId);
    assert.equal(paidPurchase.stripeCustomerId, "cus_test_customer");
    assert.equal(paidPurchase.stripePaymentIntentId, "pi_test_payment");

    const eventCount = await database.paymentEvent.count({ where: { stripeEventId: eventId } });
    assert.equal(eventCount, 1);
  } finally {
    await database.paymentEvent.deleteMany({ where: { stripeEventId: eventId } });
    await database.passPurchase.delete({ where: { id: purchase.id } });
    await database.passProduct.delete({ where: { id: product.id } });
    await app.close();
  }
});
