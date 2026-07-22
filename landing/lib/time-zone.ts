import { DateTime } from "luxon";

export const STUDIO_TIME_ZONE = "America/Detroit";

export function getTimeZoneDisplayName(timeZone: string, date = new Date()) {
  const timeZonePart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "long",
  }).formatToParts(date).find((part) => part.type === "timeZoneName");

  return timeZonePart?.value ?? timeZone;
}

export function getStudioHoursInTimeZone(
  timeZone: string,
  rangeStart = new Date(),
  rangeEnd = rangeStart,
) {
  let studioDate = DateTime.fromJSDate(rangeStart)
    .setZone(STUDIO_TIME_ZONE)
    .startOf("day")
    .minus({ days: 1 });
  const finalStudioDate = DateTime.fromJSDate(rangeEnd)
    .setZone(STUDIO_TIME_ZONE)
    .startOf("day")
    .plus({ days: 1 });
  let earliestStartMinutes = 24 * 60;
  let latestEndMinutes = 0;

  while (studioDate.toMillis() <= finalStudioDate.toMillis()) {
    const studioStart = studioDate.set({ hour: 9 }).setZone(timeZone);
    const studioEnd = studioDate.set({ hour: 14 }).setZone(timeZone);

    if (studioStart.toISODate() !== studioEnd.toISODate()) {
      return { slotMinTime: "00:00:00", slotMaxTime: "24:00:00" };
    }

    earliestStartMinutes = Math.min(earliestStartMinutes, minutesSinceMidnight(studioStart));
    latestEndMinutes = Math.max(latestEndMinutes, minutesSinceMidnight(studioEnd));
    studioDate = studioDate.plus({ days: 1 });
  }

  return {
    slotMinTime: formatCalendarDuration(earliestStartMinutes),
    slotMaxTime: formatCalendarDuration(latestEndMinutes),
  };
}

function minutesSinceMidnight(dateTime: DateTime) {
  return dateTime.hour * 60 + dateTime.minute;
}

function formatCalendarDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:00`;
}
