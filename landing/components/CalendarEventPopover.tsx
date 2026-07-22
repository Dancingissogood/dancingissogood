"use client";

import { SignInButton } from "@clerk/nextjs";
import { Check, Plus } from "lucide-react";
import Image from "next/image";

import type { ClassMenuItem } from "@/content/site";

export type CalendarEventDetails = {
  classSessionId: string;
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
  error: string | null;
  isAuthLoaded: boolean;
  isPending: boolean;
  isSaved: boolean;
  isSavedStateReady: boolean;
  isSignedIn: boolean;
  onDismiss: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onToggleSaved: () => void;
};

export function CalendarEventPopover({
  details,
  error,
  isAuthLoaded,
  isPending,
  isSaved,
  isSavedStateReady,
  isSignedIn,
  onDismiss,
  onMouseEnter,
  onMouseLeave,
  onToggleSaved,
}: CalendarEventPopoverProps) {
  const saveButton = (
    <button
      className="calendar-event-popover-action"
      data-saved={isSaved}
      disabled={isPending || !isAuthLoaded}
      type="button"
      onClick={onToggleSaved}
    >
      {isSaved ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {isPending ? "Updating..." : isSaved ? "Saved to my schedule" : "Add to my schedule"}
    </button>
  );

  return (
    <aside
      aria-label={`${details.title} class details`}
      className="calendar-event-popover"
      role="dialog"
      style={{ left: details.left, top: details.top }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onMouseLeave();
      }}
      onFocusCapture={onMouseEnter}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onDismiss();
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
        <div className="calendar-event-popover-actions">
          {!isAuthLoaded ? (
            <button className="calendar-event-popover-action" disabled type="button">
              Checking account...
            </button>
          ) : isSignedIn && !isSavedStateReady ? (
            <button className="calendar-event-popover-action" disabled type="button">
              {error ? "Schedule unavailable" : "Checking schedule..."}
            </button>
          ) : isSignedIn ? saveButton : (
            <SignInButton mode="modal">
              <button className="calendar-event-popover-action" type="button">
                <Plus aria-hidden="true" />
                Sign in to add class
              </button>
            </SignInButton>
          )}
          {error ? <p className="calendar-event-popover-error" role="alert">{error}</p> : null}
        </div>
      </div>
    </aside>
  );
}
