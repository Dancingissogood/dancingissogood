ALTER TABLE "ClassRegistration"
DROP CONSTRAINT "ClassRegistration_classSessionId_fkey";

ALTER TABLE "ClassRegistration"
ADD CONSTRAINT "ClassRegistration_classSessionId_fkey"
FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
