"use client";

import type { EventContentArg } from "@fullcalendar/core";

type CalendarEventContentProps = {
  eventInfo: EventContentArg;
};

export function CalendarEventContent({ eventInfo }: CalendarEventContentProps) {
  const instructorName = eventInfo.event.extendedProps["instructorName"];
  const availabilityStatus = eventInfo.event.extendedProps["availabilityStatus"];
  const deliveryMode = eventInfo.event.extendedProps["deliveryMode"];
  const statusLabel = availabilityStatus === "NO_VACANCY"
    ? "No vacancy"
    : deliveryMode === "ONLINE"
      ? "Online class"
      : "Available";

  return (
    <div className="calendar-event-content">
      <div className="calendar-event-copy">
        <strong>{eventInfo.event.title}</strong>
        <div className="calendar-event-meta">
          <span className={`calendar-event-status calendar-event-status-${String(availabilityStatus).toLowerCase()}`}>
            {statusLabel}
          </span>
          <span className="calendar-event-time">{eventInfo.timeText}</span>
        </div>
        {typeof instructorName === "string" && instructorName ? (
          <span className="calendar-event-instructor">{instructorName}</span>
        ) : null}
      </div>
    </div>
  );
}
