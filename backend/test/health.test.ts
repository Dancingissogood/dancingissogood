import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "../src/app.js";

test("live health check responds without database access", async () => {
  const app = await buildApp();

  try {
    const response = await app.inject({ method: "GET", url: "/health/live" });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: "ok" });
  } finally {
    await app.close();
  }
});

test("ready health check confirms database connectivity", async () => {
  const app = await buildApp();

  try {
    const response = await app.inject({ method: "GET", url: "/health/ready" });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: "ok" });
  } finally {
    await app.close();
  }
});
