"use client";

import { useEffect } from "react";

const revealSelector = "[data-reveal]";

export function MotionProvider() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));

    if (targets.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      document.documentElement.classList.add("motion-reduced");
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.16,
      },
    );

    const visibleThreshold = window.innerHeight * 0.94;

    targets.forEach((target, index) => {
      if (!target.style.getPropertyValue("--reveal-delay")) {
        target.style.setProperty("--reveal-delay", `${Math.min(index * 35, 220)}ms`);
      }

      const rect = target.getBoundingClientRect();

      if (rect.top <= visibleThreshold && rect.bottom >= 0) {
        target.classList.add("is-visible");
        return;
      }

      observer.observe(target);
    });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
