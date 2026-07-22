"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { DateTime } from "luxon";
import { CalendarCheck2, Check, ChevronLeft, ChevronRight, Clock3, MapPin, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ClassMenuItem } from "@/content/site";
import type { ClassSession } from "@/lib/schedule";
import { classSessionListSchema } from "@/lib/schedule";
import {
  fetchSavedClassSessions,
  removeSavedClassSession,
  saveClassSession,
} from "@/lib/saved-class-sessions-client";
import { getTimeZoneDisplayName } from "@/lib/time-zone";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ClassSessionPickerProps = {
  autoFocus: boolean;
  classItem: ClassMenuItem;
};

export function ClassSessionPicker({ autoFocus, classItem }: ClassSessionPickerProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const timeZone = useViewerTimeZone();
  const timeZoneName = getTimeZoneDisplayName(timeZone);
  const [monthOffset, setMonthOffset] = useState(0);
  const month = useMemo(
    () => DateTime.now().setZone(timeZone).startOf("month").plus({ months: monthOffset }),
    [monthOffset, timeZone],
  );
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone,
    year: "numeric",
  }), [timeZone]);
  const selectedDateFormatter = useMemo(() => new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone,
    weekday: "long",
  }), [timeZone]);
  const timeFormatter = useMemo(() => new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }), [timeZone]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [savedSessionIds, setSavedSessionIds] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const range = useMemo(() => getMonthRange(month), [month]);

  useEffect(() => {
    if (!autoFocus) return;

    const timeout = window.setTimeout(() => {
      pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 240);

    return () => window.clearTimeout(timeout);
  }, [autoFocus, classItem.title]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMonth() {
      setIsLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({ from: range.from, to: range.to });
        const publicResponse = await fetch(`/api/class-sessions?${query.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const publicPayload: unknown = await publicResponse.json();
        const publicSchedule = classSessionListSchema.safeParse(publicPayload);

        if (!publicResponse.ok || !publicSchedule.success) {
          throw new Error("Class times could not be loaded.");
        }

        const matchingSessions = publicSchedule.data.sessions.filter(
          (session) => session.title === classItem.title,
        );
        setSessions(matchingSessions);
        setSelectedDate((currentDate) => {
          const availableDates = new Set(matchingSessions.map((session) => getSessionDateKey(session, timeZone)));
          return currentDate && availableDates.has(currentDate)
            ? currentDate
            : matchingSessions[0]
              ? getSessionDateKey(matchingSessions[0], timeZone)
              : null;
        });

        if (isSignedIn) {
          const selections = await fetchSavedClassSessions(range.from, range.to, controller.signal);
          setSavedSessionIds(new Set(selections.map((selection) => selection.session.id)));
        } else {
          setSavedSessionIds(new Set());
        }
      } catch (caughtError) {
        if (controller.signal.aborted) return;
        setSessions([]);
        setSavedSessionIds(new Set());
        setSelectedDate(null);
        setError(caughtError instanceof Error ? caughtError.message : "Class times could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadMonth();
    return () => controller.abort();
  }, [classItem.title, isSignedIn, range.from, range.to, timeZone]);

  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, ClassSession[]>();

    for (const session of sessions) {
      const dateKey = getSessionDateKey(session, timeZone);
      grouped.set(dateKey, [...(grouped.get(dateKey) ?? []), session]);
    }

    return grouped;
  }, [sessions, timeZone]);
  const selectedSessions = selectedDate ? sessionsByDate.get(selectedDate) ?? [] : [];
  const calendarDays = getCalendarDays(month);

  async function toggleSavedSession(session: ClassSession) {
    if (!isSignedIn || pendingSessionId) return;

    const isSaved = savedSessionIds.has(session.id);
    setPendingSessionId(session.id);
    setError(null);

    try {
      if (isSaved) {
        await removeSavedClassSession(session.id);
        setSavedSessionIds((current) => {
          const next = new Set(current);
          next.delete(session.id);
          return next;
        });
      } else {
        await saveClassSession(session.id);
        setSavedSessionIds((current) => new Set(current).add(session.id));
      }

      window.dispatchEvent(new CustomEvent("personal-schedule-changed"));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Your schedule could not be updated.");
    } finally {
      setPendingSessionId(null);
    }
  }

  return (
    <div className="class-session-picker" ref={pickerRef}>
      <div className="class-session-picker-heading">
        <div>
          <span className="class-session-picker-icon"><CalendarCheck2 aria-hidden="true" /></span>
          <div>
            <h3>Choose a class time</h3>
            <p>Save individual sessions. Times are shown in {timeZoneName}.</p>
          </div>
        </div>
        <div className="mini-calendar-controls">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthOffset((current) => current - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <strong>{monthFormatter.format(month.toJSDate())}</strong>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonthOffset((current) => current + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mini-calendar" aria-label={`${classItem.title} class dates for ${monthFormatter.format(month.toJSDate())}`}>
        <div className="mini-calendar-weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map((weekday) => <span key={weekday}>{weekday}</span>)}
        </div>
        <div className="mini-calendar-grid">
          {calendarDays.map((day, index) => {
            if (!day) return <span className="mini-calendar-blank" key={`blank-${index}`} />;

            const dateKey = day.toISODate() ?? "";
            const daySessions = sessionsByDate.get(dateKey) ?? [];
            const hasSessions = daySessions.length > 0;
            const isSelected = selectedDate === dateKey;

            return (
              <button
                className="mini-calendar-day"
                data-available={hasSessions}
                data-selected={isSelected}
                disabled={!hasSessions}
                key={dateKey}
                type="button"
                aria-label={hasSessions ? `${day.toFormat("MMMM d")}, ${daySessions.length} class ${daySessions.length === 1 ? "time" : "times"}` : day.toFormat("MMMM d")}
                onClick={() => setSelectedDate(dateKey)}
              >
                <span>{day.day}</span>
                {hasSessions ? <i aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="class-session-times" aria-live="polite">
        {isLoading ? <p className="class-session-state">Loading class times...</p> : null}
        {!isLoading && sessions.length === 0 && !error ? (
          <p className="class-session-state">No {classItem.title} sessions are posted for this month.</p>
        ) : null}
        {!isLoading && selectedDate && selectedSessions.length > 0 ? (
          <>
            <strong className="class-session-date">
              {selectedDateFormatter.format(DateTime.fromISO(selectedDate, { zone: timeZone }).toJSDate())}
            </strong>
            <div className="class-session-time-list">
              {selectedSessions.map((session) => {
                const isSaved = savedSessionIds.has(session.id);
                const isPending = pendingSessionId === session.id;
                const action = (
                  <button
                    className="class-session-save"
                    data-saved={isSaved}
                    disabled={isPending || !isLoaded}
                    type="button"
                    onClick={() => void toggleSavedSession(session)}
                  >
                    {isSaved ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
                    {isPending ? "Updating..." : isSaved ? "Saved" : "Add class"}
                  </button>
                );

                return (
                  <div className="class-session-time" key={session.id}>
                    <div>
                      <span><Clock3 aria-hidden="true" />{timeFormatter.format(new Date(session.startsAt))}</span>
                      {session.locationName ? <span><MapPin aria-hidden="true" />{session.locationName}</span> : null}
                    </div>
                    {!isLoaded ? (
                      <button className="class-session-save" disabled type="button">
                        Checking account...
                      </button>
                    ) : isSignedIn ? action : (
                      <SignInButton mode="modal">
                        <button className="class-session-save" type="button">
                          <Plus aria-hidden="true" />
                          Sign in to save
                        </button>
                      </SignInButton>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
        {error ? <p className="class-session-error" role="alert">{error}</p> : null}
      </div>
    </div>
  );
}

function getMonthRange(month: DateTime) {
  return {
    from: month.startOf("month").toUTC().toISO(),
    to: month.plus({ months: 1 }).startOf("month").toUTC().toISO(),
  } as { from: string; to: string };
}

function getSessionDateKey(session: ClassSession, timeZone: string) {
  return DateTime.fromISO(session.startsAt).setZone(timeZone).toISODate() ?? "";
}

function getCalendarDays(month: DateTime) {
  const leadingBlankCount = month.startOf("month").weekday % 7;
  const dayCount = month.daysInMonth;

  if (!dayCount) return [];

  const cellCount = Math.ceil((leadingBlankCount + dayCount) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const dayNumber = index - leadingBlankCount + 1;
    return dayNumber >= 1 && dayNumber <= dayCount ? month.set({ day: dayNumber }) : null;
  });
}
