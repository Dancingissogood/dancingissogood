"use client";

import { getTimeZoneDisplayName } from "@/lib/time-zone";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";

type ViewerTimeZoneLabelProps = {
  prefix?: string;
};

export function ViewerTimeZoneLabel({ prefix }: ViewerTimeZoneLabelProps) {
  const timeZone = useViewerTimeZone();
  const displayName = getTimeZoneDisplayName(timeZone);

  return <>{prefix ? `${prefix} ${displayName}` : displayName}</>;
}
