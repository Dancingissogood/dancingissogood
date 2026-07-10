import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance } from "fastify";
import type Stripe from "stripe";

import { config } from "../config.js";
import { processStripeEvent } from "../payments.js";

export async function registerStripeWebhookRoutes(
  app: FastifyInstance,
  dependencies: { database: DatabaseClient; stripe: Stripe },
): Promise<void> {
  app.post(
    "/v1/webhooks/stripe",
    { config: { rawBody: true } },
    async (request, reply) => {
      if (!config.stripeWebhookSecret) {
        request.log.error("Stripe webhook endpoint is not configured");
        return reply.code(503).send({ error: "Webhook endpoint is not configured." });
      }

      const signature = request.headers["stripe-signature"];

      if (typeof signature !== "string" || !request.rawBody) {
        return reply.code(400).send({ error: "Invalid Stripe webhook request." });
      }

      let event: Stripe.Event;

      try {
        event = dependencies.stripe.webhooks.constructEvent(
          request.rawBody,
          signature,
          config.stripeWebhookSecret,
        );
      } catch (error) {
        request.log.warn(error, "Rejected Stripe webhook signature");
        return reply.code(400).send({ error: "Invalid Stripe webhook signature." });
      }

      try {
        await processStripeEvent(dependencies.database, event);
      } catch (error) {
        request.log.error({ err: error, eventId: event.id }, "Unable to process Stripe webhook");
        return reply.code(500).send({ error: "Unable to process Stripe webhook." });
      }

      return reply.code(200).send({ received: true });
    },
  );
}
