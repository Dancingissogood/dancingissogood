import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AccountIdentityConflictError } from "../accounts.js";
import { authorizeAdministrator } from "../authorization.js";
import type { AuthorizationResult } from "../authorization.js";
import type { IdentityProvider } from "../auth.js";
import { getClassAvailability } from "../class-availability.js";

const SESSION_DURATION_MILLISECONDS = 20 * 60 * 1_000;
const MAXIMUM_QUERY_RANGE_MILLISECONDS = 93 * 24 * 60 * 60 * 1_000;
const SCHEDULE_START_MINUTE = 9 * 60;
const SCHEDULE_END_MINUTE = 14 * 60;
const easternTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "America/Detroit",
  year: "numeric",
});

const dateTimeSchema = z.iso.datetime({ offset: true });

const scheduleQuerySchema = z
  .object({
    from: dateTimeSchema,
    to: dateTimeSchema,
  })
  .strict()
  .superRefine((query, context) => {
    const from = Date.parse(query.from);
    const to = Date.parse(query.to);

    if (to <= from) {
      context.addIssue({ code: "custom", message: "The end must follow the start.", path: ["to"] });
    } else if (to - from > MAXIMUM_QUERY_RANGE_MILLISECONDS) {
      context.addIssue({ code: "custom", message: "The requested range is too large.", path: ["to"] });
    }
  });

const nullableTextSchema = (maximumLength: number) =>
  z.union([z.string().trim().min(1).max(maximumLength), z.null()]);
const classDeliveryModeSchema = z.enum(["IN_PERSON", "ONLINE"]);
const classBookingStatusSchema = z.enum(["OPEN", "CLOSED"]);
const nullableGoogleMeetUrlSchema = z
  .union([z.string().trim().url().max(500), z.null()])
  .superRefine((value, context) => {
    if (value === null) return;

    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "meet.google.com" || url.pathname === "/") {
      context.addIssue({ code: "custom", message: "Enter a valid Google Meet link." });
    }
  });

const classSessionFieldsSchema = z
  .object({
    bookingStatus: classBookingStatusSchema.default("OPEN"),
    capacity: z.union([z.number().int().min(1).max(500), z.null()]),
    classKey: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    deliveryMode: classDeliveryModeSchema.default("IN_PERSON"),
    description: nullableTextSchema(1_000),
    endsAt: dateTimeSchema,
    instructorName: nullableTextSchema(120),
    locationName: nullableTextSchema(160),
    meetUrl: nullableGoogleMeetUrlSchema.default(null),
    published: z.boolean(),
    startsAt: dateTimeSchema,
    title: z.string().trim().min(1).max(120),
  })
  .strict();

const createClassSessionSchema = classSessionFieldsSchema.superRefine(validateClassSession);
const updateClassSessionSchema = classSessionFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");
const bulkClassSessionUpdateSchema = z
  .object({
    bookingStatus: classBookingStatusSchema.optional(),
    capacity: z.union([z.number().int().min(1).max(500), z.null()]).optional(),
    classKey: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    deliveryMode: classDeliveryModeSchema.optional(),
    from: dateTimeSchema,
    meetUrl: nullableGoogleMeetUrlSchema.optional(),
    to: dateTimeSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const from = Date.parse(value.from);
    const to = Date.parse(value.to);

    if (to <= from || to - from > MAXIMUM_QUERY_RANGE_MILLISECONDS) {
      context.addIssue({ code: "custom", message: "Invalid class date range.", path: ["to"] });
    }

    if (value.bookingStatus === undefined && value.capacity === undefined && value.deliveryMode === undefined) {
      context.addIssue({ code: "custom", message: "Choose at least one update." });
    }

    if (value.deliveryMode === "ONLINE" && !value.meetUrl) {
      context.addIssue({ code: "custom", message: "An online class needs a Google Meet link.", path: ["meetUrl"] });
    }

    if (value.meetUrl !== undefined && value.deliveryMode !== "ONLINE") {
      context.addIssue({ code: "custom", message: "Choose Online class to apply a Google Meet link.", path: ["deliveryMode"] });
    }
  });

