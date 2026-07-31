import { z } from "zod";

export const classDeliveryModeSchema = z.enum(["IN_PERSON", "ONLINE"]);
export const classBookingStatusSchema = z.enum(["OPEN", "CLOSED"]);
export const classAvailabilityStatusSchema = z.enum(["AVAILABLE", "NO_VACANCY"]);

export const classSessionSchema = z.object({
  availabilityStatus: classAvailabilityStatusSchema,
  bookingStatus: classBookingStatusSchema,
  capacity: z.number().int().nullable(),
  classKey: z.string(),
  deliveryMode: classDeliveryModeSchema,
  description: z.string().nullable(),
  endsAt: z.iso.datetime(),
  id: z.string(),
  instructorName: z.string().nullable(),
  locationName: z.string().nullable(),
  published: z.boolean(),
  reservationCount: z.number().int().nonnegative(),
  spotsRemaining: z.number().int().nonnegative().nullable(),
  startsAt: z.iso.datetime(),
  title: z.string(),
});

export const classSessionListSchema = z.object({
  sessions: z.array(classSessionSchema),
});

export const classSessionMutationSchema = z.object({
  session: classSessionSchema,
});

export const bulkClassSessionUpdateSchema = z.object({
  updated: z.number().int().nonnegative(),
});

export type ClassSession = z.infer<typeof classSessionSchema>;
