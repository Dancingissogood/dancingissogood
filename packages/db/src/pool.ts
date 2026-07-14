import { readFileSync } from "node:fs";
import { Pool } from "pg";

function getDatabaseUrl(): string {
  const databaseUrl = process.env["DATABASE_URL"];

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set before creating a database pool.");
  }

  return databaseUrl;
}

export function createDatabasePool(options: { max?: number } = {}): Pool {
  const caCertificatePath = process.env["DATABASE_CA_CERT_PATH"];
  const configuredPoolSize = options.max ?? Number(process.env["DATABASE_POOL_MAX"] ?? "5");

  if (!Number.isInteger(configuredPoolSize) || configuredPoolSize < 1 || configuredPoolSize > 20) {
    throw new Error("Database pool size must be an integer between 1 and 20.");
  }

  return new Pool({
    connectionString: getDatabaseUrl(),
    max: configuredPoolSize,
    ...(caCertificatePath
      ? {
          ssl: {
            ca: readFileSync(caCertificatePath, "utf8"),
            rejectUnauthorized: true,
          },
        }
      : {}),
  });
}
