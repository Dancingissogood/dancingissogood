"use client";

import type { DatesSetArg, EventClickArg, EventInput, EventSourceFuncArg } from "@fullcalendar/core";
import listPlugin from "@fullcalendar/list";
import luxonPlugin from "@fullcalendar/luxon3";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { CalendarDays, Clock3, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CalendarEventContent } from "@/components/CalendarEventContent";
import { classMenuItems } from "@/content/site";
import type { ClassRegistration } from "@/lib/registrations";
import {
  cancelClassReservation,
  fetchRegistrations,
} from "@/lib/registrations-client";
import { getStudioHoursInTimeZone, getTimeZoneDisplayName } from "@/lib/time-zone";
import { useMediaQuery } from "@/lib/use-media-query";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";

export function ProfileCalendar() {
  const isMobileCalendar = useMediaQuery("(max-width: 820px)");
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
  const [visibleRegistrations, setVisibleRegistrations] = useState<ClassRegistration[]>([]);
  const [selected, setSelected] = useState<ClassRegistration | null>(null);
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
        const selections = await fetchRegistrations(range.startStr, range.endStr);
        setHasLoaded(true);
        setVisibleRegistrations(selections);
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
          : new Error("Your reservations could not be loaded.");
        setVisibleRegistrations([]);
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

  useEffect(() => {
    const calendar = calendarRef.current?.getApi();
    const nextView = isMobileCalendar ? "listWeek" : "timeGridWeek";

    if (calendar && calendar.view.type !== nextView) {
      calendar.changeView(nextView);
    }
  }, [isMobileCalendar]);

  function selectEvent(eventInfo: EventClickArg) {
    const selection = eventInfo.event.extendedProps["selection"];
    if (isClassRegistration(selection)) setSelected(selection);
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
      await cancelClassReservation(selected.session.id);
      setSelected(null);
      calendarRef.current?.getApi().refetchEvents();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "This class could not be removed.");
    } finally {
      setIsRemoving(false);
    }
  }

  const selectedClassItem = selected
    ? classMenuItems.find((item) => item.key === selected.session.classKey)
    : undefined;

  return (
    <section id="my-schedule" className="account-schedule" aria-labelledby="my-schedule-title">
      <div className="account-section-heading account-schedule-heading">
        <div>
          <h2 id="my-schedule-title">My schedule</h2>
          <p>
            Your reserved classes in {timeZoneName}.
          </p>
        </div>
        <span>{visibleRegistrations.length}</span>
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
          headerToolbar={isMobileCalendar
            ? { left: "prev,next", center: "title", right: "today" }
            : { left: "prev,next today", center: "title", right: "" }}
          height="auto"
          initialView={isMobileCalendar ? "listWeek" : "timeGridWeek"}
          nowIndicator
          plugins={[timeGridPlugin, listPlugin, luxonPlugin]}
          ref={calendarRef}
          slotDuration="00:20:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
          slotMaxTime={calendarHours.slotMaxTime}
          slotMinTime={calendarHours.slotMinTime}
          timeZone={timeZone}
        />
      </div>

      {hasLoaded && visibleRegistrations.length === 0 && !error ? (
        <div className="profile-calendar-empty">
          <CalendarDays aria-hidden="true" />
          <div>
            <h3>No reservations for these dates</h3>
            <p>Choose a class from the movement menu or current schedule.</p>
          </div>
          <Link className="button button-secondary" href="/#menu">Explore Classes</Link>
        </div>
      ) : null}

      {selected ? (
        <article className="profile-selection-detail" aria-label={`Selected class: ${selected.session.title}`}>
          {selectedClassItem ? (
            <div className="profile-selection-image">
              <Image
                src={selectedClassItem.image}
                alt=""
                fill
                quality={85}
                sizes="140px"
              />
            </div>
          ) : null}
          <div className="profile-selection-copy">
            <span>{selected.session.published ? "Reserved class" : "No longer published"}</span>
            <h3>{selected.session.title}</h3>
            <p><Clock3 aria-hidden="true" />{dateTimeFormatter.format(new Date(selected.session.startsAt))}</p>
            {selected.session.locationName ? <p><MapPin aria-hidden="true" />{selected.session.locationName}</p> : null}
          </div>
          <button className="profile-selection-remove" disabled={isRemoving} type="button" onClick={() => void removeSelected()}>
            <Trash2 aria-hidden="true" />
            {isRemoving ? "Canceling..." : "Cancel reservation"}
          </button>
        </article>
      ) : null}

      {error ? <p className="profile-calendar-error" role="alert">{error}</p> : null}
    </section>
  );
}

function isClassRegistration(value: unknown): value is ClassRegistration {
  return typeof value === "object" && value !== null && "id" in value && "session" in value;
}
