"use client";

import type {
  EventClickArg,
  EventDropArg,
  EventInput,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { CalendarPlus, UserRound, X } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { CalendarEventContent } from "@/components/CalendarEventContent";
import { classMenuItems } from "@/content/site";
import { classSessionListSchema, classSessionMutationSchema } from "@/lib/schedule";
import type { ClassSession } from "@/lib/schedule";

const TIME_ZONE = "America/Detroit";
const SESSION_MINUTES = 20;

type SessionDraft = {
  capacity: string;
  date: string;
  description: string;
  instructorName: string;
  locationName: string;
  published: boolean;
  time: string;
  title: string;
};

const emptyDraft = (): SessionDraft => {
  const start = DateTime.now().setZone(TIME_ZONE).plus({ days: 1 }).startOf("day").set({ hour: 9 });
  return {
    capacity: "",
    date: start.toFormat("yyyy-MM-dd"),
    description: "",
    instructorName: "",
    locationName: "",
    published: true,
    time: start.toFormat("HH:mm"),
    title: "",
  };
};

export function AdminScheduleEditor() {
  const calendarRef = useRef<FullCalendar>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<SessionDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sessionsRef = useRef(new Map<string, ClassSession>());

  const refetchEvents = () => calendarRef.current?.getApi().refetchEvents();

  const loadEvents = useCallback(
    async (
      range: EventSourceFuncArg,
      success: (events: EventInput[]) => void,
      failure: (error: Error) => void,
    ) => {
      try {
        setRequestError(null);
        const query = new URLSearchParams({ from: range.startStr, to: range.endStr });
        const response = await fetch(`/api/admin/class-sessions?${query.toString()}`, {
          cache: "no-store",
        });
        const payload: unknown = await response.json();

        if (response.status === 403) {
          setAccessDenied(true);
          throw new Error("Administrator access is required.");
        }

        const parsed = classSessionListSchema.safeParse(payload);

        if (!response.ok || !parsed.success) {
          throw new Error(getErrorMessage(payload, "The schedule could not be loaded."));
        }

        setAccessDenied(false);
        sessionsRef.current = new Map(parsed.data.sessions.map((session) => [session.id, session]));
        success(parsed.data.sessions.map(toCalendarEvent));
      } catch (caughtError) {
        const error = caughtError instanceof Error ? caughtError : new Error("The schedule could not be loaded.");
        setRequestError(error.message);
        failure(error);
      }
    },
    [],
  );

  function openNewSession(date?: Date) {
    const selected = date
      ? DateTime.fromJSDate(date).setZone(TIME_ZONE)
      : DateTime.now().setZone(TIME_ZONE).plus({ days: 1 }).startOf("day").set({ hour: 9 });
    setDraft({
      ...emptyDraft(),
      date: selected.toFormat("yyyy-MM-dd"),
      time: selected.toFormat("HH:mm"),
    });
    setEditingId(null);
    setConfirmDelete(false);
    setRequestError(null);
    dialogRef.current?.showModal();
  }

  function openExistingSession(event: EventClickArg) {
    const session = sessionsRef.current.get(event.event.id);

    if (!session) {
      return;
    }

    const startsAt = DateTime.fromISO(session.startsAt).setZone(TIME_ZONE);
    setDraft({
      capacity: session.capacity?.toString() ?? "",
      date: startsAt.toFormat("yyyy-MM-dd"),
      description: session.description ?? "",
      instructorName: session.instructorName ?? "",
      locationName: session.locationName ?? "",
      published: session.published,
      time: startsAt.toFormat("HH:mm"),
      title: session.title,
    });
    setEditingId(session.id);
    setConfirmDelete(false);
    setRequestError(null);
    dialogRef.current?.showModal();
  }

  function selectClass(title: string) {
    const selectedClass = classMenuItems.find((classItem) => classItem.title === title);

    if (!selectedClass) {
      return;
    }

    setDraft({
      ...draft,
      description: selectedClass.description,
      title: selectedClass.title,
    });
  }

  async function moveSession(change: EventDropArg) {
    if (!change.event.start || !change.event.end) {
      change.revert();
      return;
    }

    try {
      const response = await fetch(`/api/admin/class-sessions/${encodeURIComponent(change.event.id)}`, {
        body: JSON.stringify({
          endsAt: change.event.end.toISOString(),
          startsAt: change.event.start.toISOString(),
        }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const payload: unknown = await response.json();

      if (!response.ok || !classSessionMutationSchema.safeParse(payload).success) {
        throw new Error(getErrorMessage(payload, "The class could not be moved."));
      }

      refetchEvents();
    } catch (caughtError) {
      change.revert();
      setRequestError(caughtError instanceof Error ? caughtError.message : "The class could not be moved.");
    }
  }

  async function saveSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setRequestError(null);

    const startsAt = DateTime.fromISO(`${draft.date}T${draft.time}`, { zone: TIME_ZONE });

    if (!startsAt.isValid) {
      setRequestError("Enter a valid class date and time.");
      setIsSaving(false);
      return;
    }

    const body = {
      capacity: draft.capacity ? Number(draft.capacity) : null,
      description: draft.description.trim() || null,
      endsAt: startsAt.plus({ minutes: SESSION_MINUTES }).toUTC().toISO(),
      instructorName: draft.instructorName.trim() || null,
      locationName: draft.locationName.trim() || null,
      published: draft.published,
      startsAt: startsAt.toUTC().toISO(),
      title: draft.title.trim(),
    };
    const url = editingId
      ? `/api/admin/class-sessions/${encodeURIComponent(editingId)}`
      : "/api/admin/class-sessions";

    try {
      const response = await fetch(url, {
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
        method: editingId ? "PATCH" : "POST",
      });
      const payload: unknown = await response.json();

      if (!response.ok || !classSessionMutationSchema.safeParse(payload).success) {
        throw new Error(getErrorMessage(payload, "The class could not be saved."));
      }

      dialogRef.current?.close();
      refetchEvents();
    } catch (caughtError) {
      setRequestError(caughtError instanceof Error ? caughtError.message : "The class could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSession() {
    if (!editingId) {
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsSaving(true);
    setRequestError(null);

    try {
      const response = await fetch(`/api/admin/class-sessions/${encodeURIComponent(editingId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload: unknown = await response.json();
        throw new Error(getErrorMessage(payload, "The class could not be deleted."));
      }

      dialogRef.current?.close();
      refetchEvents();
    } catch (caughtError) {
      setRequestError(caughtError instanceof Error ? caughtError.message : "The class could not be deleted.");
    } finally {
      setIsSaving(false);
    }
  }

  if (accessDenied) {
    return (
      <main className="admin-page">
        <div className="admin-access-state">
          <p className="eyebrow">Restricted</p>
          <h1>Administrator access required.</h1>
          <p>This signed-in account does not have permission to manage the class schedule.</p>
          <Link className="button admin-button-primary" href="/account">Return to account</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-heading">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Class schedule</h1>
          </div>
          <div className="admin-heading-actions">
            <Link className="admin-icon-link" href="/account" title="Account">
              <UserRound aria-hidden="true" size={18} />
              <span>Account</span>
            </Link>
            <button className="button admin-button-primary" type="button" onClick={() => openNewSession()}>
              <CalendarPlus aria-hidden="true" size={18} />
              Add class
            </button>
          </div>
        </header>

        {requestError ? <p className="admin-alert" role="alert">{requestError}</p> : null}

        <section className="admin-calendar" aria-label="Class schedule editor">
          <FullCalendar
            allDaySlot={false}
            dateClick={(selection: DateClickArg) => openNewSession(selection.date)}
            dayHeaderFormat={{ weekday: "short", day: "numeric" }}
            editable
            eventClassNames={(eventInfo) => eventInfo.event.extendedProps["published"] ? [] : ["schedule-event-unpublished"]}
            eventClick={openExistingSession}
            eventContent={(eventInfo) => <CalendarEventContent eventInfo={eventInfo} />}
            eventDurationEditable={false}
            eventDrop={moveSession}
            eventMinHeight={58}
            eventStartEditable
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
            slotMaxTime="14:00:00"
            slotMinTime="09:00:00"
            timeZone={TIME_ZONE}
          />
        </section>
      </div>

      <dialog className="schedule-dialog" ref={dialogRef} onClose={() => setConfirmDelete(false)}>
        <form onSubmit={saveSession}>
          <div className="schedule-dialog-heading">
            <div>
              <p className="eyebrow">{editingId ? "Edit class" : "New class"}</p>
              <h2>{editingId ? "Update session" : "Add to schedule"}</h2>
            </div>
            <button className="icon-button" type="button" title="Close" onClick={() => dialogRef.current?.close()}>
              <X aria-hidden="true" size={20} />
            </button>
          </div>

          <label className="field field-wide">
            <span>Class name</span>
            <select required value={draft.title} onChange={(event) => selectClass(event.target.value)}>
              <option disabled value="">Select a class</option>
              {classMenuItems.map((classItem) => (
                <option key={classItem.title} value={classItem.title}>
                  {classItem.title}
                </option>
              ))}
            </select>
          </label>
          <div className="schedule-form-grid">
            <label className="field">
              <span>Date</span>
              <input required type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
            </label>
            <label className="field">
              <span>Start time</span>
              <input required type="time" step={1_200} value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} />
            </label>
            <label className="field">
              <span>Instructor</span>
              <input maxLength={120} value={draft.instructorName} onChange={(event) => setDraft({ ...draft, instructorName: event.target.value })} />
            </label>
            <label className="field">
              <span>Location</span>
              <input maxLength={160} value={draft.locationName} onChange={(event) => setDraft({ ...draft, locationName: event.target.value })} />
            </label>
            <label className="field">
              <span>Capacity</span>
              <input min={1} max={500} type="number" value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: event.target.value })} />
            </label>
            <label className="publish-control">
              <input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />
              <span>Published</span>
            </label>
          </div>
          <label className="field field-wide">
            <span>Description</span>
            <textarea maxLength={1_000} rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </label>

          {requestError ? <p className="dialog-error" role="alert">{requestError}</p> : null}

          <div className="schedule-dialog-actions">
            {editingId ? (
              <button className={confirmDelete ? "button danger-button danger-button-confirm" : "button danger-button"} disabled={isSaving} type="button" onClick={deleteSession}>
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            ) : <span />}
            <button className="button admin-button-primary" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save class"}
            </button>
          </div>
        </form>
      </dialog>
    </main>
  );
}

function toCalendarEvent(session: ClassSession): EventInput {
  return {
    end: session.endsAt,
    extendedProps: {
      instructorName: session.instructorName,
      locationName: session.locationName,
      published: session.published,
    },
    id: session.id,
    start: session.startsAt,
    title: session.title,
  };
}

function getErrorMessage(payload: unknown, defaultMessage: string) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : defaultMessage;
}
