import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyRequest } from "fastify";

import { synchronizeAccount } from "./accounts.js";
import type { IdentityProvider } from "./auth.js";

export type AuthorizationResult =
  | { status: "authorized"; userId: string }
  | { status: "not-configured" | "unauthenticated" | "forbidden" };

export async function authorizeAdministrator(
  request: FastifyRequest,
  dependencies: { database: DatabaseClient; identityProvider: IdentityProvider },
): Promise<AuthorizationResult> {
  if (!dependencies.identityProvider.configured) {
    return { status: "not-configured" };
  }

  const identity = await dependencies.identityProvider.authenticate(request);

  if (!identity) {
    return { status: "unauthenticated" };
  }

  const user = await synchronizeAccount(dependencies.database, identity);

  return user.role === "ADMIN"
    ? { status: "authorized", userId: user.id }
    : { status: "forbidden" };
}
