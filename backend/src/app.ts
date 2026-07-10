import cors from "@fastify/cors";
import Fastify from "fastify";
import { createDatabaseClient } from "@dancingissogood/db";

import { config } from "./config.js";

export function buildApp() {
  const database = createDatabaseClient();
  const app = Fastify({ logger: true });

  app.register(cors, {
    credentials: true,
    origin: config.corsOrigins,
  });

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
