import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client/client.ts";

function getDatabaseUrl(): string {
  const databaseUrl = process.env["DATABASE_URL"];

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set before creating a database client.");
  }

  return databaseUrl;
}

export function createDatabaseClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  });
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
