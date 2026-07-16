import type { Metadata } from "next";

import { AdminScheduleEditor } from "@/components/AdminScheduleEditor";

export const metadata: Metadata = {
  title: "Schedule Administration",
  robots: { index: false, follow: false },
};

export default function AdminSchedulePage() {
  return <AdminScheduleEditor />;
}
