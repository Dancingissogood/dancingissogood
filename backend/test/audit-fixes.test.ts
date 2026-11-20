import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import test from "node:test";

import { createDatabaseClient } from "@dancingissogood/db";
import type { DatabaseClient } from "@dancingissogood/db";
import type Stripe from "stripe";

import type { IdentityProvider } from "../src/auth.js";
import { buildApp } from "../src/app.js";
import { processStripeEvent } from "../src/payments.js";

const futureYear = new Date().getUTCFullYear() + 2;
// July in Detroit is UTC-4, so 14:00Z is 10:00 AM ET on the same calendar day.
const classAt = (day: number) => new Date(`${futureYear}-07-${String(day).padStart(2, "0")}T14:00:00.000Z`);
const detroitMidnight = (day: number) =>
  new Date(`${futureYear}-07-${String(day).padStart(2, "0")}T04:00:00.000Z`);

function memberIdentity(clerkUserId: string, email: string): IdentityProvider {
  return {
    configured: true,
    authenticate: async () => ({ clerkUserId, email, firstName: "Test", lastName: "Dancer", phone: null }),
  };
}

function stripeEvent(type: string, object: Record<string, unknown>) {
  return {
    api_version: "2026-08-26.dahlia",
    created: Math.floor(Date.now() / 1_000),
    data: { object },
    id: `evt_${randomUUID().replaceAll("-", "")}`,
    livemode: false,
    object: "event",
    pending_webhooks: 1,
    request: null,
    type,
  } as unknown as Stripe.Event;
}

async function createMemberWithPass(database: DatabaseClient, label: string) {
  const suffix = randomUUID();
  const clerkUserId = `${label}_${suffix}`;
  const email = `${label}-${suffix}@example.com`;
  const user = await database.userProfile.create({ data: { clerkUserId, email } });
  const product = await database.passProduct.create({
    data: {
      accessDays: 3,
      accessEnds: "2:00 PM",
      accessStarts: "9:00 AM",
      name: "Audit Test Pass",
      priceCents: 10_000,
      slug: `${label}-pass-${suffix}`,
    },
  });
  const purchase = await database.passPurchase.create({
    data: {
      amountTotalCents: 10_000,
      paidAt: new Date(),
      passProductId: product.id,
      passStatus: "ACTIVE",
      status: "PAID",
      stripePaymentIntentId: `pi_${suffix.replaceAll("-", "")}`,
      userId: user.id,
    },
  });

  return { clerkUserId, email, product, purchase, user };
}

async function cleanUp(
  database: DatabaseClient,
  member: { user: { id: string }; product: { id: string } },
  sessionIds: string[],
) {
  await database.classRegistration.deleteMany({ where: { userId: member.user.id } });
  await database.classSession.deleteMany({ where: { id: { in: sessionIds } } });
  await database.passPurchase.deleteMany({ where: { passProductId: member.product.id } });
  await database.marketingPreference.deleteMany({ where: { userId: member.user.id } });
  await database.userProfile.deleteMany({ where: { id: member.user.id } });
  await database.passProduct.deleteMany({ where: { id: member.product.id } });
}

