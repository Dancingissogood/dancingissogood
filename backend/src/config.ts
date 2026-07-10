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
  LANDING_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  STRIPE_SECRET_KEY: z.string().regex(/^(?:sk|rk)_(?:test|live)_/, "must be a Stripe server-side API key"),
  STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_/, "must be a Stripe webhook signing secret").optional(),
});

const parsedEnvironment = environmentSchema.parse(process.env);

export const config = {
  corsOrigins: parsedEnvironment.CORS_ORIGINS,
  landingUrl: parsedEnvironment.LANDING_URL,
  nodeEnv: parsedEnvironment.NODE_ENV,
  port: parsedEnvironment.PORT,
  stripeSecretKey: parsedEnvironment.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsedEnvironment.STRIPE_WEBHOOK_SECRET,
};
