"use client";

import type {
  DatesSetArg,
  EventApi,
  EventClickArg,
  EventHoveringArg,
  EventInput,
  EventMountArg,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import { useAuth } from "@clerk/nextjs";
import interactionPlugin from "@fullcalendar/interaction";
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
  fetchSavedClassSessions,
  removeSavedClassSession,
  saveClassSession,
} from "@/lib/saved-class-sessions-client";
import { classSessionListSchema } from "@/lib/schedule";
import { getStudioHoursInTimeZone } from "@/lib/time-zone";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";

const POPOVER_HIDE_DELAY = 220;
const eventInteractionCleanups = new WeakMap<HTMLElement, () => void>();

export function PublicSchedule() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
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
  const [savedSessionIds, setSavedSessionIds] = useState<Set<string>>(new Set());
  const [isSavedStateReady, setIsSavedStateReady] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [savedStateError, setSavedStateError] = useState<string | null>(null);
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
      classItem: classMenuItems.find((item) => item.title === event.title),
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
      `${eventInfo.event.title}. View details and add to your schedule.`,
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
    const refresh = () => calendarRef.current?.getApi().refetchEvents();
    window.addEventListener("personal-schedule-changed", refresh);
    return () => window.removeEventListener("personal-schedule-changed", refresh);
  }, []);

  useEffect(() => () => cancelHide(), [cancelHide]);

  useEffect(() => {
    if (!eventDetails) return;

    const dismissForViewportChange = () => hideEventDetails();
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
        setSavedStateError(null);
        setIsSavedStateReady(!isSignedIn);
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

        if (isSignedIn) {
          try {
            const selections = await fetchSavedClassSessions(range.startStr, range.endStr);
            setSavedSessionIds(new Set(selections.map((selection) => selection.session.id)));
            setIsSavedStateReady(true);
          } catch (caughtError) {
            setSavedSessionIds(new Set());
            setIsSavedStateReady(false);
            setSavedStateError(
              caughtError instanceof Error
                ? caughtError.message
                : "Your saved classes could not be loaded.",
            );
          }
        } else {
          setSavedSessionIds(new Set());
          setIsSavedStateReady(true);
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

  async function toggleSavedSession() {
    if (!eventDetails || !isSignedIn || pendingSessionId) return;

    const sessionId = eventDetails.classSessionId;
    const isSaved = savedSessionIds.has(sessionId);
    setPendingSessionId(sessionId);
    setMutationError(null);

    try {
      if (isSaved) {
        await removeSavedClassSession(sessionId);
        setSavedSessionIds((current) => {
          const next = new Set(current);
          next.delete(sessionId);
          return next;
        });
      } else {
        await saveClassSession(sessionId);
        setSavedSessionIds((current) => new Set(current).add(sessionId));
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
        eventContent={(eventInfo) => <CalendarEventContent eventInfo={eventInfo} />}
        eventClick={handleEventClick}
        eventDidMount={handleEventDidMount}
        eventMinHeight={58}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={scheduleHide}
        eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        events={loadEvents}
        expandRows
        firstDay={1}
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        height="auto"
        initialView="timeGridWeek"
        nowIndicator
        plugins={[timeGridPlugin, interactionPlugin, luxonPlugin]}
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
            error={mutationError ?? savedStateError}
            isAuthLoaded={isAuthLoaded}
            isPending={pendingSessionId === eventDetails.classSessionId}
            isSaved={savedSessionIds.has(eventDetails.classSessionId)}
            isSavedStateReady={isSavedStateReady}
            isSignedIn={Boolean(isSignedIn)}
            onDismiss={hideEventDetails}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
            onToggleSaved={() => void toggleSavedSession()}
          />,
          document.body,
        )
        : null}
      {isEmpty ? <p className="calendar-state">No classes are posted for this week.</p> : null}
      {error ? <p className="calendar-state calendar-error" role="alert">{error}</p> : null}
    </div>
  );
}
