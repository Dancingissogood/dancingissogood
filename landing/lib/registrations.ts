import { z } from "zod";

import { publicClassSessionSchema } from "@/lib/schedule";

export const registrationSchema = z.object({
  createdAt: z.iso.datetime(),
  id: z.string().min(1),
  session: publicClassSessionSchema,
  status: z.enum(["RESERVED", "ATTENDED", "CANCELED", "NO_SHOW"]),
});

export const registrationListSchema = z.object({
  registrations: z.array(registrationSchema),
});

export const registrationMutationSchema = z.object({
  registration: registrationSchema,
});

export const classJoinSchema = z.object({
  meetUrl: z.string().url(),
});

export type ClassRegistration = z.infer<typeof registrationSchema>;
