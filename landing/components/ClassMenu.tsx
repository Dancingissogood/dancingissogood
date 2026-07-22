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
  const dialogLayoutRef = useRef<HTMLDivElement>(null);
  const originCardRef = useRef<HTMLElement | null>(null);
  const activeAnimationRef = useRef<Animation | null>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!selectedClass || !dialog || dialog.open) return;

    dialog.showModal();

    const layout = dialogLayoutRef.current;
    const origin = originCardRef.current;

    if (!layout || !origin || prefersReducedMotion()) return;

    const originRect = origin.getBoundingClientRect();
    const layoutRect = layout.getBoundingClientRect();
    const transform = getCardTransform(originRect, layoutRect);

    activeAnimationRef.current = layout.animate(
      [
        {
          opacity: 0.32,
          transform,
        },
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0) scale(1, 1)",
        },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );

    activeAnimationRef.current.addEventListener(
      "finish",
      () => {
        activeAnimationRef.current = null;
      },
      { once: true },
    );
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      activeAnimationRef.current?.cancel();
      activeAnimationRef.current = null;
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedClass]);

  const closeDialog = (afterClose?: () => void) => {
    const dialog = dialogRef.current;
    const layout = dialogLayoutRef.current;

    if (!dialog?.open) {
      setSelectedClass(null);
      afterClose?.();
      return;
    }

    if (isClosingRef.current) return;

    const finishClosing = () => {
      isClosingRef.current = false;
      activeAnimationRef.current = null;
      dialog.removeAttribute("data-closing");
      dialog.close();
      afterClose?.();
    };

    if (!layout || prefersReducedMotion()) {
      finishClosing();
      return;
    }

    isClosingRef.current = true;
    dialog.setAttribute("data-closing", "true");

    const origin = originCardRef.current;

    if (!origin) {
      finishClosing();
      return;
    }

    const layoutRect = layout.getBoundingClientRect();
    const originRect = origin.getBoundingClientRect();
    const targetTransform = getCardTransform(originRect, layoutRect);
    const currentStyle = window.getComputedStyle(layout);
    const currentOpacity = currentStyle.opacity;
    const currentTransform = currentStyle.transform;

    activeAnimationRef.current?.cancel();

    activeAnimationRef.current = layout.animate(
      [
        {
          opacity: currentOpacity,
          transform: currentTransform,
        },
        {
          opacity: 0.18,
          transform: targetTransform,
        },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    );

    activeAnimationRef.current.addEventListener("finish", finishClosing, { once: true });
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
              onClick={(event) => {
                originCardRef.current = event.currentTarget.closest<HTMLElement>(".menu-card");
                setSelectedClass(item);
              }}
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
          onCancel={(event) => {
            event.preventDefault();
            closeDialog();
          }}
          onClose={() => {
            isClosingRef.current = false;
            setSelectedClass(null);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div className="lesson-dialog-layout" ref={dialogLayoutRef}>
            <button
              className="lesson-dialog-close"
              type="button"
              aria-label="Close lesson details"
              onClick={() => closeDialog()}
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
                onClick={(event) => {
                  event.preventDefault();
                  closeDialog(() => {
                    window.location.hash = "schedule";
                  });
                }}
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

function getCardTransform(origin: DOMRect, target: DOMRect) {
  const translateX = origin.left + origin.width / 2 - (target.left + target.width / 2);
  const translateY = origin.top + origin.height / 2 - (target.top + target.height / 2);
  const scaleX = Math.max(origin.width / target.width, 0.08);
  const scaleY = Math.max(origin.height / target.height, 0.08);

  return `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
