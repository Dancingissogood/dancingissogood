"use client";

import type { EventContentArg } from "@fullcalendar/core";
import Image from "next/image";

import { classMenuItems } from "@/content/site";

type CalendarEventContentProps = {
  eventInfo: EventContentArg;
};

export function CalendarEventContent({ eventInfo }: CalendarEventContentProps) {
  const classItem = classMenuItems.find((item) => item.title === eventInfo.event.title);
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
      {classItem ? (
        <span className="calendar-event-image-frame" aria-hidden="true">
          <Image
            alt=""
            className="calendar-event-image"
            height={64}
            quality={85}
            sizes="(max-width: 820px) 56px, 38px"
            src={classItem.image}
            width={64}
          />
        </span>
      ) : null}
      <div className="calendar-event-copy">
        <strong>{eventInfo.event.title}</strong>
        <div className="calendar-event-meta">
          <span className="calendar-event-time">{eventInfo.timeText}</span>
          <span className={`calendar-event-status calendar-event-status-${String(availabilityStatus).toLowerCase()}`}>
            {statusLabel}
          </span>
        </div>
        {typeof instructorName === "string" && instructorName ? (
          <span className="calendar-event-instructor">{instructorName}</span>
        ) : null}
      </div>
    </div>
  );
}
