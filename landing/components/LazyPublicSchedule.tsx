"use client";

import dynamic from "next/dynamic";

// FullCalendar is large and the schedule sits below the fold, so load it after the page.
export const LazyPublicSchedule = dynamic(
  () => import("@/components/PublicSchedule").then((scheduleModule) => scheduleModule.PublicSchedule),
  {
    loading: () => <div aria-busy="true" className="public-calendar-shell public-calendar-placeholder" />,
    ssr: false,
  },
);
