import type { DatabaseClient } from "@dancingissogood/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AccountIdentityConflictError, synchronizeAccount } from "../accounts.js";
import type { IdentityProvider } from "../auth.js";
import { getClassAvailability } from "../class-availability.js";
import {
  formatPassWindow,
  lockMemberPasses,
  refreshPassWindow,
  selectPassForClass,
} from "../pass-access.js";
import type { PassWindow } from "../pass-access.js";

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
  const {
    _count,
    bookingStatus,
    capacity,
    ...classSession
  } = registration.classSession;

  return {
    createdAt: registration.createdAt.toISOString(),
    id: registration.id,
    session: {
      ...classSession,
      ...getClassAvailability({
        bookingStatus,
        capacity,
        reservationCount: _count.registrations,
      }),
      endsAt: classSession.endsAt.toISOString(),
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
      return handleRegistrationError(request, reply, error, "load your bookings");
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

      const registration = await dependencies.database.$transaction(async (transaction) => {
        await transaction.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtextextended(${classSession.id}, 0))
        `;
        await lockMemberPasses(transaction, user.id);

        const lockedSession = await transaction.classSession.findFirst({
          select: {
            _count: { select: { registrations: { where: { status: "RESERVED" } } } },
            bookingStatus: true,
            capacity: true,
            endsAt: true,
            id: true,
            startsAt: true,
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

        // Only canceled bookings can be booked again; attendance records are kept as they are.
        if (existingRegistration && existingRegistration.status !== "CANCELED") {
          return existingRegistration;
        }

        const passSelection = await selectPassForClass(
          transaction,
          user.id,
          lockedSession.startsAt,
          now,
        );

        if (passSelection.status === "no-pass") {
          throw new PassRequiredError();
        }

        if (passSelection.status === "outside-window") {
          throw new OutsidePassDatesError(passSelection.windows);
        }

        const availability = getClassAvailability({
          bookingStatus: lockedSession.bookingStatus,
          capacity: lockedSession.capacity,
          reservationCount: lockedSession._count.registrations,
        });

        if (availability.availabilityStatus === "NO_VACANCY") {
          throw new ClassUnavailableError("This class is full.");
        }

        const saved = await transaction.classRegistration.upsert({
          create: {
            classSessionId: lockedSession.id,
            passPurchaseId: passSelection.passPurchaseId,
            userId: user.id,
          },
          include: { classSession: { select: sessionSelection } },
          update: {
            canceledAt: null,
            passPurchaseId: passSelection.passPurchaseId,
            status: "RESERVED",
          },
          where: {
            userId_classSessionId: {
              classSessionId: lockedSession.id,
              userId: user.id,
            },
          },
        });

        await transaction.passPurchase.update({
          data: passSelection.window,
          where: { id: passSelection.passPurchaseId },
        });

        // A re-booked class may have been covered by a different pass before.
        if (
          existingRegistration?.passPurchaseId
          && existingRegistration.passPurchaseId !== passSelection.passPurchaseId
        ) {
          await refreshPassWindow(transaction, existingRegistration.passPurchaseId, now);
        }

        return saved;
      });

      reply.header("cache-control", "no-store");
      return reply.send({ registration: serializeRegistration(registration) });
    } catch (error) {
      return handleRegistrationError(request, reply, error, "book this class");
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

      const now = new Date();

      await dependencies.database.$transaction(async (transaction) => {
        await lockMemberPasses(transaction, user.id);

        const registration = await transaction.classRegistration.findUnique({
          select: {
            classSession: { select: { startsAt: true } },
            id: true,
            passPurchaseId: true,
            status: true,
          },
          where: {
            userId_classSessionId: { classSessionId: classSessionId.data, userId: user.id },
          },
        });

        if (!registration || registration.status !== "RESERVED") {
          return;
        }

        if (registration.classSession.startsAt <= now) {
          throw new ReservationStartedError();
        }

        await transaction.classRegistration.update({
          data: { canceledAt: now, status: "CANCELED" },
          where: { id: registration.id },
        });

        if (registration.passPurchaseId) {
          await refreshPassWindow(transaction, registration.passPurchaseId, now);
        }
      });

      return reply.code(204).send();
    } catch (error) {
      return handleRegistrationError(request, reply, error, "cancel this booking");
    }
  });

  app.get("/v1/account/class-sessions/:classSessionId/join", async (request, reply) => {
    const classSessionId = sessionIdSchema.safeParse(
      (request.params as { classSessionId?: string }).classSessionId,
    );

    if (!classSessionId.success) {
      return reply.code(400).send({ error: "Invalid class session." });
    }

    try {
      const user = await authenticateAccount(request, reply, dependencies);
      if (!user) return;

      const now = new Date();
      const reservation = await dependencies.database.classRegistration.findFirst({
        select: { classSession: { select: { meetUrl: true } } },
        where: {
          classSessionId: classSessionId.data,
          // Pass dates are enforced when booking. A booked class stays joinable even if an
          // admin later moves it, as long as the pass itself is still valid (not refunded).
          passPurchase: {
            is: { passStatus: "ACTIVE", status: "PAID" },
          },
          classSession: {
            deliveryMode: "ONLINE",
            endsAt: { gt: now },
            meetUrl: { not: null },
            published: true,
            startsAt: { lte: now },
          },
          status: "RESERVED",
          userId: user.id,
        },
      });

      if (!reservation?.classSession.meetUrl) {
        return reply.code(404).send({ error: "The class link is not available." });
      }

      reply.header("cache-control", "no-store");
      return reply.send({ meetUrl: reservation.classSession.meetUrl });
    } catch (error) {
      return handleRegistrationError(request, reply, error, "open this class");
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

  if (error instanceof PassRequiredError) {
    return reply.code(403).send({
      code: "PASS_REQUIRED",
      error: "An active camp pass is required to book a class.",
    });
  }

  if (error instanceof OutsidePassDatesError) {
    return reply.code(403).send({
      code: "OUTSIDE_PASS_DATES",
      error: `This class is outside your pass dates (${error.windows.map(formatPassWindow).join("; ")}).`,
    });
  }

  if (error instanceof ReservationStartedError) {
    return reply.code(409).send({ error: "Classes that have already started can't be canceled." });
  }

  if (error instanceof AccountIdentityConflictError) {
    request.log.warn(error, "Account identity conflict");
    return reply.code(409).send({ error: error.message });
  }

  request.log.error(error, `Unable to ${action}`);
  return reply.code(502).send({ error: `Unable to ${action}. Please try again.` });
}

class ClassUnavailableError extends Error {}

class PassRequiredError extends Error {}

class OutsidePassDatesError extends Error {
  constructor(readonly windows: PassWindow[]) {
    super("The class is outside the member's pass dates.");
  }
}

class ReservationStartedError extends Error {}
