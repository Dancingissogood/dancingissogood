import { z } from "zod";

import { classSessionSchema } from "@/lib/schedule";

export const registrationSchema = z.object({
  createdAt: z.iso.datetime(),
  id: z.string().min(1),
  session: classSessionSchema,
  status: z.enum(["RESERVED", "ATTENDED", "CANCELED", "NO_SHOW"]),
});

export const registrationListSchema = z.object({
  registrations: z.array(registrationSchema),
});

export const registrationMutationSchema = z.object({
  registration: registrationSchema,
});

export type ClassRegistration = z.infer<typeof registrationSchema>;
