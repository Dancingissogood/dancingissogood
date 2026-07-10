import { z } from "zod";

const corsOriginsSchema = z
  .string()
  .min(1)
  .default("http://localhost:3000")
  .transform((value) => value.split(",").map((origin) => origin.trim()))
  .pipe(z.array(z.string().url()).min(1));

const environmentSchema = z.object({
  CORS_ORIGINS: corsOriginsSchema,
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
});

const parsedEnvironment = environmentSchema.parse(process.env);

export const config = {
  corsOrigins: parsedEnvironment.CORS_ORIGINS,
  nodeEnv: parsedEnvironment.NODE_ENV,
  port: parsedEnvironment.PORT,
};
