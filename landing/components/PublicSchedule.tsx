"use client";

import type {
  DatesSetArg,
  EventApi,
  EventClickArg,
  EventContentArg,
  EventHoveringArg,
  EventInput,
  EventMountArg,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import { useAuth } from "@clerk/nextjs";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import luxonPlugin from "@fullcalendar/luxon3";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CalendarEventContent } from "@/components/CalendarEventContent";
import {
  CalendarEventPopover,
  type CalendarEventDetails,
} from "@/components/CalendarEventPopover";
import { classMenuItems } from "@/content/site";
import {
  cancelClassReservation,
  fetchRegistrations,
  reserveClassSession,
} from "@/lib/registrations-client";
import { classSessionListSchema } from "@/lib/schedule";
import { getStudioHoursInTimeZone } from "@/lib/time-zone";
import { useMediaQuery } from "@/lib/use-media-query";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";

const POPOVER_HIDE_DELAY = 220;
const eventInteractionCleanups = new WeakMap<HTMLElement, () => void>();

function getEventClassNames(eventInfo: EventContentArg) {
  const classItem = classMenuItems.find(
    (item) => item.key === eventInfo.event.extendedProps["classKey"],
  );

  switch (classItem?.category) {
    case "Latin Rhythms":
      return ["calendar-event-latin"];
    case "Swing Rhythms":
      return ["calendar-event-swing"];
    case "Smooth Rhythms":
      return ["calendar-event-smooth"];
    default:
      return ["calendar-event-default"];
  }
}