test("a pass starts on the day of the first booked class and covers three studio days", async () => {
  const database = createDatabaseClient();
  const member = await createMemberWithPass(database, "window");
  const sessions = await Promise.all(
    [11, 12, 14, 15].map((day) =>
      database.classSession.create({
        data: {
          classKey: "waltz",
          endsAt: new Date(classAt(day).getTime() + 20 * 60 * 1_000),
          startsAt: classAt(day),
          title: `Waltz ${day}`,
        },
      }),
    ),
  );
  const [jul11, jul12, jul14, jul15] = sessions as [
    (typeof sessions)[number],
    (typeof sessions)[number],
    (typeof sessions)[number],
    (typeof sessions)[number],
  ];
  const app = await buildApp({ database, identityProvider: memberIdentity(member.clerkUserId, member.email) });
  const reserve = (classSessionId: string) =>
    app.inject({
      headers: { authorization: "Bearer member" },
      method: "POST",
      payload: { classSessionId },
      url: "/v1/account/reservations",
    });
  const cancel = (classSessionId: string) =>
    app.inject({
      headers: { authorization: "Bearer member" },
      method: "DELETE",
      url: `/v1/account/reservations/${classSessionId}`,
    });
  const passDates = async () =>
    database.passPurchase.findUniqueOrThrow({
      select: { validFrom: true, validUntil: true },
      where: { id: member.purchase.id },
    });

  try {
    assert.deepEqual(await passDates(), { validFrom: null, validUntil: null });

    assert.equal((await reserve(jul12.id)).statusCode, 200);
    assert.deepEqual(await passDates(), { validFrom: detroitMidnight(12), validUntil: detroitMidnight(15) });

    assert.equal((await reserve(jul14.id)).statusCode, 200);

    const tooLate = await reserve(jul15.id);
    assert.equal(tooLate.statusCode, 403);
    assert.equal(tooLate.json().code, "OUTSIDE_PASS_DATES");
    assert.match(tooLate.json().error, /Jul 12 – .*Jul 14/);

    // Moving the start to Jul 11 would push the Jul 14 class outside the three days.
    const tooEarly = await reserve(jul11.id);
    assert.equal(tooEarly.statusCode, 403);
    assert.equal(tooEarly.json().code, "OUTSIDE_PASS_DATES");

    // After canceling Jul 14, an earlier class moves the start back to Jul 11.
    assert.equal((await cancel(jul14.id)).statusCode, 204);
    assert.equal((await reserve(jul11.id)).statusCode, 200);
    assert.deepEqual(await passDates(), { validFrom: detroitMidnight(11), validUntil: detroitMidnight(14) });

    // Canceling every booking before the first class resets the pass.
    assert.equal((await cancel(jul11.id)).statusCode, 204);
    assert.deepEqual(await passDates(), { validFrom: detroitMidnight(12), validUntil: detroitMidnight(15) });
    assert.equal((await cancel(jul12.id)).statusCode, 204);
    assert.deepEqual(await passDates(), { validFrom: null, validUntil: null });
  } finally {
    await cleanUp(database, member, sessions.map((session) => session.id));
    await app.close();
  }
});

test("classes that have started can't be canceled and fix the pass dates", async () => {
  const database = createDatabaseClient();
  const member = await createMemberWithPass(database, "started");
  const now = Date.now();
  const started = await database.classSession.create({
    data: {
      classKey: "tango",
      endsAt: new Date(now + 15 * 60 * 1_000),
      startsAt: new Date(now - 5 * 60 * 1_000),
      title: "Tango in progress",
    },
  });
  const later = await database.classSession.create({
    data: {
      classKey: "tango",
      endsAt: new Date(classAt(20).getTime() + 20 * 60 * 1_000),
      startsAt: classAt(20),
      title: "Tango later",
    },
  });
  await database.classRegistration.create({
    data: { classSessionId: started.id, passPurchaseId: member.purchase.id, userId: member.user.id },
  });
  await database.passPurchase.update({
    data: { validFrom: new Date(now - 60 * 60 * 1_000), validUntil: new Date(now + 2 * 24 * 60 * 60 * 1_000) },
    where: { id: member.purchase.id },
  });
  const app = await buildApp({ database, identityProvider: memberIdentity(member.clerkUserId, member.email) });

  try {
    const cancelStarted = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "DELETE",
      url: `/v1/account/reservations/${started.id}`,
    });
    assert.equal(cancelStarted.statusCode, 409);

    const registration = await database.classRegistration.findFirstOrThrow({
      where: { classSessionId: started.id, userId: member.user.id },
    });
    assert.equal(registration.status, "RESERVED");

    const outside = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "POST",
      payload: { classSessionId: later.id },
      url: "/v1/account/reservations",
    });
    assert.equal(outside.statusCode, 403);
    assert.equal(outside.json().code, "OUTSIDE_PASS_DATES");
  } finally {
    await cleanUp(database, member, [started.id, later.id]);
    await app.close();
  }
});

