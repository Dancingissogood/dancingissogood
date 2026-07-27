import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import {
  AccountIdentityConflictError,
  getAccountNavigationState,
  getAccountSummary,
  synchronizeAccount,
} from "../accounts.js";
import type { IdentityProvider } from "../auth.js";
import { recordMarketingPreference } from "../marketing.js";

const marketingPreferenceSchema = z.object({ subscribed: z.boolean() }).strict();

export async function registerAccountRoutes(
  app: FastifyInstance,
  dependencies: { database: DatabaseClient; identityProvider: IdentityProvider },
): Promise<void> {
  app.get("/v1/account", async (request, reply) => {
    if (!dependencies.identityProvider.configured) {
      return reply.code(503).send({ error: "Account access is not configured." });
    }

    try {
      const identity = await dependencies.identityProvider.authenticate(request);

      if (!identity) {
        return reply.code(401).send({ error: "Authentication required." });
      }

      const user = await synchronizeAccount(dependencies.database, identity);
      const account = await getAccountSummary(dependencies.database, user.id);

      return reply.send(account);
    } catch (error) {
      if (error instanceof AccountIdentityConflictError) {
        request.log.warn(error, "Account identity conflict");
        return reply.code(409).send({ error: error.message });
      }

      request.log.error(error, "Unable to load account");
      return reply.code(502).send({ error: "Unable to load account. Please try again." });
    }
  });

  app.get("/v1/account/navigation", async (request, reply) => {
    if (!dependencies.identityProvider.configured) {
      return reply.code(503).send({ error: "Account access is not configured." });
    }

    try {
      const identity = await dependencies.identityProvider.authenticate(request);

      if (!identity) {
        return reply.code(401).send({ error: "Authentication required." });
      }

      const user = await synchronizeAccount(dependencies.database, identity);
      const navigation = await getAccountNavigationState(dependencies.database, user.id);

      return reply.send(navigation);
    } catch (error) {
      if (error instanceof AccountIdentityConflictError) {
        request.log.warn(error, "Account identity conflict");
        return reply.code(409).send({ error: error.message });
      }

      request.log.error(error, "Unable to load account navigation state");
      return reply.code(502).send({ error: "Unable to load account navigation state." });
    }
  });

  app.get("/v1/account/marketing-preference", async (request, reply) => {
    if (!dependencies.identityProvider.configured) {
      return reply.code(503).send({ error: "Account access is not configured." });
    }

    try {
      const identity = await dependencies.identityProvider.authenticate(request);
      if (!identity) return reply.code(401).send({ error: "Authentication required." });

      const user = await synchronizeAccount(dependencies.database, identity);
      const preference = await dependencies.database.marketingPreference.findUnique({
        where: { email: user.email.toLowerCase() },
      });

      reply.header("cache-control", "no-store");
      return reply.send({ subscribed: preference?.status === "SUBSCRIBED" });
    } catch (error) {
      return handleAccountError(request, reply, error, "load communication preferences");
    }
  });

  app.put("/v1/account/marketing-preference", async (request, reply) => {
    const body = marketingPreferenceSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "Invalid communication preference." });

    if (!dependencies.identityProvider.configured) {
      return reply.code(503).send({ error: "Account access is not configured." });
    }

    try {
      const identity = await dependencies.identityProvider.authenticate(request);
      if (!identity) return reply.code(401).send({ error: "Authentication required." });

      const user = await synchronizeAccount(dependencies.database, identity);
      const preference = await dependencies.database.$transaction((transaction) =>
        recordMarketingPreference(transaction, {
          email: user.email,
          source: "ACCOUNT_SETTINGS",
          status: body.data.subscribed ? "SUBSCRIBED" : "UNSUBSCRIBED",
          userId: user.id,
        }),
      );

      reply.header("cache-control", "no-store");
      return reply.send({ subscribed: preference.status === "SUBSCRIBED" });
    } catch (error) {
      return handleAccountError(request, reply, error, "update communication preferences");
    }
  });
}

function handleAccountError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  action: string,
) {
  if (error instanceof AccountIdentityConflictError) {
    request.log.warn(error, "Account identity conflict");
    return reply.code(409).send({ error: error.message });
  }

  request.log.error(error, `Unable to ${action}`);
  return reply.code(502).send({ error: `Unable to ${action}. Please try again.` });
}