export function PublicSchedule() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const isMobileCalendar = useMediaQuery("(max-width: 820px)");
  const timeZone = useViewerTimeZone();
  const [visibleRange, setVisibleRange] = useState(() => ({
    end: new Date(),
    start: new Date(),
  }));
  const calendarHours = useMemo(
    () => getStudioHoursInTimeZone(timeZone, visibleRange.start, visibleRange.end),
    [timeZone, visibleRange],
  );
  const scheduleDateTimeFormatter = useMemo(() => new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
    weekday: "short",
  }), [timeZone]);
  const scheduleEndTimeFormatter = useMemo(() => new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }), [timeZone]);
  const calendarRef = useRef<FullCalendar>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const [eventDetails, setEventDetails] = useState<CalendarEventDetails | null>(null);
  const [reservedSessionIds, setReservedSessionIds] = useState<Set<string>>(new Set());
  const [isReservationStateReady, setIsReservationStateReady] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [reservationStateError, setReservationStateError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const hideEventDetails = useCallback(() => {
    cancelHide();
    setEventDetails(null);
    setMutationError(null);
  }, [cancelHide]);

  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimeoutRef.current = window.setTimeout(hideEventDetails, POPOVER_HIDE_DELAY);
  }, [cancelHide, hideEventDetails]);

  const showEventDetails = useCallback((event: EventApi, element: HTMLElement) => {
    cancelHide();
    const rect = element.getBoundingClientRect();
    const instructorName = event.extendedProps["instructorName"];
    const locationName = event.extendedProps["locationName"];

    setEventDetails({
      anchor: {
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        top: rect.top,
      },
      classSessionId: event.id,
      classItem: classMenuItems.find((item) => item.key === event.extendedProps["classKey"]),
      instructorName: typeof instructorName === "string" && instructorName
        ? instructorName
        : undefined,
      locationName: typeof locationName === "string" && locationName
        ? locationName
        : undefined,
      timeLabel: event.start
        ? `${scheduleDateTimeFormatter.format(event.start)}${event.end ? ` - ${scheduleEndTimeFormatter.format(event.end)}` : ""}`
        : "Time unavailable",
      title: event.title,
    });
    setMutationError(null);
  }, [cancelHide, scheduleDateTimeFormatter, scheduleEndTimeFormatter]);

  const handleEventMouseEnter = useCallback((eventInfo: EventHoveringArg) => {
    showEventDetails(eventInfo.event, eventInfo.el);
  }, [showEventDetails]);

  const handleEventClick = useCallback((eventInfo: EventClickArg) => {
    showEventDetails(eventInfo.event, eventInfo.el);
  }, [showEventDetails]);

  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    setVisibleRange((current) => {
      if (
        current.start.getTime() === dateInfo.start.getTime()
        && current.end.getTime() === dateInfo.end.getTime()
      ) {
        return current;
      }

      return { end: dateInfo.end, start: dateInfo.start };
    });
  }, []);

  const handleEventDidMount = useCallback((eventInfo: EventMountArg) => {
    const showDetails = () => showEventDetails(eventInfo.event, eventInfo.el);
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        hideEventDetails();
        eventInfo.el.blur();
      }
    };

    eventInfo.el.tabIndex = 0;
    eventInfo.el.setAttribute(
      "aria-label",
      `${eventInfo.event.title}. View details and reserve this class.`,
    );
    eventInfo.el.addEventListener("focus", showDetails);
    eventInfo.el.addEventListener("blur", scheduleHide);
    eventInfo.el.addEventListener("keydown", handleKeyDown);
    eventInteractionCleanups.set(eventInfo.el, () => {
      eventInfo.el.removeEventListener("focus", showDetails);
      eventInfo.el.removeEventListener("blur", scheduleHide);
      eventInfo.el.removeEventListener("keydown", handleKeyDown);
      eventInteractionCleanups.delete(eventInfo.el);
    });
  }, [hideEventDetails, scheduleHide, showEventDetails]);

  useEffect(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, [isSignedIn]);

  useEffect(() => {
    const calendar = calendarRef.current?.getApi();
    const nextView = isMobileCalendar ? "listWeek" : "timeGridWeek";

    if (calendar && calendar.view.type !== nextView) {
      calendar.changeView(nextView);
    }
  }, [isMobileCalendar]);

  useEffect(() => {
    const refresh = () => calendarRef.current?.getApi().refetchEvents();
    window.addEventListener("personal-schedule-changed", refresh);
    return () => window.removeEventListener("personal-schedule-changed", refresh);
  }, []);

  useEffect(() => () => cancelHide(), [cancelHide]);

  useEffect(() => {
    if (!eventDetails) return;

    const dismissForViewportChange = (event: Event) => {
      if (
        event.type === "scroll"
        && event.target instanceof Node
        && document.querySelector(".calendar-event-popover")?.contains(event.target)
      ) {
        return;
      }

      hideEventDetails();
    };
    window.addEventListener("resize", dismissForViewportChange);
    window.addEventListener("scroll", dismissForViewportChange, true);

    return () => {
      window.removeEventListener("resize", dismissForViewportChange);
      window.removeEventListener("scroll", dismissForViewportChange, true);
    };
  }, [eventDetails, hideEventDetails]);

  const loadEvents = useCallback(
    async (
      range: EventSourceFuncArg,
      success: (events: EventInput[]) => void,
      failure: (error: Error) => void,
    ) => {
      try {
        setError(null);
        setReservationStateError(null);
        setIsReservationStateReady(!isSignedIn);
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
              classKey: session.classKey,
              instructorName: session.instructorName,
              locationName: session.locationName,
            },
            id: session.id,
            start: session.startsAt,
            title: session.title,
          })),
        );

        if (isSignedIn) {
          try {
            const registrations = await fetchRegistrations(range.startStr, range.endStr);
            setReservedSessionIds(new Set(registrations.map((item) => item.session.id)));
            setIsReservationStateReady(true);
          } catch (caughtError) {
            setReservedSessionIds(new Set());
            setIsReservationStateReady(false);
            setReservationStateError(
              caughtError instanceof Error
                ? caughtError.message
                : "Your reservations could not be loaded.",
            );
          }
        } else {
          setReservedSessionIds(new Set());
          setIsReservationStateReady(true);
        }
      } catch (caughtError) {
        const loadError = caughtError instanceof Error
          ? caughtError
          : new Error("The current schedule could not be loaded.");
        setError(loadError.message);
        setIsEmpty(false);
        failure(loadError);
      }
    },
    [isSignedIn],
  );

  async function toggleReservation() {
    if (!eventDetails || !isSignedIn || pendingSessionId) return;

    const sessionId = eventDetails.classSessionId;
    const isReserved = reservedSessionIds.has(sessionId);
    setPendingSessionId(sessionId);
    setMutationError(null);

    try {
      if (isReserved) {
        await cancelClassReservation(sessionId);
        setReservedSessionIds((current) => {
          const next = new Set(current);
          next.delete(sessionId);
          return next;
        });
      } else {
        await reserveClassSession(sessionId);
        setReservedSessionIds((current) => new Set(current).add(sessionId));
      }

      window.dispatchEvent(new CustomEvent("personal-schedule-changed"));
    } catch (caughtError) {
      setMutationError(
        caughtError instanceof Error ? caughtError.message : "Your schedule could not be updated.",
      );
    } finally {
      setPendingSessionId(null);
    }
  }

  return (
    <div className="public-calendar-shell">
      <FullCalendar
        allDaySlot={false}
        datesSet={handleDatesSet}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        eventClassNames={getEventClassNames}
        eventContent={(eventInfo) => <CalendarEventContent eventInfo={eventInfo} />}
        eventClick={handleEventClick}
        eventDidMount={handleEventDidMount}
        eventMinHeight={46}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={scheduleHide}
        eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        eventShortHeight={46}
        events={loadEvents}
        expandRows
        firstDay={1}
        headerToolbar={isMobileCalendar
          ? { left: "prev,next", center: "title", right: "today" }
          : { left: "prev,next today", center: "title", right: "" }}
        height="auto"
        initialView={isMobileCalendar ? "listWeek" : "timeGridWeek"}
        nowIndicator
        plugins={[timeGridPlugin, listPlugin, interactionPlugin, luxonPlugin]}
        ref={calendarRef}
        slotDuration="00:20:00"
        slotLabelInterval="01:00:00"
        slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        slotMaxTime={calendarHours.slotMaxTime}
        slotMinTime={calendarHours.slotMinTime}
        timeZone={timeZone}
        eventWillUnmount={(eventInfo) => eventInteractionCleanups.get(eventInfo.el)?.()}
      />
      {eventDetails && typeof document !== "undefined"
        ? createPortal(
          <CalendarEventPopover
            details={eventDetails}
            error={mutationError ?? reservationStateError}
            isAuthLoaded={isAuthLoaded}
            isPending={pendingSessionId === eventDetails.classSessionId}
            isSaved={reservedSessionIds.has(eventDetails.classSessionId)}
            isSavedStateReady={isReservationStateReady}
            isSignedIn={Boolean(isSignedIn)}
            onDismiss={hideEventDetails}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
            onToggleSaved={() => void toggleReservation()}
          />,
          document.body,
        )
        : null}
      {isEmpty ? <p className="calendar-state">No classes are posted for the selected dates.</p> : null}
      {error ? <p className="calendar-state calendar-error" role="alert">{error}</p> : null}
    </div>
  );
}
