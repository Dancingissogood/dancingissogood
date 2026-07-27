import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { createDatabaseClient } from "@dancingissogood/db";

import type { IdentityProvider } from "../src/auth.js";
import { buildApp } from "../src/app.js";

test("the admin dashboard reports new reservations and per-session rosters", async () => {
  const database = createDatabaseClient();
  const suffix = randomUUID();
  const adminClerkId = `dashboard_admin_${suffix}`;
  const adminEmail = `dashboard-admin-${suffix}@example.com`;
  const memberEmail = `dashboard-member-${suffix}@example.com`;
  const admin = await database.userProfile.create({
    data: { clerkUserId: adminClerkId, email: adminEmail, role: "ADMIN" },
  });
  const member = await database.userProfile.create({
    data: {
      clerkUserId: `dashboard_member_${suffix}`,
      email: memberEmail,
      firstName: "Roster",
      lastName: "Member",
    },
  });
  const session = await database.classSession.create({
    data: {
      classKey: "waltz",
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1_000 + 20 * 60 * 1_000),
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1_000),
      title: "Waltz",
    },
  });
  const state = await database.adminDashboardState.create({
    data: {
      lastViewedReservationsAt: new Date(Date.now() - 60_000),
      userId: admin.id,
    },
  });
  const registration = await database.classRegistration.create({
    data: { classSessionId: session.id, userId: member.id },
  });
  const identityProvider: IdentityProvider = {
    configured: true,
    authenticate: async () => ({
      clerkUserId: adminClerkId,
      email: adminEmail,
      firstName: "Dashboard",
      lastName: "Administrator",
      phone: null,
    }),
  };
  const app = await buildApp({ database, identityProvider });

  try {
    const response = await app.inject({
      headers: { authorization: "Bearer admin" },
      method: "GET",
      url: "/v1/admin/dashboard",
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().metrics.newReservations, 1);
    const dashboardSession = response.json().sessions.find(
      (item: { id: string }) => item.id === session.id,
    );
    assert.equal(dashboardSession.registrations[0].user.email, memberEmail);

    const seen = await app.inject({
      headers: { authorization: "Bearer admin" },
      method: "POST",
      url: "/v1/admin/dashboard/reservations-seen",
    });
    assert.equal(seen.statusCode, 204);
    assert.ok(
      (await database.adminDashboardState.findUniqueOrThrow({ where: { userId: admin.id } }))
        .lastViewedReservationsAt > state.lastViewedReservationsAt,
    );
  } finally {
    await database.classRegistration.delete({ where: { id: registration.id } });
    await database.classSession.delete({ where: { id: session.id } });
    await database.userProfile.deleteMany({ where: { id: { in: [admin.id, member.id] } } });
    await app.close();
  }
});