function validateDuration(
  session: { startsAt: string; endsAt: string },
  context: z.RefinementCtx,
) {
  if (Date.parse(session.endsAt) - Date.parse(session.startsAt) !== SESSION_DURATION_MILLISECONDS) {
    context.addIssue({
      code: "custom",
      message: "Class sessions must be exactly 20 minutes.",
      path: ["endsAt"],
    });
  }
}

function validateSessionTiming(
  session: { startsAt: string; endsAt: string },
  context: z.RefinementCtx,
) {
  validateDuration(session, context);

  if (!isWithinScheduleHours(session)) {
    context.addIssue({
      code: "custom",
      message: "Class sessions must run between 9:00 AM and 2:00 PM ET.",
      path: ["startsAt"],
    });
  }
}

function validateClassSession(session: z.infer<typeof classSessionFieldsSchema>, context: z.RefinementCtx) {
  validateSessionTiming(session, context);

  if (session.deliveryMode === "ONLINE" && !session.meetUrl) {
    context.addIssue({
      code: "custom",
      message: "Online classes need a Google Meet link.",
      path: ["meetUrl"],
    });
  }

  if (session.deliveryMode === "IN_PERSON" && session.meetUrl) {
    context.addIssue({
      code: "custom",
      message: "In-person classes cannot have a Google Meet link.",
      path: ["meetUrl"],
    });
  }
}

function isWithinScheduleHours(session: { startsAt: string; endsAt: string }) {
  const start = getEasternTimeParts(new Date(session.startsAt));
  const end = getEasternTimeParts(new Date(session.endsAt));

  return (
    start.date === end.date &&
    start.minute >= SCHEDULE_START_MINUTE &&
    end.minute <= SCHEDULE_END_MINUTE
  );
}