test("a full refund revokes the pass but keeps existing reservations", async () => {
  const database = createDatabaseClient();
  const member = await createMemberWithPass(database, "refund");
  const booked = await database.classSession.create({
    data: { classKey: "foxtrot", endsAt: new Date(classAt(12).getTime() + 1_200_000), startsAt: classAt(12), title: "Foxtrot" },
  });
  const another = await database.classSession.create({
    data: { classKey: "foxtrot", endsAt: new Date(classAt(13).getTime() + 1_200_000), startsAt: classAt(13), title: "Foxtrot 2" },
  });
  const app = await buildApp({ database, identityProvider: memberIdentity(member.clerkUserId, member.email) });
  const intentId = member.purchase.stripePaymentIntentId;

  try {
    const reserve = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "POST",
      payload: { classSessionId: booked.id },
      url: "/v1/account/reservations",
    });
    assert.equal(reserve.statusCode, 200);

    // A partial refund leaves the pass active.
    await processStripeEvent(
      database,
      stripeEvent("charge.refunded", { amount_refunded: 2_000, object: "charge", payment_intent: intentId, refunded: false }),
    );
    let purchase = await database.passPurchase.findUniqueOrThrow({ where: { id: member.purchase.id } });
    assert.equal(purchase.status, "PAID");
    assert.equal(purchase.passStatus, "ACTIVE");

    await processStripeEvent(
      database,
      stripeEvent("charge.refunded", { amount_refunded: 10_000, object: "charge", payment_intent: intentId, refunded: true }),
    );
    purchase = await database.passPurchase.findUniqueOrThrow({ where: { id: member.purchase.id } });
    assert.equal(purchase.status, "REFUNDED");
    assert.equal(purchase.passStatus, "REFUNDED");

    const registration = await database.classRegistration.findFirstOrThrow({
      where: { classSessionId: booked.id, userId: member.user.id },
    });
    assert.equal(registration.status, "RESERVED");

    const afterRefund = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "POST",
      payload: { classSessionId: another.id },
      url: "/v1/account/reservations",
    });
    assert.equal(afterRefund.statusCode, 403);
    assert.equal(afterRefund.json().code, "PASS_REQUIRED");
  } finally {
    await cleanUp(database, member, [booked.id, another.id]);
    await app.close();
  }
});

test("a dispute suspends the pass until it is won", async () => {
  const database = createDatabaseClient();
  const member = await createMemberWithPass(database, "dispute");
  const intentId = member.purchase.stripePaymentIntentId;

  try {
    await processStripeEvent(
      database,
      stripeEvent("charge.dispute.created", { object: "dispute", payment_intent: intentId, status: "needs_response" }),
    );
    let purchase = await database.passPurchase.findUniqueOrThrow({ where: { id: member.purchase.id } });
    assert.equal(purchase.passStatus, "CANCELED");

    await processStripeEvent(
      database,
      stripeEvent("charge.dispute.closed", { object: "dispute", payment_intent: intentId, status: "won" }),
    );
    purchase = await database.passPurchase.findUniqueOrThrow({ where: { id: member.purchase.id } });
    assert.equal(purchase.passStatus, "ACTIVE");
  } finally {
    await cleanUp(database, member, []);
  }
});

test("only a repeated Stripe event is treated as a duplicate; other failures are retried", async () => {
  const uniqueViolation = Object.assign(new Error("Unique constraint failed on userId"), { code: "P2002" });
  const failingDatabase = {
    $transaction: async () => {
      throw uniqueViolation;
    },
    paymentEvent: { findUnique: async () => null },
  } as unknown as DatabaseClient;

  await assert.rejects(
    processStripeEvent(failingDatabase, stripeEvent("checkout.session.completed", { object: "checkout.session" })),
    /Unique constraint failed/,
  );
});

