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
  const existing = await database.marketingPreference.findUnique({ where: { email } });
  const subscribedAt =
    input.status === "SUBSCRIBED" ? existing?.subscribedAt ?? occurredAt : existing?.subscribedAt;

  const preference = await database.marketingPreference.upsert({
    create: {
      email,
      source: input.source,
      statementVersion: MARKETING_CONSENT_STATEMENT_VERSION,
      status: input.status,
      subscribedAt,
      unsubscribedAt: input.status === "UNSUBSCRIBED" ? occurredAt : null,
      userId: input.userId ?? null,
    },
    update: {
      source: input.source,
      statementVersion: MARKETING_CONSENT_STATEMENT_VERSION,
      status: input.status,
      subscribedAt,
      unsubscribedAt: input.status === "UNSUBSCRIBED" ? occurredAt : null,
      ...(input.userId ? { userId: input.userId } : {}),
    },
    where: { email },
  });

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
