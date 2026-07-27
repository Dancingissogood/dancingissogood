CREATE TYPE "MarketingConsentStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED');
CREATE TYPE "MarketingConsentSource" AS ENUM ('ONBOARDING', 'CHECKOUT', 'ACCOUNT_SETTINGS');

ALTER TABLE "ClassSession" ADD COLUMN "classKey" TEXT;
ALTER TABLE "ClassRegistration" ADD COLUMN "canceledAt" TIMESTAMP(3);

UPDATE "ClassSession"
SET "classKey" = CASE "title"
  WHEN 'Foam Rolling & Dancer''s Stretches' THEN 'foam-rolling-stretches'
  WHEN 'Argentine Tango Proficiency' THEN 'argentine-tango'
  WHEN 'Waltz Rise & Fall' THEN 'waltz'
  WHEN 'Cuban Motion' THEN 'cuban-motion'
  WHEN 'Latin Arms' THEN 'latin-arms'
  WHEN 'Samba Beats' THEN 'samba'
  WHEN 'Latin & Smooth Rhythms' THEN 'latin-smooth-rhythms'
  WHEN 'Hustle Fundamentals' THEN 'hustle-fundamentals'
  WHEN 'Adult Barre' THEN 'adult-barre'
  WHEN 'Juggling Introduction' THEN 'juggling'
  ELSE 'session-' || "id"
END;

UPDATE "ClassSession"
SET "title" = CASE "title"
  WHEN 'Argentine Tango Proficiency' THEN 'Argentine Tango'
  WHEN 'Waltz Rise & Fall' THEN 'Waltz'
  WHEN 'Samba Beats' THEN 'Samba'
  WHEN 'Juggling Introduction' THEN 'Juggling'
  ELSE "title"
END;

ALTER TABLE "ClassSession" ALTER COLUMN "classKey" SET NOT NULL;

CREATE TABLE "AdminDashboardState" (
  "userId" TEXT NOT NULL,
  "lastViewedReservationsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminDashboardState_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "MarketingPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "status" "MarketingConsentStatus" NOT NULL,
  "source" "MarketingConsentSource" NOT NULL,
  "statementVersion" TEXT NOT NULL,
  "subscribedAt" TIMESTAMP(3),
  "unsubscribedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketingPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketingConsentEvent" (
  "id" TEXT NOT NULL,
  "preferenceId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" "MarketingConsentStatus" NOT NULL,
  "source" "MarketingConsentSource" NOT NULL,
  "statementVersion" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketingConsentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketingPreference_userId_key" ON "MarketingPreference"("userId");
CREATE UNIQUE INDEX "MarketingPreference_email_key" ON "MarketingPreference"("email");
CREATE INDEX "MarketingPreference_status_updatedAt_idx" ON "MarketingPreference"("status", "updatedAt");
CREATE INDEX "MarketingConsentEvent_email_occurredAt_idx" ON "MarketingConsentEvent"("email", "occurredAt");
CREATE INDEX "MarketingConsentEvent_status_occurredAt_idx" ON "MarketingConsentEvent"("status", "occurredAt");
CREATE INDEX "ClassSession_classKey_idx" ON "ClassSession"("classKey");

ALTER TABLE "AdminDashboardState"
  ADD CONSTRAINT "AdminDashboardState_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketingPreference"
  ADD CONSTRAINT "MarketingPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MarketingConsentEvent"
  ADD CONSTRAINT "MarketingConsentEvent_preferenceId_fkey"
  FOREIGN KEY ("preferenceId") REFERENCES "MarketingPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ClassRegistration" (
  "id",
  "userId",
  "classSessionId",
  "passPurchaseId",
  "status",
  "canceledAt",
  "createdAt",
  "updatedAt"
)
SELECT
  saved."id",
  saved."userId",
  saved."classSessionId",
  pass."id",
  'RESERVED'::"RegistrationStatus",
  NULL,
  saved."createdAt",
  saved."createdAt"
FROM "SavedClassSession" AS saved
JOIN "ClassSession" AS session ON session."id" = saved."classSessionId"
JOIN LATERAL (
  SELECT purchase."id"
  FROM "PassPurchase" AS purchase
  WHERE purchase."userId" = saved."userId"
    AND purchase."status" = 'PAID'
    AND (purchase."passStatus" IS NULL OR purchase."passStatus" = 'ACTIVE')
    AND (purchase."validFrom" IS NULL OR purchase."validFrom" <= session."startsAt")
    AND (purchase."validUntil" IS NULL OR purchase."validUntil" >= session."startsAt")
  ORDER BY purchase."paidAt" DESC NULLS LAST, purchase."createdAt" DESC
  LIMIT 1
) AS pass ON TRUE
ON CONFLICT ("userId", "classSessionId") DO NOTHING;

DROP TABLE "SavedClassSession";
