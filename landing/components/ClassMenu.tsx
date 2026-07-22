"use client";

import {
  CalendarDays,
  Clock3,
  Layers3,
  Maximize2,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { ClassMenuItem } from "@/content/site";

type ClassMenuProps = {
  classes: ClassMenuItem[];
};

export function ClassMenu({ classes }: ClassMenuProps) {
  const [selectedClass, setSelectedClass] = useState<ClassMenuItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!selectedClass || !dialog || dialog.open) return;

    dialog.showModal();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedClass]);

  const closeDialog = () => {
    const dialog = dialogRef.current;

    if (dialog?.open) {
      dialog.close();
      return;
    }

    setSelectedClass(null);
  };

  return (
    <>
      <div className="menu-grid">
        {classes.map((item) => (
          <article className="menu-card" key={item.title}>
            <button
              className="menu-card-open"
              type="button"
              aria-haspopup="dialog"
              aria-label={`View details for ${item.title}`}
              onClick={() => setSelectedClass(item)}
            />
            <div className="menu-card-image">
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="(max-width: 580px) 117px, (max-width: 1100px) 50vw, 430px"
              />
            </div>
            <div className="menu-card-body">
              <span className="menu-time">{item.duration}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="menu-card-action" aria-hidden="true">
                View lesson
                <Maximize2 />
              </span>
            </div>
          </article>
        ))}
      </div>

      {selectedClass ? (
        <dialog
          className="lesson-dialog"
          ref={dialogRef}
          aria-labelledby="lesson-dialog-title"
          aria-describedby="lesson-dialog-description"
          onClose={() => setSelectedClass(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div className="lesson-dialog-layout">
            <button
              className="lesson-dialog-close"
              type="button"
              aria-label="Close lesson details"
              onClick={closeDialog}
            >
              <X aria-hidden="true" />
            </button>

            <div className="lesson-dialog-image">
              <Image
                src={selectedClass.image}
                alt={selectedClass.imageAlt}
                fill
                priority
                sizes="(max-width: 760px) calc(100vw - 32px), 460px"
              />
              <span>{selectedClass.category}</span>
            </div>

            <div className="lesson-dialog-content">
              <p className="eyebrow">Class menu</p>
              <h2 id="lesson-dialog-title">{selectedClass.title}</h2>
              <p id="lesson-dialog-description" className="lesson-dialog-description">
                {selectedClass.details}
              </p>

              <div className="lesson-dialog-facts" aria-label="Lesson details">
                <div>
                  <Clock3 aria-hidden="true" />
                  <span>Duration</span>
                  <strong>{selectedClass.duration}</strong>
                </div>
                <div>
                  <Layers3 aria-hidden="true" />
                  <span>Experience</span>
                  <strong>{selectedClass.level}</strong>
                </div>
              </div>

              <div className="lesson-dialog-highlights">
                <div className="lesson-dialog-subheading">
                  <Sparkles aria-hidden="true" />
                  <h3>What you&apos;ll explore</h3>
                </div>
                <ul>
                  {selectedClass.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>

              <Link
                className="button button-primary lesson-dialog-cta"
                href="#schedule"
                onClick={closeDialog}
              >
                <CalendarDays aria-hidden="true" />
                View the schedule
              </Link>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
