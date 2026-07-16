CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'ADMIN');

ALTER TABLE "UserProfile"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

ALTER TABLE "ClassSession"
ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

CREATE INDEX "ClassSession_published_startsAt_idx"
ON "ClassSession"("published", "startsAt");

CREATE INDEX "ClassSession_createdById_idx"
ON "ClassSession"("createdById");

CREATE INDEX "ClassSession_updatedById_idx"
ON "ClassSession"("updatedById");

ALTER TABLE "ClassSession"
ADD CONSTRAINT "ClassSession_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "UserProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClassSession"
ADD CONSTRAINT "ClassSession_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "UserProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
