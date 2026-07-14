import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client/client.ts";
import { createDatabasePool } from "./pool.js";

export function createDatabaseClient() {
  const pool = createDatabasePool();

  return new PrismaClient({
    adapter: new PrismaPg(pool),
  });
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
