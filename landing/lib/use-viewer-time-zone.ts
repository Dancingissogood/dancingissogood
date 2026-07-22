"use client";

import { useSyncExternalStore } from "react";

import { STUDIO_TIME_ZONE } from "@/lib/time-zone";

const subscribe = () => () => {};
const getServerTimeZone = () => STUDIO_TIME_ZONE;
const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function useViewerTimeZone() {
  return useSyncExternalStore(subscribe, getBrowserTimeZone, getServerTimeZone);
}
