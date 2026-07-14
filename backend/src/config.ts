import { z } from "zod";

const corsOriginsSchema = z
  .string()
  .min(1)
  .default("http://localhost:3000")
  .transform((value) => value.split(",").map((origin) => origin.trim()))
  .pipe(z.array(z.string().url()).min(1));

const environmentSchema = z.object({
  CLERK_PUBLISHABLE_KEY: z.string().regex(/^pk_(?:test|live)_/).optional(),
  CLERK_SECRET_KEY: z.string().regex(/^sk_(?:test|live)_/).optional(),
  CORS_ORIGINS: corsOriginsSchema,
  DATABASE_URL: z.string().url(),
  LANDING_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  STRIPE_SECRET_KEY: z.string().regex(/^(?:sk|rk)_(?:test|live)_/, "must be a Stripe server-side API key"),
  STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_/, "must be a Stripe webhook signing secret").optional(),
}).superRefine((environment, context) => {
  const hasPublishableKey = Boolean(environment.CLERK_PUBLISHABLE_KEY);
  const hasSecretKey = Boolean(environment.CLERK_SECRET_KEY);

  if (hasPublishableKey !== hasSecretKey) {
    context.addIssue({
      code: "custom",
      message: "CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY must be configured together",
      path: hasPublishableKey ? ["CLERK_SECRET_KEY"] : ["CLERK_PUBLISHABLE_KEY"],
    });
  }

  if (environment.NODE_ENV === "production" && (!hasPublishableKey || !hasSecretKey)) {
    context.addIssue({
      code: "custom",
      message: "Clerk credentials are required in production",
      path: ["CLERK_SECRET_KEY"],
    });
  }
});

const parsedEnvironment = environmentSchema.parse(process.env);

export const config = {
  clerk:
    parsedEnvironment.CLERK_PUBLISHABLE_KEY && parsedEnvironment.CLERK_SECRET_KEY
      ? {
          authorizedParties: parsedEnvironment.CORS_ORIGINS,
          publishableKey: parsedEnvironment.CLERK_PUBLISHABLE_KEY,
          secretKey: parsedEnvironment.CLERK_SECRET_KEY,
        }
      : null,
  corsOrigins: parsedEnvironment.CORS_ORIGINS,
  landingUrl: parsedEnvironment.LANDING_URL,
  nodeEnv: parsedEnvironment.NODE_ENV,
  port: parsedEnvironment.PORT,
  stripeSecretKey: parsedEnvironment.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsedEnvironment.STRIPE_WEBHOOK_SECRET,
};
