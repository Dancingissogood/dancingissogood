import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration",
};

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/admin");

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-heading">
          <div>
            <p className="eyebrow">Summer in the Mitten</p>
            <h1>Administration</h1>
            <p>Reservations, class rosters, and the current schedule.</p>
          </div>
          <div className="admin-heading-actions">
            <Link className="button button-secondary" href="/">View website</Link>
            <Link className="button admin-button-primary" href="/admin/schedule">Edit schedule</Link>
          </div>
        </header>
        <AdminDashboard />
      </div>
    </main>
  );
}
