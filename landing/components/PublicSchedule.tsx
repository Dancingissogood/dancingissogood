"use client";

import type { EventInput, EventSourceFuncArg } from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useCallback, useState } from "react";

import { classSessionListSchema } from "@/lib/schedule";

const TIME_ZONE = "America/Detroit";

export function PublicSchedule() {
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const loadEvents = useCallback(
    async (
      range: EventSourceFuncArg,
      success: (events: EventInput[]) => void,
      failure: (error: Error) => void,
    ) => {
      try {
        setError(null);
        const query = new URLSearchParams({ from: range.startStr, to: range.endStr });
        const response = await fetch(`/api/class-sessions?${query.toString()}`, {
          cache: "no-store",
        });
        const payload: unknown = await response.json();
        const parsed = classSessionListSchema.safeParse(payload);

        if (!response.ok || !parsed.success) {
          throw new Error("The current schedule could not be loaded.");
        }

        setIsEmpty(parsed.data.sessions.length === 0);
        success(
          parsed.data.sessions.map((session) => ({
            end: session.endsAt,
            extendedProps: {
              instructorName: session.instructorName,
              locationName: session.locationName,
            },
            id: session.id,
            start: session.startsAt,
            title: session.title,
          })),
        );
      } catch (caughtError) {
        const loadError = caughtError instanceof Error
          ? caughtError
          : new Error("The current schedule could not be loaded.");
        setError(loadError.message);
        setIsEmpty(false);
        failure(loadError);
      }
    },
    [],
  );

  return (
    <div className="public-calendar-shell">
      <FullCalendar
        allDaySlot={false}
        dayHeaderFormat={{ weekday: "short", month: "short", day: "numeric" }}
        eventContent={(eventInfo) => (
          <div className="public-calendar-event">
            <strong>{eventInfo.event.title}</strong>
            {eventInfo.event.extendedProps["instructorName"] ? (
              <span>{eventInfo.event.extendedProps["instructorName"]}</span>
            ) : null}
          </div>
        )}
        eventMinHeight={44}
        eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        events={loadEvents}
        expandRows
        firstDay={1}
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        height="auto"
        hiddenDays={[0, 4, 5, 6]}
        initialView="timeGridWeek"
        nowIndicator
        plugins={[timeGridPlugin, interactionPlugin, luxonPlugin]}
        slotDuration="00:20:00"
        slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        slotMaxTime="14:20:00"
        slotMinTime="07:00:00"
        timeZone={TIME_ZONE}
      />
      {isEmpty ? <p className="calendar-state">No classes are posted for this week.</p> : null}
      {error ? <p className="calendar-state calendar-error" role="alert">{error}</p> : null}
    </div>
  );
}