function getEasternTimeParts(date: Date) {
  const parts = Object.fromEntries(
    easternTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts["year"]}-${parts["month"]}-${parts["day"]}`,
    minute: Number(parts["hour"]) * 60 + Number(parts["minute"]),
  };
}

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

function serializeClassSession(session: {
  bookingStatus: "OPEN" | "CLOSED";
  capacity: number | null;
  classKey: string;
  deliveryMode: "IN_PERSON" | "ONLINE";
  description: string | null;
  endsAt: Date;
  id: string;
  instructorName: string | null;
  locationName: string | null;
  meetUrl: string | null;
  published: boolean;
  startsAt: Date;
  title: string;
}, reservationCount: number, includeAdministrativeDetails: boolean) {
  const { bookingStatus, capacity, meetUrl, ...publicSession } = session;
  const availability = getClassAvailability({
    bookingStatus,
    capacity,
    reservationCount,
  });

  if (!includeAdministrativeDetails) {
    return {
      availabilityStatus: availability.availabilityStatus,
      ...publicSession,
      endsAt: session.endsAt.toISOString(),
      startsAt: session.startsAt.toISOString(),
    };
  }

  return {
    ...publicSession,
    ...availability,
    bookingStatus,
    capacity,
    endsAt: session.endsAt.toISOString(),
    meetUrl,
    reservationCount,
    startsAt: session.startsAt.toISOString(),
  };
}

async function listClassSessions(
  database: DatabaseClient,
  query: z.infer<typeof scheduleQuerySchema>,
  includeUnpublished: boolean,
) {
  const sessions = await database.classSession.findMany({
    orderBy: [{ startsAt: "asc" }, { title: "asc" }],
    select: {
      _count: { select: { registrations: { where: { status: "RESERVED" } } } },
      bookingStatus: true,
      capacity: true,
      classKey: true,
      deliveryMode: true,
      description: true,
      endsAt: true,
      id: true,
      instructorName: true,
      locationName: true,
      meetUrl: true,
      published: true,
      startsAt: true,
      title: true,
    },
    where: {
      endsAt: { gt: new Date(query.from) },
      startsAt: { lt: new Date(query.to) },
      ...(includeUnpublished ? {} : { published: true }),
    },
  });

  return {
    sessions: sessions.map((session) => {
      const { _count, ...classSession } = session;
      return serializeClassSession(classSession, _count.registrations, includeUnpublished);
    }),
  };
}

export async function registerClassSessionRoutes(
  app: FastifyInstance,
  dependencies: { database: DatabaseClient; identityProvider: IdentityProvider },
): Promise<void> {
  app.get("/v1/class-sessions", async (request, reply) => {
    const query = scheduleQuerySchema.safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ error: "Invalid schedule range." });
    }

    reply.header("cache-control", "no-store");
    return reply.send(await listClassSessions(dependencies.database, query.data, false));
  });

  app.get("/v1/admin/class-sessions", async (request, reply) => {
    const query = scheduleQuerySchema.safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ error: "Invalid schedule range." });
    }

    try {
      const authorization = await authorizeAdministrator(request, dependencies);
      const failure = sendAuthorizationFailure(reply, authorization);

      if (failure || authorization.status !== "authorized") {
        return failure;
      }

      reply.header("cache-control", "no-store");
      return reply.send(await listClassSessions(dependencies.database, query.data, true));
    } catch (error) {
      return handleAdministrativeError(request, reply, error, "load the schedule");
    }
  });

  app.post("/v1/admin/class-sessions", async (request, reply) => {
    const body = createClassSessionSchema.safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ error: "Invalid class session." });
    }

    try {
      const authorization = await authorizeAdministrator(request, dependencies);
      const failure = sendAuthorizationFailure(reply, authorization);

      if (failure || authorization.status !== "authorized") {
        return failure;
      }

      const session = await dependencies.database.classSession.create({
        data: {
          ...body.data,
          createdById: authorization.userId,
          endsAt: new Date(body.data.endsAt),
          startsAt: new Date(body.data.startsAt),
          updatedById: authorization.userId,
        },
      });

      return reply.code(201).send({ session: serializeClassSession(session, 0, true) });
    } catch (error) {
      return handleAdministrativeError(request, reply, error, "create the class session");
    }
  });

  app.patch("/v1/admin/class-sessions/:sessionId", async (request, reply) => {
    const sessionId = (request.params as { sessionId?: string }).sessionId;
    const body = updateClassSessionSchema.safeParse(request.body);

    if (!sessionId || sessionId.length > 64 || !body.success) {
      return reply.code(400).send({ error: "Invalid class session update." });
    }

    try {
      const authorization = await authorizeAdministrator(request, dependencies);
      const failure = sendAuthorizationFailure(reply, authorization);

      if (failure || authorization.status !== "authorized") {
        return failure;
      }

      const existing = await dependencies.database.classSession.findUnique({ where: { id: sessionId } });

      if (!existing) {
        return reply.code(404).send({ error: "Class session not found." });
      }

      const fullSession = {
        bookingStatus: body.data.bookingStatus ?? existing.bookingStatus,
        capacity: body.data.capacity ?? existing.capacity,
        classKey: body.data.classKey ?? existing.classKey,
        deliveryMode: body.data.deliveryMode ?? existing.deliveryMode,
        description: body.data.description ?? existing.description,
        endsAt: body.data.endsAt ?? existing.endsAt.toISOString(),
        instructorName: body.data.instructorName ?? existing.instructorName,
        locationName: body.data.locationName ?? existing.locationName,
        meetUrl: body.data.meetUrl === undefined ? existing.meetUrl : body.data.meetUrl,
        published: body.data.published ?? existing.published,
        startsAt: body.data.startsAt ?? existing.startsAt.toISOString(),
        title: body.data.title ?? existing.title,
      };
      const fullSessionValidation = createClassSessionSchema.safeParse(fullSession);

      if (!fullSessionValidation.success) {
        return reply.code(400).send({
          error: "Enter a complete valid class session, including a Google Meet link for online classes.",
        });
      }

      if (typeof body.data.capacity === "number") {
        const reservationCount = await dependencies.database.classRegistration.count({
          where: { classSessionId: existing.id, status: "RESERVED" },
        });

        if (reservationCount > body.data.capacity) {
          return reply.code(409).send({
            error: "Capacity cannot be set below the number of existing reservations.",
          });
        }
      }

      const session = await dependencies.database.classSession.update({
        data: {
          ...body.data,
          ...(body.data.endsAt ? { endsAt: new Date(body.data.endsAt) } : {}),
          ...(body.data.startsAt ? { startsAt: new Date(body.data.startsAt) } : {}),
          updatedById: authorization.userId,
        },
        where: { id: sessionId },
      });

      const reservationCount = await dependencies.database.classRegistration.count({
        where: { classSessionId: session.id, status: "RESERVED" },
      });

      return reply.send({ session: serializeClassSession(session, reservationCount, true) });
    } catch (error) {
      return handleAdministrativeError(request, reply, error, "update the class session");
    }
  });

  app.patch("/v1/admin/class-sessions/bulk", async (request, reply) => {
    const body = bulkClassSessionUpdateSchema.safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ error: "Invalid bulk class update." });
    }

    try {
      const authorization = await authorizeAdministrator(request, dependencies);
      const failure = sendAuthorizationFailure(reply, authorization);

      if (failure || authorization.status !== "authorized") {
        return failure;
      }

      const where = {
        ...(body.data.classKey ? { classKey: body.data.classKey } : {}),
        startsAt: { gte: new Date(body.data.from), lt: new Date(body.data.to) },
      };
      const requestedCapacity = body.data.capacity;

      const result = await dependencies.database.$transaction(async (transaction) => {
        const sessions = await transaction.classSession.findMany({
          select: {
            _count: { select: { registrations: { where: { status: "RESERVED" } } } },
            id: true,
          },
          where,
        });

        if (
          typeof requestedCapacity === "number"
          && sessions.some((session) => session._count.registrations > requestedCapacity)
        ) {
          throw new CapacityBelowReservationsError();
        }

        return transaction.classSession.updateMany({
          data: {
            ...(body.data.bookingStatus === undefined ? {} : { bookingStatus: body.data.bookingStatus }),
            ...(body.data.capacity === undefined ? {} : { capacity: body.data.capacity }),
            ...(body.data.deliveryMode === undefined ? {} : { deliveryMode: body.data.deliveryMode }),
            ...(body.data.deliveryMode === "IN_PERSON" ? { meetUrl: null } : {}),
            ...(body.data.meetUrl === undefined ? {} : { meetUrl: body.data.meetUrl }),
            updatedById: authorization.userId,
          },
          where: { id: { in: sessions.map((session) => session.id) } },
        });
      });

      return reply.send({ updated: result.count });
    } catch (error) {
      if (error instanceof CapacityBelowReservationsError) {
        return reply.code(409).send({
          error: "Capacity cannot be set below the number of existing reservations.",
        });
      }

      return handleAdministrativeError(request, reply, error, "update the selected classes");
    }
  });

  app.delete("/v1/admin/class-sessions/:sessionId", async (request, reply) => {
    const sessionId = (request.params as { sessionId?: string }).sessionId;

    if (!sessionId || sessionId.length > 64) {
      return reply.code(400).send({ error: "Invalid class session." });
    }

    try {
      const authorization = await authorizeAdministrator(request, dependencies);
      const failure = sendAuthorizationFailure(reply, authorization);

      if (failure || authorization.status !== "authorized") {
        return failure;
      }

      const session = await dependencies.database.classSession.findUnique({
        select: { _count: { select: { registrations: true } } },
        where: { id: sessionId },
      });

      if (!session) {
        return reply.code(404).send({ error: "Class session not found." });
      }

      if (session._count.registrations > 0) {
        return reply.code(409).send({
          error: "A class with registrations cannot be deleted. Unpublish it instead.",
        });
      }

      await dependencies.database.classSession.delete({ where: { id: sessionId } });

      return reply.code(204).send();
    } catch (error) {
      return handleAdministrativeError(request, reply, error, "delete the class session");
    }
  });
}

class CapacityBelowReservationsError extends Error {}

function handleAdministrativeError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  operation: string,
) {
  if (error instanceof AccountIdentityConflictError) {
    request.log.warn(error, "Account identity conflict");
    return reply.code(409).send({ error: error.message });
  }

  request.log.error(error, `Unable to ${operation}`);
  return reply.code(500).send({ error: `Unable to ${operation}.` });
}
