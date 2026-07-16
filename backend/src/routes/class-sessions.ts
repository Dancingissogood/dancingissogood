import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AccountIdentityConflictError } from "../accounts.js";
import { authorizeAdministrator } from "../authorization.js";
import type { AuthorizationResult } from "../authorization.js";
import type { IdentityProvider } from "../auth.js";

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

const classSessionFieldsSchema = z
  .object({
    capacity: z.union([z.number().int().min(1).max(500), z.null()]),
    description: nullableTextSchema(1_000),
    endsAt: dateTimeSchema,
    instructorName: nullableTextSchema(120),
    locationName: nullableTextSchema(160),
    published: z.boolean(),
    startsAt: dateTimeSchema,
    title: z.string().trim().min(1).max(120),
  })
  .strict();

const createClassSessionSchema = classSessionFieldsSchema.superRefine(validateSessionTiming);
const updateClassSessionSchema = classSessionFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");

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
      message: "Class sessions must run between 9:00 AM and 2:00 PM Eastern Time.",
      path: ["startsAt"],
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
  capacity: number | null;
  description: string | null;
  endsAt: Date;
  id: string;
  instructorName: string | null;
  locationName: string | null;
  published: boolean;
  startsAt: Date;
  title: string;
}) {
  return {
    ...session,
    endsAt: session.endsAt.toISOString(),
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
      capacity: true,
      description: true,
      endsAt: true,
      id: true,
      instructorName: true,
      locationName: true,
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

  return { sessions: sessions.map(serializeClassSession) };
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

      return reply.code(201).send({ session: serializeClassSession(session) });
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

      const startsAt = body.data.startsAt ?? existing.startsAt.toISOString();
      const endsAt = body.data.endsAt ?? existing.endsAt.toISOString();
      const durationValidation = z
        .object({ startsAt: dateTimeSchema, endsAt: dateTimeSchema })
        .superRefine(validateSessionTiming)
        .safeParse({ startsAt, endsAt });

      if (!durationValidation.success) {
        return reply.code(400).send({
          error: "Classes must be 20 minutes and run between 9:00 AM and 2:00 PM Eastern Time.",
        });
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

      return reply.send({ session: serializeClassSession(session) });
    } catch (error) {
      return handleAdministrativeError(request, reply, error, "update the class session");
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
