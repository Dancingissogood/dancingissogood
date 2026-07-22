import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AccountIdentityConflictError, synchronizeAccount } from "../accounts.js";
import type { IdentityProvider } from "../auth.js";

const MAXIMUM_QUERY_RANGE_MILLISECONDS = 366 * 24 * 60 * 60 * 1_000;
const dateTimeSchema = z.iso.datetime({ offset: true });
const sessionIdSchema = z.string().trim().min(1).max(64);
const savedSessionQuerySchema = z
  .object({ from: dateTimeSchema, to: dateTimeSchema })
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
const saveSessionBodySchema = z.object({ classSessionId: sessionIdSchema }).strict();

type SavedSessionRecord = {
  classSession: {
    capacity: number | null;
    description: string | null;
    endsAt: Date;
    id: string;
    instructorName: string | null;
    locationName: string | null;
    published: boolean;
    startsAt: Date;
    title: string;
  };
  createdAt: Date;
  id: string;
};

function serializeSavedSession(selection: SavedSessionRecord) {
  return {
    createdAt: selection.createdAt.toISOString(),
    id: selection.id,
    session: {
      ...selection.classSession,
      endsAt: selection.classSession.endsAt.toISOString(),
      startsAt: selection.classSession.startsAt.toISOString(),
    },
  };
}

async function authenticateAccount(
  request: FastifyRequest,
  reply: FastifyReply,
  dependencies: { database: DatabaseClient; identityProvider: IdentityProvider },
) {
  if (!dependencies.identityProvider.configured) {
    reply.code(503).send({ error: "Account access is not configured." });
    return null;
  }

  const identity = await dependencies.identityProvider.authenticate(request);

  if (!identity) {
    reply.code(401).send({ error: "Authentication required." });
    return null;
  }

  return synchronizeAccount(dependencies.database, identity);
}

export async function registerSavedClassSessionRoutes(
  app: FastifyInstance,
  dependencies: { database: DatabaseClient; identityProvider: IdentityProvider },
): Promise<void> {
  app.get("/v1/account/class-selections", async (request, reply) => {
    const query = savedSessionQuerySchema.safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ error: "Invalid personal schedule range." });
    }

    try {
      const user = await authenticateAccount(request, reply, dependencies);

      if (!user) return;

      const selections = await dependencies.database.savedClassSession.findMany({
        orderBy: [{ classSession: { startsAt: "asc" } }, { createdAt: "asc" }],
        select: {
          classSession: {
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
          },
          createdAt: true,
          id: true,
        },
        where: {
          classSession: {
            endsAt: { gt: new Date(query.data.from) },
            startsAt: { lt: new Date(query.data.to) },
          },
          userId: user.id,
        },
      });

      reply.header("cache-control", "no-store");
      return reply.send({ selections: selections.map(serializeSavedSession) });
    } catch (error) {
      return handleSavedSessionError(request, reply, error, "load your schedule");
    }
  });

  app.post("/v1/account/class-selections", async (request, reply) => {
    const body = saveSessionBodySchema.safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ error: "Invalid class selection." });
    }

    try {
      const user = await authenticateAccount(request, reply, dependencies);

      if (!user) return;

      const classSession = await dependencies.database.classSession.findFirst({
        where: { id: body.data.classSessionId, published: true },
      });

      if (!classSession) {
        return reply.code(404).send({ error: "This class session is not available." });
      }

      if (classSession.endsAt.getTime() <= Date.now()) {
        return reply.code(409).send({ error: "Past class sessions cannot be saved." });
      }

      const selection = await dependencies.database.savedClassSession.upsert({
        create: { classSessionId: classSession.id, userId: user.id },
        include: { classSession: true },
        update: {},
        where: {
          userId_classSessionId: {
            classSessionId: classSession.id,
            userId: user.id,
          },
        },
      });

      reply.header("cache-control", "no-store");
      return reply.send({ selection: serializeSavedSession(selection) });
    } catch (error) {
      return handleSavedSessionError(request, reply, error, "save this class");
    }
  });

  app.delete("/v1/account/class-selections/:classSessionId", async (request, reply) => {
    const classSessionId = sessionIdSchema.safeParse(
      (request.params as { classSessionId?: string }).classSessionId,
    );

    if (!classSessionId.success) {
      return reply.code(400).send({ error: "Invalid class selection." });
    }

    try {
      const user = await authenticateAccount(request, reply, dependencies);

      if (!user) return;

      await dependencies.database.savedClassSession.deleteMany({
        where: { classSessionId: classSessionId.data, userId: user.id },
      });

      return reply.code(204).send();
    } catch (error) {
      return handleSavedSessionError(request, reply, error, "remove this class");
    }
  });
}

function handleSavedSessionError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  action: string,
) {
  if (error instanceof AccountIdentityConflictError) {
    request.log.warn(error, "Account identity conflict");
    return reply.code(409).send({ error: error.message });
  }

  request.log.error(error, `Unable to ${action}`);
  return reply.code(502).send({ error: `Unable to ${action}. Please try again.` });
}
