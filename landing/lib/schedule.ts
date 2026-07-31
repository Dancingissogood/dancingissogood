import { z } from "zod";

export const classDeliveryModeSchema = z.enum(["IN_PERSON", "ONLINE"]);
export const classBookingStatusSchema = z.enum(["OPEN", "CLOSED"]);
export const classAvailabilityStatusSchema = z.enum(["AVAILABLE", "NO_VACANCY"]);

const classSessionBaseSchema = z.object({
  availabilityStatus: classAvailabilityStatusSchema,
  classKey: z.string(),
  deliveryMode: classDeliveryModeSchema,
  description: z.string().nullable(),
  endsAt: z.iso.datetime(),
  id: z.string(),
  instructorName: z.string().nullable(),
  locationName: z.string().nullable(),
  published: z.boolean(),
  startsAt: z.iso.datetime(),
  title: z.string(),
});

export const publicClassSessionSchema = classSessionBaseSchema;

export const adminClassSessionSchema = classSessionBaseSchema.extend({
  bookingStatus: classBookingStatusSchema,
  capacity: z.number().int().nullable(),
  meetUrl: z.string().url().nullable(),
  reservationCount: z.number().int().nonnegative(),
  spotsRemaining: z.number().int().nonnegative().nullable(),
});

export const classSessionListSchema = z.object({
  sessions: z.array(publicClassSessionSchema),
});

export const adminClassSessionListSchema = z.object({
  sessions: z.array(adminClassSessionSchema),
});

export const classSessionMutationSchema = z.object({
  session: adminClassSessionSchema,
});

export const bulkClassSessionUpdateSchema = z.object({
  updated: z.number().int().nonnegative(),
});

export type PublicClassSession = z.infer<typeof publicClassSessionSchema>;
export type AdminClassSession = z.infer<typeof adminClassSessionSchema>;
