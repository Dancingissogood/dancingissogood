CREATE TABLE "SavedClassSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedClassSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedClassSession_userId_classSessionId_key"
ON "SavedClassSession"("userId", "classSessionId");

CREATE INDEX "SavedClassSession_userId_createdAt_idx"
ON "SavedClassSession"("userId", "createdAt");

CREATE INDEX "SavedClassSession_classSessionId_idx"
ON "SavedClassSession"("classSessionId");

ALTER TABLE "SavedClassSession"
ADD CONSTRAINT "SavedClassSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedClassSession"
ADD CONSTRAINT "SavedClassSession_classSessionId_fkey"
FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
