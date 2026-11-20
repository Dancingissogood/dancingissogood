import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AdminScheduleEditor } from "@/components/AdminScheduleEditor";
import { fetchAccountSummary } from "@/lib/account";

export const metadata: Metadata = {
  title: "Schedule Administration",
  robots: { index: false, follow: false },
};

export default async function AdminSchedulePage() {
  const { getToken, userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/admin/schedule");

  const token = await getToken();
  if (!token) redirect("/sign-in?redirect_url=/admin/schedule");

  const account = await fetchAccountSummary(token);
  if (account.role !== "ADMIN") notFound();

  return <AdminScheduleEditor />;
}
