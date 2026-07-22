import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { createDatabaseClient } from "@dancingissogood/db";

import type { IdentityProvider } from "../src/auth.js";
import { buildApp } from "../src/app.js";

const futureYear = new Date().getUTCFullYear() + 2;
const range = new URLSearchParams({
  from: `${futureYear}-07-01T00:00:00.000Z`,
  to: `${futureYear}-08-01T00:00:00.000Z`,
});

test("personal schedule routes require an authenticated account", async () => {
  const app = await buildApp({
    identityProvider: { configured: true, authenticate: async () => null },
  });

  try {
    const response = await app.inject({
      method: "GET",
      url: `/v1/account/class-selections?${range.toString()}`,
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), { error: "Authentication required." });
  } finally {
    await app.close();
  }
});

test("a member can save, list, and remove only their own available class sessions", async () => {
  const database = createDatabaseClient();
  const suffix = randomUUID();
  const ownerClerkId = `owner_${suffix}`;
  const otherClerkId = `other_${suffix}`;
  const identityProvider: IdentityProvider = {
    configured: true,
    authenticate: async (request) => {
      if (request.headers.authorization === "Bearer owner-session") {
        return {
          clerkUserId: ownerClerkId,
          email: `owner-${suffix}@example.com`,
          firstName: "Schedule",
          lastName: "Owner",
          phone: null,
        };
      }

      if (request.headers.authorization === "Bearer other-session") {
        return {
          clerkUserId: otherClerkId,
          email: `other-${suffix}@example.com`,
          firstName: "Other",
          lastName: "Member",
          phone: null,
        };
      }

      return null;
    },
  };
  const available = await database.classSession.create({
    data: {
      endsAt: new Date(`${futureYear}-07-08T13:20:00.000Z`),
      startsAt: new Date(`${futureYear}-07-08T13:00:00.000Z`),
      title: `Available ${suffix}`,
    },
  });
  const unpublished = await database.classSession.create({
    data: {
      endsAt: new Date(`${futureYear}-07-08T13:40:00.000Z`),
      published: false,
      startsAt: new Date(`${futureYear}-07-08T13:20:00.000Z`),
      title: `Unpublished ${suffix}`,
    },
  });
  const past = await database.classSession.create({
    data: {
      endsAt: new Date("2020-07-08T13:20:00.000Z"),
      startsAt: new Date("2020-07-08T13:00:00.000Z"),
      title: `Past ${suffix}`,
    },
  });
  const app = await buildApp({ database, identityProvider });

  try {
    const unavailableResponse = await app.inject({
      headers: { authorization: "Bearer owner-session" },
      method: "POST",
      payload: { classSessionId: unpublished.id },
      url: "/v1/account/class-selections",
    });
    assert.equal(unavailableResponse.statusCode, 404);

    const pastResponse = await app.inject({
      headers: { authorization: "Bearer owner-session" },
      method: "POST",
      payload: { classSessionId: past.id },
      url: "/v1/account/class-selections",
    });
    assert.equal(pastResponse.statusCode, 409);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const saveResponse = await app.inject({
        headers: { authorization: "Bearer owner-session" },
        method: "POST",
        payload: { classSessionId: available.id },
        url: "/v1/account/class-selections",
      });
      assert.equal(saveResponse.statusCode, 200);
      assert.equal(saveResponse.json().selection.session.id, available.id);
    }

    const owner = await database.userProfile.findUniqueOrThrow({
      where: { clerkUserId: ownerClerkId },
    });
    assert.equal(
      await database.savedClassSession.count({
        where: { classSessionId: available.id, userId: owner.id },
      }),
      1,
    );

    const ownerListResponse = await app.inject({
      headers: { authorization: "Bearer owner-session" },
      method: "GET",
      url: `/v1/account/class-selections?${range.toString()}`,
    });
    assert.equal(ownerListResponse.statusCode, 200);
    assert.equal(ownerListResponse.headers["cache-control"], "no-store");
    assert.deepEqual(
      ownerListResponse.json().selections.map((selection: { session: { id: string } }) => selection.session.id),
      [available.id],
    );

    const otherListResponse = await app.inject({
      headers: { authorization: "Bearer other-session" },
      method: "GET",
      url: `/v1/account/class-selections?${range.toString()}`,
    });
    assert.equal(otherListResponse.statusCode, 200);
    assert.deepEqual(otherListResponse.json().selections, []);

    const otherDeleteResponse = await app.inject({
      headers: { authorization: "Bearer other-session" },
      method: "DELETE",
      url: `/v1/account/class-selections/${available.id}`,
    });
    assert.equal(otherDeleteResponse.statusCode, 204);
    assert.equal(await database.savedClassSession.count({ where: { classSessionId: available.id } }), 1);

    const ownerDeleteResponse = await app.inject({
      headers: { authorization: "Bearer owner-session" },
      method: "DELETE",
      url: `/v1/account/class-selections/${available.id}`,
    });
    assert.equal(ownerDeleteResponse.statusCode, 204);
    assert.equal(await database.savedClassSession.count({ where: { classSessionId: available.id } }), 0);
  } finally {
    await database.savedClassSession.deleteMany({
      where: { classSessionId: { in: [available.id, unpublished.id, past.id] } },
    });
    await database.classSession.deleteMany({
      where: { id: { in: [available.id, unpublished.id, past.id] } },
    });
    await database.userProfile.deleteMany({
      where: { clerkUserId: { in: [ownerClerkId, otherClerkId] } },
    });
    await app.close();
  }
});

test("personal schedule queries reject unbounded date ranges", async () => {
  const suffix = randomUUID();
  const app = await buildApp({
    identityProvider: {
      configured: true,
      authenticate: async () => ({
        clerkUserId: `range_${suffix}`,
        email: `range-${suffix}@example.com`,
        firstName: null,
        lastName: null,
        phone: null,
      }),
    },
  });

  try {
    const response = await app.inject({
      headers: { authorization: "Bearer valid-session" },
      method: "GET",
      url: `/v1/account/class-selections?from=${futureYear}-01-01T00%3A00%3A00.000Z&to=${futureYear + 2}-01-01T00%3A00%3A00.000Z`,
    });

    assert.equal(response.statusCode, 400);
  } finally {
    await app.close();
  }
});
