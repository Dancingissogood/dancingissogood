import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { createDatabaseClient } from "@dancingissogood/db";

import type { IdentityProvider } from "../src/auth.js";
import { buildApp } from "../src/app.js";

const futureYear = new Date().getUTCFullYear() + 2;
const range = new URLSearchParams({
  from: `${futureYear}-07-01T00:00:00.000Z`,
  to: `${futureYear}-08-01T00:00:00.000Z`,
});

test("reservation routes require an authenticated account", async () => {
  const app = await buildApp({
    identityProvider: { configured: true, authenticate: async () => null },
  });

  try {
    const response = await app.inject({
      method: "GET",
      url: `/v1/account/reservations?${range.toString()}`,
    });
    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), { error: "Authentication required." });
  } finally {
    await app.close();
  }
});

test("reservations require a paid usable pass and retain cancellation history", async () => {
  const database = createDatabaseClient();
  const suffix = randomUUID();
  const clerkUserId = `reservation_${suffix}`;
  const email = `reservation-${suffix}@example.com`;
  const identityProvider: IdentityProvider = {
    configured: true,
    authenticate: async () => ({
      clerkUserId,
      email,
      firstName: "Test",
      lastName: "Dancer",
      phone: null,
    }),
  };
  const session = await database.classSession.create({
    data: {
      capacity: 1,
      classKey: "waltz",
      endsAt: new Date(`${futureYear}-07-08T13:20:00.000Z`),
      startsAt: new Date(`${futureYear}-07-08T13:00:00.000Z`),
      title: "Waltz",
    },
  });
  const product = await database.passProduct.create({
    data: {
      accessDays: 3,
      accessEnds: "2:00 PM",
      accessStarts: "9:00 AM",
      name: "Reservation Test Pass",
      priceCents: 10_000,
      slug: `reservation-pass-${suffix}`,
    },
  });
  const app = await buildApp({ database, identityProvider });
  let occupiedUserId: string | undefined;

  try {
    const withoutPass = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "POST",
      payload: { classSessionId: session.id },
      url: "/v1/account/reservations",
    });
    assert.equal(withoutPass.statusCode, 403);
    assert.equal(withoutPass.json().code, "PASS_REQUIRED");

    const user = await database.userProfile.findUniqueOrThrow({ where: { clerkUserId } });
    const purchase = await database.passPurchase.create({
      data: {
        amountTotalCents: product.priceCents,
        paidAt: new Date(),
        passProductId: product.id,
        passStatus: "ACTIVE",
        status: "PAID",
        userId: user.id,
        validFrom: new Date(`${futureYear}-07-07T00:00:00.000Z`),
        validUntil: new Date(`${futureYear}-07-09T23:59:59.000Z`),
      },
    });

    const reserve = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "POST",
      payload: { classSessionId: session.id },
      url: "/v1/account/reservations",
    });
    assert.equal(reserve.statusCode, 200);
    assert.equal(reserve.json().registration.session.id, session.id);
    assert.equal(reserve.json().registration.status, "RESERVED");

    const list = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "GET",
      url: `/v1/account/reservations?${range.toString()}`,
    });
    assert.equal(list.statusCode, 200);
    assert.deepEqual(
      list.json().registrations.map((item: { session: { id: string } }) => item.session.id),
      [session.id],
    );

    const cancel = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "DELETE",
      url: `/v1/account/reservations/${session.id}`,
    });
    assert.equal(cancel.statusCode, 204);

    const registration = await database.classRegistration.findUniqueOrThrow({
      where: {
        userId_classSessionId: {
          classSessionId: session.id,
          userId: user.id,
        },
      },
    });
    assert.equal(registration.status, "CANCELED");
    assert.ok(registration.canceledAt);

    const reserveAgain = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "POST",
      payload: { classSessionId: session.id },
      url: "/v1/account/reservations",
    });
    assert.equal(reserveAgain.statusCode, 200);
    assert.equal(await database.classRegistration.count({ where: { classSessionId: session.id } }), 1);
    assert.equal(
      (await database.classRegistration.findUniqueOrThrow({
        where: {
          userId_classSessionId: {
            classSessionId: session.id,
            userId: user.id,
          },
        },
      })).canceledAt,
      null,
    );

    await database.classSession.update({
      data: { bookingStatus: "CLOSED" },
      where: { id: session.id },
    });
    await app.inject({
      headers: { authorization: "Bearer member" },
      method: "DELETE",
      url: `/v1/account/reservations/${session.id}`,
    });
    const occupyingUser = await database.userProfile.create({
      data: {
        clerkUserId: `capacity_${suffix}`,
        email: `capacity-${suffix}@example.com`,
      },
    });
    occupiedUserId = occupyingUser.id;
    await database.classRegistration.create({
      data: { classSessionId: session.id, userId: occupyingUser.id },
    });
    const fullClass = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "POST",
      payload: { classSessionId: session.id },
      url: "/v1/account/reservations",
    });
    assert.equal(fullClass.statusCode, 409);
    assert.equal(fullClass.json().code, "NO_VACANCY");
    await database.classRegistration.deleteMany({
      where: { classSessionId: session.id, userId: occupyingUser.id },
    });
    await database.userProfile.delete({ where: { id: occupyingUser.id } });
    occupiedUserId = undefined;
    const closedClass = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "POST",
      payload: { classSessionId: session.id },
      url: "/v1/account/reservations",
    });
    assert.equal(closedClass.statusCode, 409);
    assert.equal(closedClass.json().code, "NO_VACANCY");

    await database.classRegistration.deleteMany({ where: { classSessionId: session.id } });
    await database.passPurchase.delete({ where: { id: purchase.id } });
  } finally {
    await database.classRegistration.deleteMany({ where: { classSessionId: session.id } });
    await database.passPurchase.deleteMany({ where: { passProductId: product.id } });
    await database.classSession.delete({ where: { id: session.id } });
    await database.marketingConsentEvent.deleteMany({ where: { email } });
    await database.marketingPreference.deleteMany({ where: { email } });
    await database.userProfile.deleteMany({ where: { clerkUserId } });
    if (occupiedUserId) {
      await database.userProfile.deleteMany({ where: { id: occupiedUserId } });
    }
    await database.passProduct.delete({ where: { id: product.id } });
    await app.close();
  }
});

