import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AccountIdentityConflictError, synchronizeAccount } from "../accounts.js";
import type { IdentityProvider } from "../auth.js";
import { getClassAvailability } from "../class-availability.js";

const MAXIMUM_QUERY_RANGE_MILLISECONDS = 366 * 24 * 60 * 60 * 1_000;
const dateTimeSchema = z.iso.datetime({ offset: true });
const sessionIdSchema = z.string().trim().min(1).max(64);
const registrationQuerySchema = z
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
const registrationBodySchema = z.object({ classSessionId: sessionIdSchema }).strict();

const sessionSelection = {
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
  published: true,
  startsAt: true,
  title: true,
} as const;

type RegistrationRecord = {
  classSession: {
    _count: { registrations: number };
    bookingStatus: "OPEN" | "CLOSED";
    capacity: number | null;
    classKey: string;
    deliveryMode: "IN_PERSON" | "ONLINE";
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
  status: "RESERVED" | "ATTENDED" | "CANCELED" | "NO_SHOW";
};

function serializeRegistration(registration: RegistrationRecord) {
  const { _count, ...classSession } = registration.classSession;

  return {
    createdAt: registration.createdAt.toISOString(),
    id: registration.id,
    session: {
      ...classSession,
      ...getClassAvailability({
        bookingStatus: classSession.bookingStatus,
        capacity: classSession.capacity,
        reservationCount: _count.registrations,
      }),
      endsAt: classSession.endsAt.toISOString(),
      reservationCount: _count.registrations,
      startsAt: classSession.startsAt.toISOString(),
    },
    status: registration.status,
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

export async function registerRegistrationRoutes(
  app: FastifyInstance,
  dependencies: { database: DatabaseClient; identityProvider: IdentityProvider },
): Promise<void> {
  app.get("/v1/account/reservations", async (request, reply) => {
    const query = registrationQuerySchema.safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ error: "Invalid reservation range." });
    }

    try {
      const user = await authenticateAccount(request, reply, dependencies);
      if (!user) return;

      const registrations = await dependencies.database.classRegistration.findMany({
        orderBy: [{ classSession: { startsAt: "asc" } }, { createdAt: "asc" }],
        select: {
          classSession: { select: sessionSelection },
          createdAt: true,
          id: true,
          status: true,
        },
        where: {
          classSession: {
            endsAt: { gt: new Date(query.data.from) },
            startsAt: { lt: new Date(query.data.to) },
          },
          status: "RESERVED",
          userId: user.id,
        },
      });

      reply.header("cache-control", "no-store");
      return reply.send({ registrations: registrations.map(serializeRegistration) });
    } catch (error) {
      return handleRegistrationError(request, reply, error, "load your reservations");
    }
  });

  app.post("/v1/account/reservations", async (request, reply) => {
    const body = registrationBodySchema.safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({ error: "Invalid class reservation." });
    }

    try {
      const user = await authenticateAccount(request, reply, dependencies);
      if (!user) return;

      const now = new Date();
      const classSession = await dependencies.database.classSession.findFirst({
        select: { endsAt: true, id: true, startsAt: true },
        where: { id: body.data.classSessionId, published: true },
      });

      if (!classSession) {
        return reply.code(404).send({ error: "This class session is not available." });
      }

      if (classSession.endsAt <= now) {
        return reply.code(409).send({ error: "Past class sessions cannot be reserved." });
      }

      const passPurchase = await dependencies.database.passPurchase.findFirst({
        orderBy: [{ paidAt: "desc" }],
        where: {
          AND: [
            { OR: [{ passStatus: null }, { passStatus: "ACTIVE" }] },
            { OR: [{ validFrom: null }, { validFrom: { lte: classSession.startsAt } }] },
            { OR: [{ validUntil: null }, { validUntil: { gte: classSession.startsAt } }] },
          ],
          status: "PAID",
          userId: user.id,
        },
      });

      if (!passPurchase) {
        return reply.code(403).send({
          code: "PASS_REQUIRED",
          error: "An active camp pass is required to reserve a class.",
        });
      }

      const registration = await dependencies.database.$transaction(async (transaction) => {
        await transaction.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtextextended(${classSession.id}, 0))
        `;

        const lockedSession = await transaction.classSession.findFirst({
          select: {
            _count: { select: { registrations: { where: { status: "RESERVED" } } } },
            bookingStatus: true,
            capacity: true,
            endsAt: true,
            id: true,
          },
          where: { id: classSession.id, published: true },
        });

        if (!lockedSession || lockedSession.endsAt <= now) {
          throw new ClassUnavailableError("This class session is not available.");
        }

        const existingRegistration = await transaction.classRegistration.findUnique({
          include: { classSession: { select: sessionSelection } },
          where: {
            userId_classSessionId: {
              classSessionId: lockedSession.id,
              userId: user.id,
            },
          },
        });

        if (existingRegistration?.status === "RESERVED") {
          return existingRegistration;
        }

        const availability = getClassAvailability({
          bookingStatus: lockedSession.bookingStatus,
          capacity: lockedSession.capacity,
          reservationCount: lockedSession._count.registrations,
        });

        if (availability.availabilityStatus === "NO_VACANCY") {
          throw new ClassUnavailableError("This class no longer has a vacancy.");
        }

        return transaction.classRegistration.upsert({
          create: {
            classSessionId: lockedSession.id,
            passPurchaseId: passPurchase.id,
            userId: user.id,
          },
          include: { classSession: { select: sessionSelection } },
          update: {
            canceledAt: null,
            passPurchaseId: passPurchase.id,
            status: "RESERVED",
          },
          where: {
            userId_classSessionId: {
              classSessionId: lockedSession.id,
              userId: user.id,
            },
          },
        });
      });

      reply.header("cache-control", "no-store");
      return reply.send({ registration: serializeRegistration(registration) });
    } catch (error) {
      return handleRegistrationError(request, reply, error, "reserve this class");
    }
  });

  app.delete("/v1/account/reservations/:classSessionId", async (request, reply) => {
    const classSessionId = sessionIdSchema.safeParse(
      (request.params as { classSessionId?: string }).classSessionId,
    );

    if (!classSessionId.success) {
      return reply.code(400).send({ error: "Invalid class reservation." });
    }

    try {
      const user = await authenticateAccount(request, reply, dependencies);
      if (!user) return;

      await dependencies.database.classRegistration.updateMany({
        data: { canceledAt: new Date(), status: "CANCELED" },
        where: {
          classSessionId: classSessionId.data,
          status: "RESERVED",
          userId: user.id,
        },
      });

      return reply.code(204).send();
    } catch (error) {
      return handleRegistrationError(request, reply, error, "cancel this reservation");
    }
  });
}

function handleRegistrationError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  action: string,
) {
  if (error instanceof ClassUnavailableError) {
    return reply.code(409).send({ code: "NO_VACANCY", error: error.message });
  }

  if (error instanceof AccountIdentityConflictError) {
    request.log.warn(error, "Account identity conflict");
    return reply.code(409).send({ error: error.message });
  }

  request.log.error(error, `Unable to ${action}`);
  return reply.code(502).send({ error: `Unable to ${action}. Please try again.` });
}

class ClassUnavailableError extends Error {}
