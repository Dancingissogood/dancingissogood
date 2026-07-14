import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance } from "fastify";

import { AccountIdentityConflictError, getAccountSummary, synchronizeAccount } from "../accounts.js";
import type { IdentityProvider } from "../auth.js";

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
}
