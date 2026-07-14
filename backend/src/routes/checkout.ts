import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance } from "fastify";
import type Stripe from "stripe";
import { z } from "zod";

import { synchronizeAccount } from "../accounts.js";
import type { IdentityProvider } from "../auth.js";
import { createPassCheckoutSession } from "../payments.js";

const checkoutRequestSchema = z
  .object({
    passSlug: z.string().min(1).max(100),
  })
  .strict();

export async function registerCheckoutRoutes(
  app: FastifyInstance,
  dependencies: {
    database: DatabaseClient;
    identityProvider: IdentityProvider;
    stripe: Stripe;
  },
): Promise<void> {
  app.post("/v1/checkout-sessions", async (request, reply) => {
    const parsedRequest = checkoutRequestSchema.safeParse(request.body);

    if (!parsedRequest.success) {
      return reply.code(400).send({ error: "Invalid checkout request." });
    }

    try {
      const identity = await dependencies.identityProvider.authenticate(request);
      const user = identity
        ? await synchronizeAccount(dependencies.database, identity)
        : null;
      const checkoutSession = await createPassCheckoutSession(
        dependencies,
        parsedRequest.data.passSlug,
        user
          ? {
              email: user.email,
              stripeCustomerId: user.stripeCustomerId,
              userId: user.id,
            }
          : null,
      );

      if (!checkoutSession) {
        return reply.code(404).send({ error: "This pass is not currently available." });
      }

      return reply.code(201).send({ url: checkoutSession.url });
    } catch (error) {
      request.log.error(error, "Unable to create Stripe Checkout session");
      return reply.code(502).send({ error: "Unable to start checkout. Please try again." });
    }
  });

  app.get("/v1/checkout-sessions/:sessionId", async (request, reply) => {
    const sessionId = (request.params as { sessionId?: string }).sessionId;

    if (!sessionId || !/^cs_(?:test|live)_/.test(sessionId)) {
      return reply.code(400).send({ error: "Invalid Checkout session." });
    }

    try {
      const checkoutSession = await dependencies.stripe.checkout.sessions.retrieve(sessionId);

      if (!checkoutSession.metadata?.passPurchaseId) {
        return reply.code(404).send({ error: "Checkout session not found." });
      }

      return reply.send({
        paymentStatus: checkoutSession.payment_status,
        status: checkoutSession.status,
      });
    } catch (error) {
      request.log.error(error, "Unable to retrieve Stripe Checkout session");
      return reply.code(404).send({ error: "Checkout session not found." });
    }
  });
}
