import cors from "@fastify/cors";
import Fastify from "fastify";
import fastifyRawBody from "fastify-raw-body";
import { createDatabaseClient } from "@dancingissogood/db";
import type { DatabaseClient } from "@dancingissogood/db";
import type Stripe from "stripe";

import { createClerkIdentityProvider } from "./auth.js";
import type { IdentityProvider } from "./auth.js";
import { config } from "./config.js";
import { registerAccountRoutes } from "./routes/account.js";
import { registerCheckoutRoutes } from "./routes/checkout.js";
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
  const app = Fastify({ logger: true });

  app.register(cors, {
    credentials: true,
    origin: config.corsOrigins,
  });
  await app.register(fastifyRawBody, {
    encoding: false,
    global: false,
    runFirst: true,
  });

  await registerAccountRoutes(app, { database, identityProvider });
  await registerCheckoutRoutes(app, { database, identityProvider, stripe });
  await registerStripeWebhookRoutes(app, { database, stripe });

  app.get("/health/live", async () => ({ status: "ok" }));

  app.get("/health/ready", async () => {
    await database.$queryRaw`SELECT 1`;

    return { status: "ok" };
  });

  app.addHook("onClose", async () => {
    await database.$disconnect();
  });

  return app;
}
