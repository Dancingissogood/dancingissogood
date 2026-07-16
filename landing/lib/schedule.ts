import { z } from "zod";

export const classSessionSchema = z.object({
  capacity: z.number().int().nullable(),
  description: z.string().nullable(),
  endsAt: z.iso.datetime(),
  id: z.string(),
  instructorName: z.string().nullable(),
  locationName: z.string().nullable(),
  published: z.boolean(),
  startsAt: z.iso.datetime(),
  title: z.string(),
});

export const classSessionListSchema = z.object({
  sessions: z.array(classSessionSchema),
});

export const classSessionMutationSchema = z.object({
  session: classSessionSchema,
});

export type ClassSession = z.infer<typeof classSessionSchema>;
