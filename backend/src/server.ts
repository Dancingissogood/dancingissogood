import { buildApp } from "./app.js";
import { config } from "./config.js";

const app = buildApp();

async function stop(signal: string) {
  app.log.info({ signal }, "Shutting down backend service");
  await app.close();
  process.exit(0);
}

process.once("SIGINT", () => void stop("SIGINT"));
process.once("SIGTERM", () => void stop("SIGTERM"));

try {
  await app.listen({ host: "0.0.0.0", port: config.port });
} catch (error) {
  app.log.error(error, "Backend service failed to start");
  process.exit(1);
}
