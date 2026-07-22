import type { DatabaseClient } from "@dancingissogood/db";

import type { AccountIdentity } from "./auth.js";

export class AccountIdentityConflictError extends Error {}

export async function synchronizeAccount(
  database: DatabaseClient,
  identity: AccountIdentity,
) {
  return database.$transaction(async (transaction) => {
    const emailOwner = await transaction.userProfile.findUnique({
      where: { email: identity.email },
    });

    if (emailOwner && emailOwner.clerkUserId !== identity.clerkUserId) {
      throw new AccountIdentityConflictError(
        "The verified email address is already associated with another account.",
      );
    }

    const user = await transaction.userProfile.upsert({
      create: {
        clerkUserId: identity.clerkUserId,
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        phone: identity.phone,
      },
      update: {
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        phone: identity.phone,
      },
      where: { clerkUserId: identity.clerkUserId },
    });

    await transaction.passPurchase.updateMany({
      data: { userId: user.id },
      where: {
        purchaserEmail: { equals: identity.email, mode: "insensitive" },
        status: "PAID",
        userId: null,
      },
    });

    const latestStripePurchase = await transaction.passPurchase.findFirst({
      orderBy: { paidAt: "desc" },
      select: { stripeCustomerId: true },
      where: {
        stripeCustomerId: { not: null },
        userId: user.id,
      },
    });

    if (!user.stripeCustomerId && latestStripePurchase?.stripeCustomerId) {
      return transaction.userProfile.update({
        data: { stripeCustomerId: latestStripePurchase.stripeCustomerId },
        where: { id: user.id },
      });
    }

    return user;
  });
}

export async function getAccountSummary(database: DatabaseClient, userId: string) {
  const user = await database.userProfile.findUniqueOrThrow({
    include: {
      purchases: {
        include: { passProduct: true },
        orderBy: { createdAt: "desc" },
        where: { status: { in: ["PAID", "PROCESSING", "REFUNDED"] } },
      },
    },
    where: { id: userId },
  });

  const serializePurchase = (purchase: (typeof user.purchases)[number]) => ({
    amountTotalCents: purchase.amountTotalCents,
    createdAt: purchase.createdAt.toISOString(),
    currency: purchase.currency,
    id: purchase.id,
    paidAt: purchase.paidAt?.toISOString() ?? null,
    pass: {
      accessDays: purchase.passProduct.accessDays,
      accessEnds: purchase.passProduct.accessEnds,
      accessStarts: purchase.passProduct.accessStarts,
      name: purchase.passProduct.name,
    },
    passStatus: purchase.passStatus,
    status: purchase.status,
    validFrom: purchase.validFrom?.toISOString() ?? null,
    validUntil: purchase.validUntil?.toISOString() ?? null,
  });

  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    processingPayments: user.purchases
      .filter((purchase) => purchase.status === "PROCESSING")
      .map(serializePurchase),
    purchases: user.purchases
      .filter((purchase) => purchase.status === "PAID" || purchase.status === "REFUNDED")
      .map(serializePurchase),
  };
}

export async function getAccountNavigationState(database: DatabaseClient, userId: string) {
  const usablePass = await database.passPurchase.findFirst({
    select: { id: true },
    where: {
      OR: [{ passStatus: null }, { passStatus: "ACTIVE" }],
      status: "PAID",
      userId,
    },
  });

  return { hasUsablePass: usablePass !== null };
}
