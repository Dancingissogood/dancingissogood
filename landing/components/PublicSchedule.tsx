"use client";

import type {
  EventApi,
  EventHoveringArg,
  EventInput,
  EventMountArg,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useCallback, useState } from "react";

import { CalendarEventContent } from "@/components/CalendarEventContent";
import {
  CalendarEventPopover,
  type CalendarEventDetails,
} from "@/components/CalendarEventPopover";
import { classMenuItems } from "@/content/site";
import { classSessionListSchema } from "@/lib/schedule";

const TIME_ZONE = "America/Detroit";
const POPOVER_HEIGHT = 340;
const POPOVER_WIDTH = 320;
const VIEWPORT_GAP = 12;
const eventInteractionCleanups = new WeakMap<HTMLElement, () => void>();
const scheduleDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  timeZone: TIME_ZONE,
  weekday: "short",
});
const scheduleEndTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

export function PublicSchedule() {
  const [eventDetails, setEventDetails] = useState<CalendarEventDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const showEventDetails = useCallback((event: EventApi, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const roomOnRight = window.innerWidth - rect.right;
    const left = roomOnRight >= POPOVER_WIDTH + VIEWPORT_GAP
      ? rect.right + VIEWPORT_GAP
      : Math.max(VIEWPORT_GAP, rect.left - POPOVER_WIDTH - VIEWPORT_GAP);
    const top = rect.bottom + VIEWPORT_GAP + POPOVER_HEIGHT <= window.innerHeight
      ? rect.bottom + VIEWPORT_GAP
      : Math.max(VIEWPORT_GAP, rect.top - POPOVER_HEIGHT - VIEWPORT_GAP);
    const instructorName = event.extendedProps["instructorName"];
    const locationName = event.extendedProps["locationName"];

    setEventDetails({
      classItem: classMenuItems.find((item) => item.title === event.title),
      instructorName: typeof instructorName === "string" && instructorName
        ? instructorName
        : undefined,
      left,
      locationName: typeof locationName === "string" && locationName
        ? locationName
        : undefined,
      timeLabel: event.start
        ? `${scheduleDateTimeFormatter.format(event.start)}${event.end ? ` - ${scheduleEndTimeFormatter.format(event.end)}` : ""}`
        : "Time to be announced",
      title: event.title,
      top,
    });
  }, []);

  const handleEventMouseEnter = useCallback((eventInfo: EventHoveringArg) => {
    showEventDetails(eventInfo.event, eventInfo.el);
  }, [showEventDetails]);

  const handleEventDidMount = useCallback((eventInfo: EventMountArg) => {
    const showDetails = () => showEventDetails(eventInfo.event, eventInfo.el);
    const hideDetails = () => setEventDetails(null);
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        hideDetails();
        eventInfo.el.blur();
      }
    };

    eventInfo.el.tabIndex = 0;
    eventInfo.el.setAttribute(
      "aria-label",
      `${eventInfo.event.title}. Focus for class details.`,
    );
    eventInfo.el.addEventListener("focus", showDetails);
    eventInfo.el.addEventListener("blur", hideDetails);
    eventInfo.el.addEventListener("keydown", handleKeyDown);
    eventInteractionCleanups.set(eventInfo.el, () => {
      eventInfo.el.removeEventListener("focus", showDetails);
      eventInfo.el.removeEventListener("blur", hideDetails);
      eventInfo.el.removeEventListener("keydown", handleKeyDown);
      eventInteractionCleanups.delete(eventInfo.el);
    });
  }, [showEventDetails]);

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
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        eventContent={(eventInfo) => <CalendarEventContent eventInfo={eventInfo} />}
        eventDidMount={handleEventDidMount}
        eventMinHeight={58}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={() => setEventDetails(null)}
        eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        events={loadEvents}
        expandRows
        firstDay={1}
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        height="auto"
        initialView="timeGridWeek"
        nowIndicator
        plugins={[timeGridPlugin, interactionPlugin, luxonPlugin]}
        slotDuration="00:20:00"
        slotLabelInterval="01:00:00"
        slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        slotMaxTime="14:00:00"
        slotMinTime="09:00:00"
        timeZone={TIME_ZONE}
        eventWillUnmount={(eventInfo) => eventInteractionCleanups.get(eventInfo.el)?.()}
      />
      {eventDetails ? <CalendarEventPopover details={eventDetails} /> : null}
      {isEmpty ? <p className="calendar-state">No classes are posted for this week.</p> : null}
      {error ? <p className="calendar-state calendar-error" role="alert">{error}</p> : null}
    </div>
  );
}
