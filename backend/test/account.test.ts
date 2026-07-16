import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { createDatabaseClient } from "@dancingissogood/db";

import type { IdentityProvider } from "../src/auth.js";
import { buildApp } from "../src/app.js";

const identityProvider: IdentityProvider = {
  configured: true,
  authenticate: async (request) =>
    request.headers.authorization === "Bearer valid-session"
      ? {
          clerkUserId: `user_${randomUUID()}`,
          email: "dancer@example.com",
          firstName: "Test",
          lastName: "Dancer",
          phone: "+13125550100",
        }
      : null,
};

test("account route requires an authenticated Clerk identity", async () => {
  const app = await buildApp({ identityProvider });

  try {
    const response = await app.inject({ method: "GET", url: "/v1/account" });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), { error: "Authentication required." });
  } finally {
    await app.close();
  }
});

test("account synchronization claims only paid guest purchases for the verified email", async () => {
  const database = createDatabaseClient();
  const suffix = randomUUID();
  const clerkUserId = `user_${suffix}`;
  const stripeCustomerId = `cus_${suffix.replaceAll("-", "")}`;
  const product = await database.passProduct.create({
    data: {
      accessDays: 3,
      accessEnds: "2:00 PM",
      accessStarts: "9:00 AM",
      name: "Account Test Pass",
      priceCents: 10_000,
      slug: `account-test-pass-${suffix}`,
    },
  });
  const paidPurchase = await database.passPurchase.create({
    data: {
      amountTotalCents: product.priceCents,
      currency: product.currency,
      paidAt: new Date(),
      passProductId: product.id,
      purchaserEmail: "Dancer@Example.com",
      status: "PAID",
      stripeCustomerId,
    },
  });
  const pendingPurchase = await database.passPurchase.create({
    data: {
      amountTotalCents: product.priceCents,
      currency: product.currency,
      passProductId: product.id,
      purchaserEmail: "dancer@example.com",
    },
  });
  const app = await buildApp({
    database,
    identityProvider: {
      configured: true,
      authenticate: async () => ({
        clerkUserId,
        email: "dancer@example.com",
        firstName: "Test",
        lastName: "Dancer",
        phone: null,
      }),
    },
  });

  try {
    const response = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "GET",
      url: "/v1/account",
    });

    assert.equal(response.statusCode, 200);
    const account = response.json();
    assert.equal(account.email, "dancer@example.com");
    assert.equal(account.role, "MEMBER");
    assert.equal(account.purchases.length, 1);
    assert.equal(account.purchases[0].id, paidPurchase.id);

    const profile = await database.userProfile.findUniqueOrThrow({ where: { clerkUserId } });
    const claimedPaidPurchase = await database.passPurchase.findUniqueOrThrow({
      where: { id: paidPurchase.id },
    });
    const unclaimedPendingPurchase = await database.passPurchase.findUniqueOrThrow({
      where: { id: pendingPurchase.id },
    });

    assert.equal(profile.stripeCustomerId, stripeCustomerId);
    assert.equal(claimedPaidPurchase.userId, profile.id);
    assert.equal(unclaimedPendingPurchase.userId, null);
  } finally {
    await database.passPurchase.deleteMany({ where: { passProductId: product.id } });
    await database.userProfile.deleteMany({ where: { clerkUserId } });
    await database.passProduct.delete({ where: { id: product.id } });
    await app.close();
  }
});
