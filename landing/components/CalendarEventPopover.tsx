"use client";

import Image from "next/image";

import type { ClassMenuItem } from "@/content/site";

export type CalendarEventDetails = {
  classItem?: ClassMenuItem;
  instructorName?: string;
  left: number;
  locationName?: string;
  timeLabel: string;
  title: string;
  top: number;
};

type CalendarEventPopoverProps = {
  details: CalendarEventDetails;
};

export function CalendarEventPopover({ details }: CalendarEventPopoverProps) {
  return (
    <aside
      className="calendar-event-popover"
      role="tooltip"
      style={{ left: details.left, top: details.top }}
    >
      {details.classItem ? (
        <div className="calendar-event-popover-image">
          <Image
            alt={details.classItem.imageAlt}
            fill
            sizes="320px"
            src={details.classItem.image}
          />
        </div>
      ) : null}
      <div className="calendar-event-popover-body">
        <span className="calendar-event-popover-time">{details.timeLabel}</span>
        <strong>{details.title}</strong>
        {details.classItem ? <p>{details.classItem.description}</p> : null}
        {details.instructorName || details.locationName ? (
          <dl>
            {details.instructorName ? (
              <div>
                <dt>Instructor</dt>
                <dd>{details.instructorName}</dd>
              </div>
            ) : null}
            {details.locationName ? (
              <div>
                <dt>Location</dt>
                <dd>{details.locationName}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </aside>
  );
}
