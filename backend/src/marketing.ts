import type { DatabaseClient } from "@dancingissogood/db";

export const MARKETING_CONSENT_STATEMENT_VERSION = "2026-07-26";

type MarketingDatabase = Pick<
  DatabaseClient,
  "marketingConsentEvent" | "marketingPreference"
>;

type MarketingPreferenceInput = {
  email: string;
  source: "ONBOARDING" | "CHECKOUT" | "ACCOUNT_SETTINGS";
  status: "SUBSCRIBED" | "UNSUBSCRIBED";
  userId?: string | null;
};

export async function recordMarketingPreference(
  database: MarketingDatabase,
  input: MarketingPreferenceInput,
) {
  const email = input.email.trim().toLowerCase();
  const occurredAt = new Date();
  const byEmail = await database.marketingPreference.findUnique({ where: { email } });
  const byUser = input.userId
    ? await database.marketingPreference.findUnique({ where: { userId: input.userId } })
    : null;
  // A member's own preference row wins; it follows them when their email changes.
  const existing = byUser ?? byEmail;
  const subscribedAt =
    input.status === "SUBSCRIBED" ? existing?.subscribedAt ?? occurredAt : existing?.subscribedAt;
  const changes = {
    source: input.source,
    statementVersion: MARKETING_CONSENT_STATEMENT_VERSION,
    status: input.status,
    subscribedAt,
    unsubscribedAt: input.status === "UNSUBSCRIBED" ? occurredAt : null,
  };

  let preference;

  if (!existing) {
    preference = await database.marketingPreference.create({
      data: { ...changes, email, userId: input.userId ?? null },
    });
  } else if (existing === byUser) {
    // Move the row to the new address only when no other row already holds it.
    const emailIsFree = !byEmail || byEmail.id === byUser.id;
    preference = await database.marketingPreference.update({
      data: { ...changes, ...(emailIsFree ? { email } : {}) },
      where: { id: byUser.id },
    });
  } else {
    // Link a guest row to the member, but never take a row that belongs to someone else.
    const canLink = input.userId && !existing.userId;
    preference = await database.marketingPreference.update({
      data: { ...changes, ...(canLink ? { userId: input.userId } : {}) },
      where: { id: existing.id },
    });
  }

  await database.marketingConsentEvent.create({
    data: {
      email,
      occurredAt,
      preferenceId: preference.id,
      source: input.source,
      statementVersion: MARKETING_CONSENT_STATEMENT_VERSION,
      status: input.status,
    },
  });

  return preference;
}
