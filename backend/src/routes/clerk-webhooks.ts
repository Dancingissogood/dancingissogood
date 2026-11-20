import { verifyWebhook } from "@clerk/backend/webhooks";
import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance } from "fastify";

import { anonymizeDeletedAccount } from "../accounts.js";
import { config } from "../config.js";

export async function registerClerkWebhookRoutes(
  app: FastifyInstance,
  dependencies: { database: DatabaseClient },
): Promise<void> {
  app.post(
    "/v1/webhooks/clerk",
    { config: { rateLimit: false, rawBody: true } },
    async (request, reply) => {
      if (!config.clerkWebhookSigningSecret) {
        request.log.error("Clerk webhook endpoint is not configured");
        return reply.code(503).send({ error: "Webhook endpoint is not configured." });
      }

      if (!request.rawBody) {
        return reply.code(400).send({ error: "Invalid Clerk webhook request." });
      }

      const headers = new Headers();
      for (const name of ["svix-id", "svix-timestamp", "svix-signature", "webhook-id", "webhook-timestamp", "webhook-signature"]) {
        const value = request.headers[name];
        if (typeof value === "string") headers.set(name, value);
      }

      let event;

      try {
        // Verify against the exact bytes Clerk signed, not a re-serialized body.
        event = await verifyWebhook(
          new Request("https://backend.internal/v1/webhooks/clerk", {
            body: typeof request.rawBody === "string" ? request.rawBody : new Uint8Array(request.rawBody),
            headers,
            method: "POST",
          }),
          { signingSecret: config.clerkWebhookSigningSecret },
        );
      } catch (error) {
        request.log.warn(error, "Rejected Clerk webhook signature");
        return reply.code(400).send({ error: "Invalid Clerk webhook signature." });
      }

      try {
        if (event.type === "user.deleted" && event.data.id) {
          await anonymizeDeletedAccount(dependencies.database, event.data.id);
        }
      } catch (error) {
        request.log.error(error, "Unable to process Clerk webhook");
        return reply.code(500).send({ error: "Unable to process Clerk webhook." });
      }

      return reply.code(200).send({ received: true });
    },
  );
}
