-- Pass status is now always set explicitly when a purchase is paid or refunded.
UPDATE "PassPurchase" SET "passStatus" = 'ACTIVE' WHERE "status" = 'PAID' AND "passStatus" IS NULL;
UPDATE "PassPurchase" SET "passStatus" = 'REFUNDED' WHERE "status" = 'REFUNDED' AND "passStatus" IS NULL;

-- A pass covers "accessDays" studio calendar days (America/Detroit) starting on the day of
-- its earliest booked class. Give passes that already have bookings their dates.
-- Timestamps are stored as UTC without a time zone.
WITH "firstClass" AS (
  SELECT r."passPurchaseId" AS "id", MIN(s."startsAt") AS "firstStartsAt"
  FROM "ClassRegistration" r
  JOIN "ClassSession" s ON s."id" = r."classSessionId"
  WHERE r."passPurchaseId" IS NOT NULL
    AND r."status" IN ('RESERVED', 'ATTENDED', 'NO_SHOW')
  GROUP BY r."passPurchaseId"
),
"firstDay" AS (
  SELECT f."id",
         date_trunc('day', (f."firstStartsAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Detroit') AS "localDay"
  FROM "firstClass" f
)
UPDATE "PassPurchase" p
SET "validFrom" = (d."localDay" AT TIME ZONE 'America/Detroit') AT TIME ZONE 'UTC',
    "validUntil" = ((d."localDay" + make_interval(days => pp."accessDays")) AT TIME ZONE 'America/Detroit') AT TIME ZONE 'UTC'
FROM "firstDay" d, "PassProduct" pp
WHERE p."id" = d."id"
  AND pp."id" = p."passProductId"
  AND p."validFrom" IS NULL;

-- Stripe event audit records no longer keep customer personal data (names, emails, addresses).
UPDATE "PaymentEvent"
SET "payload" = jsonb_build_object(
  'id', "payload" -> 'id',
  'type', "payload" -> 'type',
  'created', "payload" -> 'created',
  'livemode', "payload" -> 'livemode',
  'object', jsonb_strip_nulls(jsonb_build_object(
    'id', "payload" #> '{data,object,id}',
    'object', "payload" #> '{data,object,object}',
    'amount_total', "payload" #> '{data,object,amount_total}',
    'currency', "payload" #> '{data,object,currency}',
    'metadata', "payload" #> '{data,object,metadata}',
    'payment_intent', "payload" #> '{data,object,payment_intent}',
    'payment_status', "payload" #> '{data,object,payment_status}',
    'status', "payload" #> '{data,object,status}'
  ))
)
WHERE "payload" ? 'data';
