import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance, FastifyReply } from "fastify";

import { authorizeAdministrator } from "../authorization.js";
import type { AuthorizationResult } from "../authorization.js";
import type { IdentityProvider } from "../auth.js";

function sendAuthorizationFailure(reply: FastifyReply, authorization: AuthorizationResult) {
  switch (authorization.status) {
    case "not-configured":
      return reply.code(503).send({ error: "Administrative access is not configured." });
    case "unauthenticated":
      return reply.code(401).send({ error: "Authentication required." });
    case "forbidden":
      return reply.code(403).send({ error: "Administrator access required." });
    case "authorized":
      return null;
  }
}

export async function registerAdminDashboardRoutes(
  app: FastifyInstance,
  dependencies: { database: DatabaseClient; identityProvider: IdentityProvider },
): Promise<void> {
  app.get("/v1/admin/dashboard", async (request, reply) => {
    try {
      const authorization = await authorizeAdministrator(request, dependencies);
      const failure = sendAuthorizationFailure(reply, authorization);
      if (failure || authorization.status !== "authorized") return failure;

      const dashboardState = await dependencies.database.adminDashboardState.upsert({
        create: { userId: authorization.userId },
        update: {},
        where: { userId: authorization.userId },
      });
      const now = new Date();
      const scheduleEnd = new Date(now);
      scheduleEnd.setUTCDate(scheduleEnd.getUTCDate() + 120);

      const [upcomingSessions, recentRegistrations, newReservationCount, subscriberCount] =
        await Promise.all([
          dependencies.database.classSession.findMany({
            orderBy: [{ startsAt: "asc" }, { title: "asc" }],
            select: {
              bookingStatus: true,
              capacity: true,
              classKey: true,
              deliveryMode: true,
              endsAt: true,
              id: true,
              instructorName: true,
              locationName: true,
              published: true,
              registrations: {
                orderBy: [{ createdAt: "desc" }],
                select: {
                  createdAt: true,
                  id: true,
                  status: true,
                  user: {
                    select: {
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              startsAt: true,
              title: true,
            },
            where: { startsAt: { gte: now, lt: scheduleEnd } },
          }),
          dependencies.database.classRegistration.findMany({
            orderBy: [{ createdAt: "desc" }],
            select: {
              classSession: {
                select: { id: true, startsAt: true, title: true },
              },
              createdAt: true,
              id: true,
              status: true,
              user: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
            take: 30,
          }),
          dependencies.database.classRegistration.count({
            where: {
              createdAt: { gt: dashboardState.lastViewedReservationsAt },
              status: "RESERVED",
            },
          }),
          dependencies.database.marketingPreference.count({
            where: { status: "SUBSCRIBED" },
          }),
        ]);

      reply.header("cache-control", "no-store");
      return reply.send({
        metrics: {
          activeReservations: upcomingSessions.reduce(
            (total, session) =>
              total + session.registrations.filter((item) => item.status === "RESERVED").length,
            0,
          ),
          newReservations: newReservationCount,
          publishedSessions: upcomingSessions.filter((session) => session.published).length,
          subscribers: subscriberCount,
        },
        recentRegistrations: recentRegistrations.map((registration) => ({
          ...registration,
          classSession: {
            ...registration.classSession,
            startsAt: registration.classSession.startsAt.toISOString(),
          },
          createdAt: registration.createdAt.toISOString(),
        })),
        sessions: upcomingSessions.map((session) => ({
          ...session,
          endsAt: session.endsAt.toISOString(),
          registrations: session.registrations.map((registration) => ({
            ...registration,
            createdAt: registration.createdAt.toISOString(),
          })),
          startsAt: session.startsAt.toISOString(),
        })),
      });
    } catch (error) {
      request.log.error(error, "Unable to load the administrative dashboard");
      return reply.code(502).send({ error: "Unable to load the dashboard. Please try again." });
    }
  });

  app.post("/v1/admin/dashboard/reservations-seen", async (request, reply) => {
    try {
      const authorization = await authorizeAdministrator(request, dependencies);
      const failure = sendAuthorizationFailure(reply, authorization);
      if (failure || authorization.status !== "authorized") return failure;

      await dependencies.database.adminDashboardState.upsert({
        create: { lastViewedReservationsAt: new Date(), userId: authorization.userId },
        update: { lastViewedReservationsAt: new Date() },
        where: { userId: authorization.userId },
      });

      return reply.code(204).send();
    } catch (error) {
      request.log.error(error, "Unable to update the administrative dashboard state");
      return reply.code(502).send({ error: "Unable to update the dashboard." });
    }
  });
}
