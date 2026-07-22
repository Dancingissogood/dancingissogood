import { z } from "zod";

import { classSessionSchema } from "@/lib/schedule";

export const savedClassSessionSchema = z.object({
  createdAt: z.iso.datetime(),
  id: z.string().min(1),
  session: classSessionSchema,
});

export const savedClassSessionListSchema = z.object({
  selections: z.array(savedClassSessionSchema),
});

export const savedClassSessionMutationSchema = z.object({
  selection: savedClassSessionSchema,
});

export type SavedClassSession = z.infer<typeof savedClassSessionSchema>;
