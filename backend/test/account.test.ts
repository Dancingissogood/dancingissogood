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
    const navigationResponse = await app.inject({ method: "GET", url: "/v1/account/navigation" });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), { error: "Authentication required." });
    assert.equal(navigationResponse.statusCode, 401);
    assert.deepEqual(navigationResponse.json(), { error: "Authentication required." });
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
  const profile = await database.userProfile.create({
    data: { clerkUserId, email: "dancer@example.com" },
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
      userId: profile.id,
    },
  });
  const processingPurchase = await database.passPurchase.create({
    data: {
      amountTotalCents: product.priceCents,
      currency: product.currency,
      passProductId: product.id,
      status: "PROCESSING",
      userId: profile.id,
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
    assert.equal(account.processingPayments.length, 1);
    assert.equal(account.processingPayments[0].id, processingPurchase.id);
    assert.equal(
      [...account.purchases, ...account.processingPayments].some(
        (purchase: { id: string }) => purchase.id === pendingPurchase.id,
      ),
      false,
    );

    const synchronizedProfile = await database.userProfile.findUniqueOrThrow({ where: { clerkUserId } });
    const claimedPaidPurchase = await database.passPurchase.findUniqueOrThrow({
      where: { id: paidPurchase.id },
    });
    const unclaimedPendingPurchase = await database.passPurchase.findUniqueOrThrow({
      where: { id: pendingPurchase.id },
    });

    assert.equal(synchronizedProfile.stripeCustomerId, stripeCustomerId);
    assert.equal(claimedPaidPurchase.userId, synchronizedProfile.id);
    assert.equal(unclaimedPendingPurchase.userId, profile.id);

    const navigationResponse = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "GET",
      url: "/v1/account/navigation",
    });

    assert.equal(navigationResponse.statusCode, 200);
    assert.deepEqual(navigationResponse.json(), { hasUsablePass: true });

    await database.passPurchase.update({
      data: { passStatus: "ACTIVE" },
      where: { id: paidPurchase.id },
    });

    const activePassNavigationResponse = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "GET",
      url: "/v1/account/navigation",
    });

    assert.equal(activePassNavigationResponse.statusCode, 200);
    assert.deepEqual(activePassNavigationResponse.json(), { hasUsablePass: true });

    await database.passPurchase.update({
      data: { passStatus: "USED" },
      where: { id: paidPurchase.id },
    });

    const usedPassNavigationResponse = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "GET",
      url: "/v1/account/navigation",
    });

    assert.equal(usedPassNavigationResponse.statusCode, 200);
    assert.deepEqual(usedPassNavigationResponse.json(), { hasUsablePass: false });
  } finally {
    await database.passPurchase.deleteMany({ where: { passProductId: product.id } });
    await database.userProfile.deleteMany({ where: { clerkUserId } });
    await database.passProduct.delete({ where: { id: product.id } });
    await app.close();
  }
});