test("checkout keeps working when the purchaser's email differs from their saved preference", async () => {
  const database = createDatabaseClient();
  const member = await createMemberWithPass(database, "consent");
  const pending = await database.passPurchase.create({
    data: { amountTotalCents: 10_000, passProductId: member.product.id, userId: member.user.id },
  });
  await database.marketingPreference.create({
    data: {
      email: member.email,
      source: "ONBOARDING",
      statementVersion: "test",
      status: "UNSUBSCRIBED",
      userId: member.user.id,
    },
  });
  const newEmail = `changed-${randomUUID()}@example.com`;

  try {
    await processStripeEvent(
      database,
      stripeEvent("checkout.session.completed", {
        consent: { promotions: "opt_in" },
        customer_details: { email: newEmail, name: "Test Dancer" },
        id: `cs_test_${randomUUID().replaceAll("-", "")}`,
        metadata: { passPurchaseId: pending.id },
        object: "checkout.session",
        payment_intent: `pi_${randomUUID().replaceAll("-", "")}`,
        payment_status: "paid",
      }),
    );

    const purchase = await database.passPurchase.findUniqueOrThrow({ where: { id: pending.id } });
    assert.equal(purchase.status, "PAID");
    assert.equal(purchase.passStatus, "ACTIVE");

    const preference = await database.marketingPreference.findUniqueOrThrow({ where: { userId: member.user.id } });
    assert.equal(preference.status, "SUBSCRIBED");
    assert.equal(preference.email, newEmail);

    // The audit record keeps no customer personal data.
    const recorded = await database.paymentEvent.findFirstOrThrow({
      orderBy: { createdAt: "desc" },
      where: { eventType: "checkout.session.completed" },
    });
    const serialized = JSON.stringify(recorded.payload);
    assert.equal(serialized.includes(newEmail), false);
    assert.equal(serialized.includes("Test Dancer"), false);
  } finally {
    await database.marketingConsentEvent.deleteMany({ where: { email: { in: [member.email, newEmail] } } });
    await cleanUp(database, member, []);
  }
});

test("moving a class in the admin calendar keeps its other settings", async () => {
  const database = createDatabaseClient();
  const suffix = randomUUID();
  const clerkUserId = `move_admin_${suffix}`;
  const email = `move-admin-${suffix}@example.com`;
  const admin = await database.userProfile.create({ data: { clerkUserId, email, role: "ADMIN" } });
  const session = await database.classSession.create({
    data: {
      bookingStatus: "CLOSED",
      capacity: 12,
      classKey: "samba",
      deliveryMode: "ONLINE",
      endsAt: new Date(`${futureYear}-07-21T13:20:00.000Z`),
      meetUrl: "https://meet.google.com/abc-defg-hij",
      startsAt: new Date(`${futureYear}-07-21T13:00:00.000Z`),
      title: "Samba online",
    },
  });
  const app = await buildApp({ database, identityProvider: memberIdentity(clerkUserId, email) });

  try {
    const response = await app.inject({
      headers: { authorization: "Bearer admin" },
      method: "PATCH",
      payload: {
        endsAt: `${futureYear}-07-21T14:20:00.000Z`,
        startsAt: `${futureYear}-07-21T14:00:00.000Z`,
      },
      url: `/v1/admin/class-sessions/${session.id}`,
    });
    assert.equal(response.statusCode, 200);

    const moved = await database.classSession.findUniqueOrThrow({ where: { id: session.id } });
    assert.equal(moved.startsAt.toISOString(), `${futureYear}-07-21T14:00:00.000Z`);
    assert.equal(moved.deliveryMode, "ONLINE");
    assert.equal(moved.bookingStatus, "CLOSED");
    assert.equal(moved.meetUrl, "https://meet.google.com/abc-defg-hij");
    assert.equal(moved.capacity, 12);
  } finally {
    await database.classSession.deleteMany({ where: { id: session.id } });
    await database.userProfile.deleteMany({ where: { id: admin.id } });
    await app.close();
  }
});

test("the class link is refused without an own reservation or with a revoked pass", async () => {
  const database = createDatabaseClient();
  const member = await createMemberWithPass(database, "join");
  const other = await createMemberWithPass(database, "join_other");
  const now = Date.now();
  const live = await database.classSession.create({
    data: {
      classKey: "rumba",
      deliveryMode: "ONLINE",
      endsAt: new Date(now + 15 * 60 * 1_000),
      meetUrl: "https://meet.google.com/xyz-abcd-efg",
      startsAt: new Date(now - 5 * 60 * 1_000),
      title: "Rumba live",
    },
  });
  await database.classRegistration.create({
    data: { classSessionId: live.id, passPurchaseId: other.purchase.id, userId: other.user.id },
  });
  const memberApp = await buildApp({ database, identityProvider: memberIdentity(member.clerkUserId, member.email) });
  const otherApp = await buildApp({ database, identityProvider: memberIdentity(other.clerkUserId, other.email) });
  const join = (app: typeof memberApp) =>
    app.inject({
      headers: { authorization: "Bearer member" },
      method: "GET",
      url: `/v1/account/class-sessions/${live.id}/join`,
    });

  try {
    assert.equal((await join(memberApp)).statusCode, 404);
    assert.equal((await join(otherApp)).statusCode, 200);

    await database.passPurchase.update({
      data: { passStatus: "REFUNDED", status: "REFUNDED" },
      where: { id: other.purchase.id },
    });
    assert.equal((await join(otherApp)).statusCode, 404);
  } finally {
    await database.classRegistration.deleteMany({ where: { classSessionId: live.id } });
    await cleanUp(database, member, []);
    await cleanUp(database, other, [live.id]);
    await memberApp.close();
    await otherApp.close();
  }
});

