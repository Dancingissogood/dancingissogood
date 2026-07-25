"use client";

import {
  CalendarDays,
  Clock3,
  Layers3,
  Maximize2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import type { ClassMenuItem } from "@/content/site";
import { ClassSessionPicker } from "@/components/ClassSessionPicker";

type ClassMenuProps = {
  classes: ClassMenuItem[];
};

export function ClassMenu({ classes }: ClassMenuProps) {
  const [selectedClass, setSelectedClass] = useState<ClassMenuItem | null>(null);
  const [openToSchedule, setOpenToSchedule] = useState(false);
  const [isSharedTransitioning, setIsSharedTransitioning] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogLayoutRef = useRef<HTMLDivElement>(null);
  const originCardRef = useRef<HTMLElement | null>(null);
  const activeAnimationRef = useRef<Animation | null>(null);
  const sharedTransitionRef = useRef<ViewTransition | null>(null);
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
    const morph = getCardMorph(originRect, layoutRect);

    activeAnimationRef.current = layout.animate(
      [
        {
          borderRadius: morph.borderRadius,
          transform: morph.transform,
        },
        {
          borderRadius: "18px",
          transform: "translate3d(0, 0, 0) scale(1, 1)",
        },
      ],
      {
        duration: 420,
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

  const openClass = (
    item: ClassMenuItem,
    trigger: HTMLElement,
    shouldOpenToSchedule: boolean,
  ) => {
    const origin = trigger.closest<HTMLElement>(".menu-card");
    originCardRef.current = origin;

    if (!origin || !supportsSharedViewTransitions()) {
      setOriginCardExpanded(origin, true);
      setOpenToSchedule(shouldOpenToSchedule);
      setSelectedClass(item);
      return;
    }

    setCardViewTransitionNames(origin, true);
    sharedTransitionRef.current?.skipTransition();

    const transition = document.startViewTransition(() => {
      setCardViewTransitionNames(origin, false);
      setOriginCardExpanded(origin, true);

      flushSync(() => {
        setIsSharedTransitioning(true);
        setOpenToSchedule(shouldOpenToSchedule);
        setSelectedClass(item);
      });

      const dialog = dialogRef.current;
      dialog?.setAttribute("data-shared-transition", "opening");

      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    });
    sharedTransitionRef.current = transition;

    const finishOpening = () => {
      if (sharedTransitionRef.current !== transition) return;

      sharedTransitionRef.current = null;
      dialogRef.current?.setAttribute("data-shared-transition", "open");
      setIsSharedTransitioning(false);
    };

    void transition.finished.then(finishOpening, finishOpening);
  };

  const closeDialog = (afterClose?: () => void) => {
    const dialog = dialogRef.current;
    const layout = dialogLayoutRef.current;

    if (!dialog?.open) {
      setOriginCardExpanded(originCardRef.current, false);
      setSelectedClass(null);
      afterClose?.();
      return;
    }

    if (isClosingRef.current) return;

    const origin = originCardRef.current;

    if (origin && supportsSharedViewTransitions()) {
      isClosingRef.current = true;
      dialog.setAttribute("data-shared-transition", "closing");
      sharedTransitionRef.current?.skipTransition();

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          dialog.close();
          setIsSharedTransitioning(false);
          setOpenToSchedule(false);
          setSelectedClass(null);
        });

        setOriginCardExpanded(origin, false);
        setCardViewTransitionNames(origin, true);
      });
      sharedTransitionRef.current = transition;

      const clearDestinationNames = () => {
        setCardViewTransitionNames(origin, false);
      };
      const finishSharedClose = () => {
        if (sharedTransitionRef.current !== transition) return;

        sharedTransitionRef.current = null;
        clearDestinationNames();
        isClosingRef.current = false;
        afterClose?.();
      };

      void transition.ready.then(clearDestinationNames, clearDestinationNames);
      void transition.finished.then(finishSharedClose, finishSharedClose);
      return;
    }

    const finishClosing = () => {
      isClosingRef.current = false;
      activeAnimationRef.current = null;
      dialog.removeAttribute("data-closing");
      dialog.close();
      setOriginCardExpanded(origin, false);
      setOpenToSchedule(false);
      afterClose?.();
    };

    if (!layout || prefersReducedMotion()) {
      finishClosing();
      return;
    }

    isClosingRef.current = true;
    dialog.setAttribute("data-closing", "true");

    if (!origin) {
      finishClosing();
      return;
    }

    const layoutRect = layout.getBoundingClientRect();
    const originRect = origin.getBoundingClientRect();
    const targetMorph = getCardMorph(originRect, layoutRect);
    const currentStyle = window.getComputedStyle(layout);
    const currentBorderRadius = currentStyle.borderRadius;
    const currentTransform = currentStyle.transform;

    activeAnimationRef.current?.cancel();

    activeAnimationRef.current = layout.animate(
      [
        {
          borderRadius: currentBorderRadius,
          transform: currentTransform,
        },
        {
          borderRadius: targetMorph.borderRadius,
          transform: targetMorph.transform,
        },
      ],
      {
        duration: 320,
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
                openClass(item, event.currentTarget, false);
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
              <div className="menu-card-title-row">
                <h3>{item.title}</h3>
                <button
                  className="menu-card-expand"
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`View details for ${item.title}`}
                  title="View class details"
                  onClick={(event) => {
                    openClass(item, event.currentTarget, false);
                  }}
                >
                  <Maximize2 aria-hidden="true" />
                </button>
              </div>
              <div className="menu-card-subtext-row">
                <p>{item.description}</p>
                <button
                  className="menu-card-save"
                  type="button"
                  aria-label={`Add a ${item.title} session to your schedule`}
                  onClick={(event) => {
                    openClass(item, event.currentTarget, true);
                  }}
                >
                  <Plus aria-hidden="true" />
                  Add class
                </button>
              </div>
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
            setOriginCardExpanded(originCardRef.current, false);
            setSelectedClass(null);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div className="lesson-dialog-shade" aria-hidden="true" />
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
              <p className="eyebrow">{selectedClass.category}</p>
              <h2 id="lesson-dialog-title">{selectedClass.title}</h2>
              <p className="lesson-dialog-description">{selectedClass.description}</p>
              <div className="lesson-dialog-details">
                <p id="lesson-dialog-description" className="lesson-dialog-details-copy">
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
                    <span>Level</span>
                    <strong>{selectedClass.level}</strong>
                  </div>
                </div>

                <div className="lesson-dialog-highlights">
                  <div className="lesson-dialog-subheading">
                    <Sparkles aria-hidden="true" />
                    <h3>Inside the class</h3>
                  </div>
                  <ul>
                    {selectedClass.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </div>

                <ClassSessionPicker
                  autoFocus={openToSchedule && !isSharedTransitioning}
                  classItem={selectedClass}
                />

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
                  Full Schedule
                </Link>
              </div>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}

function getCardMorph(origin: DOMRect, target: DOMRect) {
  const translateX = origin.left + origin.width / 2 - (target.left + target.width / 2);
  const translateY = origin.top + origin.height / 2 - (target.top + target.height / 2);
  const scaleX = Math.max(origin.width / target.width, 0.08);
  const scaleY = Math.max(origin.height / target.height, 0.08);

  return {
    borderRadius: `${18 / scaleX}px / ${18 / scaleY}px`,
    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`,
  };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsSharedViewTransitions() {
  return typeof document.startViewTransition === "function" && !prefersReducedMotion();
}

function setCardViewTransitionNames(card: HTMLElement, enabled: boolean) {
  const transitionParts = [
    [card, "lesson-card-shell"],
    [card.querySelector<HTMLElement>(".menu-card-image"), "lesson-card-image"],
    [card.querySelector<HTMLElement>(".menu-card-body"), "lesson-card-content"],
    [card.querySelector<HTMLElement>(".menu-card-title-row h3"), "lesson-card-title"],
    [card.querySelector<HTMLElement>(".menu-card-subtext-row p"), "lesson-card-description"],
  ] as const;

  transitionParts.forEach(([element, name]) => {
    if (element) {
      element.style.viewTransitionName = enabled ? name : "";
    }
  });
}

function setOriginCardExpanded(card: HTMLElement | null, expanded: boolean) {
  if (expanded) {
    card?.setAttribute("data-expanded", "true");
  } else {
    card?.removeAttribute("data-expanded");
  }
}
