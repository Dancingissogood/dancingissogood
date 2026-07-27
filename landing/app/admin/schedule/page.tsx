import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminScheduleEditor } from "@/components/AdminScheduleEditor";

export const metadata: Metadata = {
  title: "Schedule Administration",
  robots: { index: false, follow: false },
};

export default async function AdminSchedulePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/admin/schedule");

  return <AdminScheduleEditor />;
}
