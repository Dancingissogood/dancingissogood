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
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().regex(/^whsec_/, "must be a Clerk webhook signing secret").optional(),
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

  if (environment.NODE_ENV === "production") {
    // Without the webhook secret, paid checkouts would never be confirmed.
    if (!environment.STRIPE_WEBHOOK_SECRET) {
      context.addIssue({
        code: "custom",
        message: "STRIPE_WEBHOOK_SECRET is required in production",
        path: ["STRIPE_WEBHOOK_SECRET"],
      });
    }

    if (isLocalhostUrl(environment.LANDING_URL)) {
      context.addIssue({
        code: "custom",
        message: "LANDING_URL must be set to the public site in production",
        path: ["LANDING_URL"],
      });
    }

    if (environment.CORS_ORIGINS.some(isLocalhostUrl)) {
      context.addIssue({
        code: "custom",
        message: "CORS_ORIGINS must not include localhost in production",
        path: ["CORS_ORIGINS"],
      });
    }
  }
});

function isLocalhostUrl(value: string) {
  const { hostname } = new URL(value);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

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
  clerkWebhookSigningSecret: parsedEnvironment.CLERK_WEBHOOK_SIGNING_SECRET,
  corsOrigins: parsedEnvironment.CORS_ORIGINS,
  landingUrl: parsedEnvironment.LANDING_URL,
  nodeEnv: parsedEnvironment.NODE_ENV,
  port: parsedEnvironment.PORT,
  stripeSecretKey: parsedEnvironment.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsedEnvironment.STRIPE_WEBHOOK_SECRET,
};
