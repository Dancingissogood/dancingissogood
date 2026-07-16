import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { createDatabaseClient } from "@dancingissogood/db";

import type { IdentityProvider } from "../src/auth.js";
import { buildApp } from "../src/app.js";

const queryRange = new URLSearchParams({
  from: "2026-07-20T00:00:00.000Z",
  to: "2026-07-27T00:00:00.000Z",
});

test("public schedule returns only published sessions in the requested range", async () => {
  const database = createDatabaseClient();
  const suffix = randomUUID();
  const published = await database.classSession.create({
    data: {
      endsAt: new Date("2026-07-20T13:20:00.000Z"),
      published: true,
      startsAt: new Date("2026-07-20T13:00:00.000Z"),
      title: `Published ${suffix}`,
    },
  });
  const unpublished = await database.classSession.create({
    data: {
      endsAt: new Date("2026-07-20T13:40:00.000Z"),
      published: false,
      startsAt: new Date("2026-07-20T13:20:00.000Z"),
      title: `Unpublished ${suffix}`,
    },
  });
  const app = await buildApp({ database });

  try {
    const response = await app.inject({
      method: "GET",
      url: `/v1/class-sessions?${queryRange.toString()}`,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cache-control"], "no-store");
    const ids = response.json().sessions.map((session: { id: string }) => session.id);
    assert.equal(ids.includes(published.id), true);
    assert.equal(ids.includes(unpublished.id), false);
  } finally {
    await database.classSession.deleteMany({ where: { id: { in: [published.id, unpublished.id] } } });
    await app.close();
  }
});

test("schedule administration requires the database administrator role", async () => {
  const database = createDatabaseClient();
  const suffix = randomUUID();
  const clerkUserId = `user_${suffix}`;
  const identityProvider: IdentityProvider = {
    configured: true,
    authenticate: async () => ({
      clerkUserId,
      email: `member-${suffix}@example.com`,
      firstName: "Test",
      lastName: "Member",
      phone: null,
    }),
  };
  const app = await buildApp({ database, identityProvider });

  try {
    const response = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "POST",
      payload: validSessionPayload(`Member ${suffix}`),
      url: "/v1/admin/class-sessions",
    });

    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.json(), { error: "Administrator access required." });
    assert.equal(await database.classSession.count({ where: { title: `Member ${suffix}` } }), 0);
  } finally {
    await database.userProfile.deleteMany({ where: { clerkUserId } });
    await app.close();
  }
});

test("an administrator can create, move, list, and delete a 20-minute class", async () => {
  const database = createDatabaseClient();
  const suffix = randomUUID();
  const clerkUserId = `user_${suffix}`;
  const email = `admin-${suffix}@example.com`;
  const user = await database.userProfile.create({
    data: { clerkUserId, email, role: "ADMIN" },
  });
  const identityProvider: IdentityProvider = {
    configured: true,
    authenticate: async () => ({
      clerkUserId,
      email,
      firstName: "Test",
      lastName: "Administrator",
      phone: null,
    }),
  };
  const app = await buildApp({ database, identityProvider });
  let sessionId: string | undefined;
  let registeredUserId: string | undefined;

  try {
    const invalidResponse = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "POST",
      payload: {
        ...validSessionPayload(`Invalid ${suffix}`),
        endsAt: "2026-07-20T13:30:00.000Z",
      },
      url: "/v1/admin/class-sessions",
    });
    assert.equal(invalidResponse.statusCode, 400);

    const createResponse = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "POST",
      payload: validSessionPayload(`Admin ${suffix}`),
      url: "/v1/admin/class-sessions",
    });
    assert.equal(createResponse.statusCode, 201);
    sessionId = createResponse.json().session.id;

    const created = await database.classSession.findUniqueOrThrow({ where: { id: sessionId } });
    assert.equal(created.createdById, user.id);
    assert.equal(created.updatedById, user.id);

    const moveResponse = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "PATCH",
      payload: {
        endsAt: "2026-07-21T14:40:00.000Z",
        startsAt: "2026-07-21T14:20:00.000Z",
      },
      url: `/v1/admin/class-sessions/${sessionId}`,
    });
    assert.equal(moveResponse.statusCode, 200);
    assert.equal(moveResponse.json().session.startsAt, "2026-07-21T14:20:00.000Z");

    const listResponse = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "GET",
      url: `/v1/admin/class-sessions?${queryRange.toString()}`,
    });
    assert.equal(listResponse.statusCode, 200);
    assert.equal(
      listResponse.json().sessions.some((session: { id: string }) => session.id === sessionId),
      true,
    );

    const registeredUser = await database.userProfile.create({
      data: {
        clerkUserId: `registered_${suffix}`,
        email: `registered-${suffix}@example.com`,
      },
    });
    registeredUserId = registeredUser.id;
    await database.classRegistration.create({
      data: { classSessionId: sessionId, userId: registeredUser.id },
    });

    const protectedDeleteResponse = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "DELETE",
      url: `/v1/admin/class-sessions/${sessionId}`,
    });
    assert.equal(protectedDeleteResponse.statusCode, 409);
    await database.classRegistration.deleteMany({ where: { classSessionId: sessionId } });

    const deleteResponse = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "DELETE",
      url: `/v1/admin/class-sessions/${sessionId}`,
    });
    assert.equal(deleteResponse.statusCode, 204);
    assert.equal(await database.classSession.findUnique({ where: { id: sessionId } }), null);
    sessionId = undefined;
  } finally {
    if (sessionId) {
      await database.classRegistration.deleteMany({ where: { classSessionId: sessionId } });
      await database.classSession.deleteMany({ where: { id: sessionId } });
    }
    if (registeredUserId) {
      await database.userProfile.delete({ where: { id: registeredUserId } });
    }
    await database.userProfile.delete({ where: { id: user.id } });
    await app.close();
  }
});

function validSessionPayload(title: string) {
  return {
    capacity: 24,
    description: "Focused technique session.",
    endsAt: "2026-07-20T13:20:00.000Z",
    instructorName: "Test Instructor",
    locationName: "Main Studio",
    published: true,
    startsAt: "2026-07-20T13:00:00.000Z",
    title,
  };
}
