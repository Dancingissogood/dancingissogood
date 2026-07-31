"use client";

import { CalendarDays, Mail, RefreshCw, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Person = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type Registration = {
  createdAt: string;
  id: string;
  status: "RESERVED" | "ATTENDED" | "CANCELED" | "NO_SHOW";
  user: Person;
};

type DashboardSession = {
  bookingStatus: "OPEN" | "CLOSED";
  capacity: number | null;
  classKey: string;
  deliveryMode: "IN_PERSON" | "ONLINE";
  endsAt: string;
  id: string;
  instructorName: string | null;
  locationName: string | null;
  published: boolean;
  registrations: Registration[];
  startsAt: string;
  title: string;
};

type DashboardData = {
  metrics: {
    activeReservations: number;
    newReservations: number;
    publishedSessions: number;
    subscribers: number;
  };
  recentRegistrations: Array<Registration & {
    classSession: { id: string; startsAt: string; title: string };
  }>;
  sessions: DashboardSession[];
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Detroit",
});

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionFilter, setSessionFilter] = useState("");

  async function loadDashboard() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const payload = await response.json() as DashboardData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The dashboard could not be loaded.");
      setData(payload);
      if (payload.metrics.newReservations > 0) {
        void fetch("/api/admin/dashboard", { method: "POST" });
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The dashboard could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as DashboardData & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "The dashboard could not be loaded.");
        if (!active) return;
        setData(payload);
        if (payload.metrics.newReservations > 0) {
          void fetch("/api/admin/dashboard", { method: "POST" });
        }
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "The dashboard could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredSessions = useMemo(() => {
    if (!data) return [];
    const query = sessionFilter.trim().toLowerCase();
    if (!query) return data.sessions;
    return data.sessions.filter((session) =>
      [session.title, session.instructorName, session.locationName]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [data, sessionFilter]);

  if (isLoading) {
    return <div className="admin-dashboard-state" aria-busy="true">Loading dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="admin-dashboard-state">
        <p role="alert">{error ?? "The dashboard could not be loaded."}</p>
        <button className="button admin-button-primary" type="button" onClick={() => void loadDashboard()}>
          <RefreshCw aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="admin-metrics" aria-label="Movement Series overview">
        <article><CalendarDays aria-hidden="true" /><span>Upcoming classes</span><strong>{data.metrics.publishedSessions}</strong></article>
        <article><UsersRound aria-hidden="true" /><span>Active reservations</span><strong>{data.metrics.activeReservations}</strong></article>
        <article><Sparkles aria-hidden="true" /><span>New reservations</span><strong>{data.metrics.newReservations}</strong></article>
        <article><Mail aria-hidden="true" /><span>Email subscribers</span><strong>{data.metrics.subscribers}</strong></article>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-dashboard-panel admin-roster-panel">
          <div className="admin-panel-heading">
            <div><p className="eyebrow">Class rosters</p><h2>Upcoming sessions</h2></div>
            <input
              aria-label="Filter sessions"
              placeholder="Find a class"
              type="search"
              value={sessionFilter}
              onChange={(event) => setSessionFilter(event.target.value)}
            />
          </div>
          <div className="admin-roster-list">
            {filteredSessions.map((session) => {
              const reservations = session.registrations.filter((item) => item.status === "RESERVED");
              return (
                <details className="admin-roster-session" key={session.id}>
                  <summary>
                    <div>
                      <strong>{session.title}</strong>
                      <span>{dateTimeFormatter.format(new Date(session.startsAt))} ET</span>
                      <span className="admin-roster-status">
                        {session.bookingStatus === "CLOSED"
                          ? "No vacancy"
                          : session.deliveryMode === "ONLINE"
                            ? "Online class"
                            : "Available"}
                      </span>
                    </div>
                    <b>{reservations.length}{session.capacity ? ` / ${session.capacity}` : ""}</b>
                  </summary>
                  {reservations.length > 0 ? (
                    <ul>
                      {reservations.map((reservation) => (
                        <li key={reservation.id}>
                          <span>{displayName(reservation.user)}</span>
                          <a href={`mailto:${reservation.user.email}`}>{reservation.user.email}</a>
                        </li>
                      ))}
                    </ul>
                  ) : <p>No reservations yet.</p>}
                </details>
              );
            })}
          </div>
        </section>

        <aside className="admin-dashboard-panel admin-activity-panel">
          <div className="admin-panel-heading">
            <div><p className="eyebrow">Activity</p><h2>Recent reservations</h2></div>
          </div>
          <ol>
            {data.recentRegistrations.map((registration) => (
              <li key={registration.id}>
                <span>{displayName(registration.user)}</span>
                <strong>{registration.status === "CANCELED" ? "Canceled" : "Reserved"} {registration.classSession.title}</strong>
                <time dateTime={registration.createdAt}>{dateTimeFormatter.format(new Date(registration.createdAt))} ET</time>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <section className="admin-schedule-callout">
        <div><p className="eyebrow">Schedule</p><h2>Build the next camp week.</h2></div>
        <Link className="button admin-button-primary" href="/admin/schedule">Manage schedule</Link>
      </section>
    </>
  );
}

function displayName(person: Person) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email;
}
