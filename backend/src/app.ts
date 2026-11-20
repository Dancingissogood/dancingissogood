import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import fastifyRawBody from "fastify-raw-body";
import { createDatabaseClient } from "@dancingissogood/db";
import type { DatabaseClient } from "@dancingissogood/db";
import type Stripe from "stripe";

import { createClerkIdentityProvider } from "./auth.js";
import type { IdentityProvider } from "./auth.js";
import { config } from "./config.js";
import { registerAdminDashboardRoutes } from "./routes/admin-dashboard.js";
import { registerAccountRoutes } from "./routes/account.js";
import { registerCheckoutRoutes } from "./routes/checkout.js";
import { registerClassSessionRoutes } from "./routes/class-sessions.js";
import { registerClerkWebhookRoutes } from "./routes/clerk-webhooks.js";
import { registerRegistrationRoutes } from "./routes/registrations.js";
import { registerStripeWebhookRoutes } from "./routes/stripe-webhooks.js";
import { createStripeClient } from "./stripe.js";

type AppDependencies = {
  database?: DatabaseClient;
  identityProvider?: IdentityProvider;
  stripe?: Stripe;
};

export async function buildApp(dependencies: AppDependencies = {}) {
  const database = dependencies.database ?? createDatabaseClient();
  const identityProvider =
    dependencies.identityProvider ?? createClerkIdentityProvider(config.clerk);
  const stripe = dependencies.stripe ?? createStripeClient();
  const app = Fastify({
    logger: true,
    // In production the API is only reachable through Caddy on the same host, so the
    // client address is the last X-Forwarded-For entry Caddy adds.
    trustProxy: config.nodeEnv === "production" ? (_address: string, hop: number) => hop < 1 : false,
  });

  // Unexpected errors are logged in full but never sent to the client.
  app.setErrorHandler((error: { statusCode?: number; message: string }, request, reply) => {
    const statusCode =
      typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 500
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      request.log.error(error, "Unhandled request error");
      return reply.code(500).send({ error: "Something went wrong. Please try again." });
    }

    return reply.code(statusCode).send({ error: error.message });
  });

  app.register(cors, {
    credentials: true,
    origin: config.corsOrigins,
  });
  // A broad per-address limit protects the API (and Stripe/Clerk quotas) from floods.
  // Pages call the API from the landing site's servers, so limits are generous.
  await app.register(rateLimit, {
    max: 1_200,
    timeWindow: "1 minute",
  });
  await app.register(fastifyRawBody, {
    encoding: false,
    global: false,
    runFirst: true,
  });

  await registerAccountRoutes(app, { database, identityProvider });
  await registerAdminDashboardRoutes(app, { database, identityProvider });
  await registerClassSessionRoutes(app, { database, identityProvider });
  await registerRegistrationRoutes(app, { database, identityProvider });
  await registerCheckoutRoutes(app, { database, identityProvider, stripe });
  await registerStripeWebhookRoutes(app, { database, stripe });
  await registerClerkWebhookRoutes(app, { database });

  app.get("/health/live", { config: { rateLimit: false } }, async () => ({ status: "ok" }));

  app.get("/health/ready", { config: { rateLimit: false } }, async () => {
    await database.$queryRaw`SELECT 1`;

    return { status: "ok" };
  });

  app.addHook("onClose", async () => {
    await database.$disconnect();
  });

  return app;
}