function signClerkWebhook(body: string) {
  const secret = process.env["CLERK_WEBHOOK_SIGNING_SECRET"];
  if (!secret) throw new Error("CLERK_WEBHOOK_SIGNING_SECRET is required for Clerk webhook tests.");
  const id = `msg_${randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1_000).toString();
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  const signature = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");

  return {
    "content-type": "application/json",
    "svix-id": id,
    "svix-signature": `v1,${signature}`,
    "svix-timestamp": timestamp,
  };
}

test("a deleted Clerk user's personal data is removed", async () => {
  const database = createDatabaseClient();
  const member = await createMemberWithPass(database, "deleted");
  await database.userProfile.update({
    data: { firstName: "Ada", lastName: "Lovelace", phone: "+15555550100" },
    where: { id: member.user.id },
  });
  await database.passPurchase.update({
    data: { purchaserEmail: member.email },
    where: { id: member.purchase.id },
  });
  const app = await buildApp({ database });
  const body = JSON.stringify({
    data: { deleted: true, id: member.clerkUserId, object: "user" },
    object: "event",
    type: "user.deleted",
  });

  try {
    const forged = await app.inject({
      headers: { ...signClerkWebhook(body), "svix-signature": "v1,bm90LWEtcmVhbC1zaWduYXR1cmU=" },
      method: "POST",
      payload: body,
      url: "/v1/webhooks/clerk",
    });
    assert.equal(forged.statusCode, 400);

    const response = await app.inject({
      headers: signClerkWebhook(body),
      method: "POST",
      payload: body,
      url: "/v1/webhooks/clerk",
    });
    assert.equal(response.statusCode, 200);

    const user = await database.userProfile.findUniqueOrThrow({ where: { id: member.user.id } });
    assert.equal(user.email.endsWith("@deleted.invalid"), true);
    assert.equal(user.firstName, null);
    assert.equal(user.lastName, null);
    assert.equal(user.phone, null);
    const purchase = await database.passPurchase.findUniqueOrThrow({ where: { id: member.purchase.id } });
    assert.equal(purchase.purchaserEmail, null);
    assert.equal(purchase.amountTotalCents, 10_000);
  } finally {
    await cleanUp(database, member, []);
    await app.close();
  }
});

test("a Stripe webhook with an invalid signature is rejected", async () => {
  const app = await buildApp();

  try {
    const response = await app.inject({
      headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=invalid" },
      method: "POST",
      payload: JSON.stringify({ id: "evt_forged", type: "checkout.session.completed" }),
      url: "/v1/webhooks/stripe",
    });
    assert.equal(response.statusCode, 400);
  } finally {
    await app.close();
  }
});

test("unexpected errors return a generic message without internal details", async () => {
  const brokenDatabase = {
    $disconnect: async () => {},
    $queryRaw: async () => {
      throw new Error("connect ECONNREFUSED internal-db-host:5432");
    },
  } as unknown as DatabaseClient;
  const app = await buildApp({ database: brokenDatabase });

  try {
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(response.statusCode, 500);
    assert.equal(response.body.includes("internal-db-host"), false);
    assert.deepEqual(response.json(), { error: "Something went wrong. Please try again." });
  } finally {
    await app.close();
  }
});

test("starting checkout is rate limited per address", async () => {
  const app = await buildApp();

  try {
    let lastStatus = 0;
    for (let attempt = 0; attempt < 61; attempt += 1) {
      const response = await app.inject({ method: "POST", payload: {}, url: "/v1/checkout-sessions" });
      lastStatus = response.statusCode;
    }
    assert.equal(lastStatus, 429);
  } finally {
    await app.close();
  }
});