test("an active reserved attendee can retrieve an in-progress online class link", async () => {
  const database = createDatabaseClient();
  const suffix = randomUUID();
  const clerkUserId = `join_${suffix}`;
  const email = `join-${suffix}@example.com`;
  const now = new Date();
  const identityProvider: IdentityProvider = {
    configured: true,
    authenticate: async () => ({
      clerkUserId,
      email,
      firstName: "Join",
      lastName: "Dancer",
      phone: null,
    }),
  };
  const user = await database.userProfile.create({ data: { clerkUserId, email } });
  const product = await database.passProduct.create({
    data: {
      accessDays: 3,
      accessEnds: "2:00 PM",
      accessStarts: "9:00 AM",
      name: "Join Test Pass",
      priceCents: 10_000,
      slug: `join-pass-${suffix}`,
    },
  });
  const session = await database.classSession.create({
    data: {
      classKey: "waltz",
      deliveryMode: "ONLINE",
      endsAt: new Date(now.getTime() + 10 * 60 * 1_000),
      meetUrl: "https://meet.google.com/abc-defg-hij",
      startsAt: new Date(now.getTime() - 10 * 60 * 1_000),
      title: "Online Waltz",
    },
  });
  const purchase = await database.passPurchase.create({
    data: {
      amountTotalCents: product.priceCents,
      paidAt: now,
      passProductId: product.id,
      passStatus: "ACTIVE",
      status: "PAID",
      userId: user.id,
      validFrom: new Date(now.getTime() - 60 * 60 * 1_000),
      validUntil: new Date(now.getTime() + 60 * 60 * 1_000),
    },
  });
  await database.classRegistration.create({
    data: { classSessionId: session.id, passPurchaseId: purchase.id, userId: user.id },
  });
  const app = await buildApp({ database, identityProvider });

  try {
    const response = await app.inject({
      headers: { authorization: "Bearer member" },
      method: "GET",
      url: `/v1/account/class-sessions/${session.id}/join`,
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { meetUrl: "https://meet.google.com/abc-defg-hij" });
  } finally {
    await database.classRegistration.deleteMany({ where: { classSessionId: session.id } });
    await database.passPurchase.delete({ where: { id: purchase.id } });
    await database.classSession.delete({ where: { id: session.id } });
    await database.passProduct.delete({ where: { id: product.id } });
    await database.userProfile.delete({ where: { id: user.id } });
    await app.close();
  }
});
