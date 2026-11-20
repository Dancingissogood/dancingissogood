import type { DatabaseClient } from "@dancingissogood/db";
import { DateTime } from "luxon";

export const STUDIO_TIME_ZONE = "America/Detroit";

type TransactionClient = Parameters<Parameters<DatabaseClient["$transaction"]>[0]>[0];

// Registrations that occupy a day of a pass. Canceled registrations free their day.
const ACTIVE_REGISTRATION_STATUSES = ["RESERVED", "ATTENDED", "NO_SHOW"] as const;

export type PassWindow = { validFrom: Date; validUntil: Date };

export type PassSelection =
  | { status: "selected"; passPurchaseId: string; window: PassWindow }
  | { status: "no-pass" }
  | { status: "outside-window"; windows: PassWindow[] };

function studioDay(instant: Date): DateTime {
  return DateTime.fromJSDate(instant, { zone: STUDIO_TIME_ZONE }).startOf("day");
}

/**
 * A pass covers `accessDays` consecutive studio calendar days, starting on the
 * day of the earliest class booked with it. `validUntil` is exclusive.
 */
export function computePassWindow(firstClassStartsAt: Date, accessDays: number): PassWindow {
  const firstDay = studioDay(firstClassStartsAt);

  return {
    validFrom: firstDay.toJSDate(),
    validUntil: firstDay.plus({ days: accessDays }).toJSDate(),
  };
}

/** Serializes changes to one member's pass dates (booking and canceling). */
export async function lockMemberPasses(transaction: TransactionClient, userId: string) {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`member-passes:${userId}`}, 0))
  `;
}

/**
 * Chooses which of the member's passes should cover a class, without writing anything.
 * Passes already covering the class are preferred, then started passes whose window can
 * still move earlier, then the oldest unstarted pass.
 */
export async function selectPassForClass(
  transaction: TransactionClient,
  userId: string,
  classStartsAt: Date,
  now: Date,
): Promise<PassSelection> {
  const passes = await transaction.passPurchase.findMany({
    orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      passProduct: { select: { accessDays: true } },
      registrations: {
        select: { classSession: { select: { startsAt: true } } },
        where: { status: { in: [...ACTIVE_REGISTRATION_STATUSES] } },
      },
      validFrom: true,
      validUntil: true,
    },
    where: { passStatus: "ACTIVE", status: "PAID", userId },
  });

  if (passes.length === 0) {
    return { status: "no-pass" };
  }

  const covering: Array<{ id: string; window: PassWindow }> = [];
  const movable: Array<{ id: string; window: PassWindow }> = [];
  const unstarted: Array<{ id: string; window: PassWindow }> = [];
  const windows: PassWindow[] = [];

  for (const pass of passes) {
    const accessDays = pass.passProduct.accessDays;
    const bookedStarts = pass.registrations.map((registration) => registration.classSession.startsAt);

    if (bookedStarts.length === 0) {
      unstarted.push({ id: pass.id, window: computePassWindow(classStartsAt, accessDays) });
      continue;
    }

    const earliestBooked = new Date(Math.min(...bookedStarts.map((startsAt) => startsAt.getTime())));
    const currentWindow =
      pass.validFrom && pass.validUntil
        ? { validFrom: pass.validFrom, validUntil: pass.validUntil }
        : computePassWindow(earliestBooked, accessDays);
    windows.push(currentWindow);

    if (classStartsAt >= currentWindow.validFrom && classStartsAt < currentWindow.validUntil) {
      covering.push({ id: pass.id, window: currentWindow });
      continue;
    }

    // Once the first class on a pass has started, its dates are fixed.
    const locked = earliestBooked <= now;
    if (locked || classStartsAt >= earliestBooked) {
      continue;
    }

    const candidate = computePassWindow(classStartsAt, accessDays);
    const everythingStillFits = bookedStarts.every((startsAt) => startsAt < candidate.validUntil);

    if (everythingStillFits) {
      movable.push({ id: pass.id, window: candidate });
    }
  }

  const choice = covering[0] ?? movable[0] ?? unstarted[0];

  if (choice) {
    return { status: "selected", passPurchaseId: choice.id, window: choice.window };
  }

  return { status: "outside-window", windows };
}

/**
 * Recomputes a pass's dates from its active bookings. Called after a booking is canceled
 * so an unstarted pass can begin again with the member's next booking.
 */
export async function refreshPassWindow(
  transaction: TransactionClient,
  passPurchaseId: string,
  now: Date,
): Promise<void> {
  const pass = await transaction.passPurchase.findUnique({
    select: {
      passProduct: { select: { accessDays: true } },
      registrations: {
        select: { classSession: { select: { startsAt: true } } },
        where: { status: { in: [...ACTIVE_REGISTRATION_STATUSES] } },
      },
    },
    where: { id: passPurchaseId },
  });

  if (!pass) return;

  const bookedStarts = pass.registrations.map((registration) => registration.classSession.startsAt);

  if (bookedStarts.length === 0) {
    await transaction.passPurchase.update({
      data: { validFrom: null, validUntil: null },
      where: { id: passPurchaseId },
    });
    return;
  }

  const earliestBooked = new Date(Math.min(...bookedStarts.map((startsAt) => startsAt.getTime())));

  // Once the first class on a pass has started, its dates are fixed.
  if (earliestBooked <= now) {
    return;
  }

  const window = computePassWindow(earliestBooked, pass.passProduct.accessDays);

  await transaction.passPurchase.update({ data: window, where: { id: passPurchaseId } });
}

export function formatPassWindow(window: PassWindow): string {
  const first = DateTime.fromJSDate(window.validFrom, { zone: STUDIO_TIME_ZONE });
  const last = DateTime.fromJSDate(window.validUntil, { zone: STUDIO_TIME_ZONE }).minus({ days: 1 });
  const format = "ccc, LLL d";

  return first.hasSame(last, "day")
    ? first.toFormat(format)
    : `${first.toFormat(format)} – ${last.toFormat(format)}`;
}
