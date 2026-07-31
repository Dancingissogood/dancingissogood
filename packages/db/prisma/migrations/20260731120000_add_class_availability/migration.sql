CREATE TYPE "ClassDeliveryMode" AS ENUM ('IN_PERSON', 'ONLINE');
CREATE TYPE "ClassBookingStatus" AS ENUM ('OPEN', 'CLOSED');

ALTER TABLE "ClassSession"
ADD COLUMN "deliveryMode" "ClassDeliveryMode" NOT NULL DEFAULT 'IN_PERSON',
ADD COLUMN "bookingStatus" "ClassBookingStatus" NOT NULL DEFAULT 'OPEN';
