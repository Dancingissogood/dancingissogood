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

  return (
    <div className="calendar-event-content">
      {classItem ? (
        <Image
          alt=""
          className="calendar-event-image"
          height={44}
          sizes="44px"
          src={classItem.image}
          width={44}
        />
      ) : null}
      <div className="calendar-event-copy">
        <span className="calendar-event-time">{eventInfo.timeText}</span>
        <strong>{eventInfo.event.title}</strong>
        {typeof instructorName === "string" && instructorName ? (
          <span className="calendar-event-instructor">{instructorName}</span>
        ) : null}
      </div>
    </div>
  );
}
