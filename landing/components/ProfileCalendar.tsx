"use client";

import type { DatesSetArg, EventClickArg, EventInput, EventSourceFuncArg } from "@fullcalendar/core";
import luxonPlugin from "@fullcalendar/luxon3";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { CalendarDays, Clock3, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CalendarEventContent } from "@/components/CalendarEventContent";
import { classMenuItems } from "@/content/site";
import type { SavedClassSession } from "@/lib/saved-class-sessions";
import {
  fetchSavedClassSessions,
  removeSavedClassSession,
} from "@/lib/saved-class-sessions-client";
import { getStudioHoursInTimeZone, getTimeZoneDisplayName } from "@/lib/time-zone";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";

export function ProfileCalendar() {
  const timeZone = useViewerTimeZone();
  const timeZoneName = getTimeZoneDisplayName(timeZone);
  const [visibleRange, setVisibleRange] = useState(() => ({
    end: new Date(),
    start: new Date(),
  }));
  const calendarHours = useMemo(
    () => getStudioHoursInTimeZone(timeZone, visibleRange.start, visibleRange.end),
    [timeZone, visibleRange],
  );
  const dateTimeFormatter = useMemo(() => new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    timeZone,
    timeZoneName: "short",
    weekday: "long",
    year: "numeric",
  }), [timeZone]);
  const calendarRef = useRef<FullCalendar>(null);
  const [visibleSelections, setVisibleSelections] = useState<SavedClassSession[]>([]);
  const [selected, setSelected] = useState<SavedClassSession | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(
    async (
      range: EventSourceFuncArg,
      success: (events: EventInput[]) => void,
      failure: (error: Error) => void,
    ) => {
      try {
        setError(null);
        const selections = await fetchSavedClassSessions(range.startStr, range.endStr);
        setHasLoaded(true);
        setVisibleSelections(selections);
        setSelected((current) => {
          if (!current) return null;
          return selections.find((selection) => selection.id === current.id) ?? null;
        });
        success(selections.map((selection) => ({
          end: selection.session.endsAt,
          extendedProps: {
            instructorName: selection.session.instructorName,
            selection,
          },
          id: selection.id,
          start: selection.session.startsAt,
          title: selection.session.title,
        })));
      } catch (caughtError) {
        const loadError = caughtError instanceof Error
          ? caughtError
          : new Error("Your saved classes could not be loaded.");
        setVisibleSelections([]);
        setHasLoaded(true);
        setError(loadError.message);
        failure(loadError);
      }
    },
    [],
  );

  useEffect(() => {
    const refresh = () => calendarRef.current?.getApi().refetchEvents();
    window.addEventListener("personal-schedule-changed", refresh);
    return () => window.removeEventListener("personal-schedule-changed", refresh);
  }, []);

  function selectEvent(eventInfo: EventClickArg) {
    const selection = eventInfo.event.extendedProps["selection"];
    if (isSavedClassSession(selection)) setSelected(selection);
  }

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

  async function removeSelected() {
    if (!selected || isRemoving) return;

    setIsRemoving(true);
    setError(null);

    try {
      await removeSavedClassSession(selected.session.id);
      setSelected(null);
      calendarRef.current?.getApi().refetchEvents();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "This class could not be removed.");
    } finally {
      setIsRemoving(false);
    }
  }

  const selectedClassItem = selected
    ? classMenuItems.find((item) => item.title === selected.session.title)
    : undefined;

  return (
    <section id="my-schedule" className="account-schedule" aria-labelledby="my-schedule-title">
      <div className="account-section-heading account-schedule-heading">
        <div>
          <h2 id="my-schedule-title">My schedule</h2>
          <p>
            Classes you save appear here. Times are shown in {timeZoneName}.{" "}
            Saving a class does not reserve capacity.
          </p>
        </div>
        <span>{visibleSelections.length}</span>
      </div>

      <div className="public-calendar-shell profile-calendar-shell">
        <FullCalendar
          allDaySlot={false}
          datesSet={handleDatesSet}
          dayHeaderFormat={{ weekday: "short", day: "numeric" }}
          eventClick={selectEvent}
          eventContent={(eventInfo) => <CalendarEventContent eventInfo={eventInfo} />}
          eventMinHeight={58}
          eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
          events={loadEvents}
          expandRows
          firstDay={1}
          headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
          height="auto"
          initialView="timeGridWeek"
          nowIndicator
          plugins={[timeGridPlugin, luxonPlugin]}
          ref={calendarRef}
          slotDuration="00:20:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
          slotMaxTime={calendarHours.slotMaxTime}
          slotMinTime={calendarHours.slotMinTime}
          timeZone={timeZone}
        />
      </div>

      {hasLoaded && visibleSelections.length === 0 && !error ? (
        <div className="profile-calendar-empty">
          <CalendarDays aria-hidden="true" />
          <div>
            <h3>No saved classes this week</h3>
            <p>Choose a class and save the time that works for you.</p>
          </div>
          <Link className="button button-secondary" href="/#menu">Browse Classes</Link>
        </div>
      ) : null}

      {selected ? (
        <article className="profile-selection-detail" aria-label={`Selected class: ${selected.session.title}`}>
          {selectedClassItem ? (
            <div className="profile-selection-image">
              <Image src={selectedClassItem.image} alt="" fill sizes="140px" />
            </div>
          ) : null}
          <div className="profile-selection-copy">
            <span>{selected.session.published ? "Saved class" : "No longer published"}</span>
            <h3>{selected.session.title}</h3>
            <p><Clock3 aria-hidden="true" />{dateTimeFormatter.format(new Date(selected.session.startsAt))}</p>
            {selected.session.locationName ? <p><MapPin aria-hidden="true" />{selected.session.locationName}</p> : null}
          </div>
          <button className="profile-selection-remove" disabled={isRemoving} type="button" onClick={() => void removeSelected()}>
            <Trash2 aria-hidden="true" />
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </article>
      ) : null}

      {error ? <p className="profile-calendar-error" role="alert">{error}</p> : null}
    </section>
  );
}

function isSavedClassSession(value: unknown): value is SavedClassSession {
  return typeof value === "object" && value !== null && "id" in value && "session" in value;
}
