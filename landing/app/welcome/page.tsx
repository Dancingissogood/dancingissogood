import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MarketingPreference } from "@/components/MarketingPreference";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function WelcomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/welcome");

  return (
    <main className="welcome-page">
      <div className="welcome-shell">
        <p className="eyebrow">Welcome to the Movement Series</p>
        <h1>Your account is ready.</h1>
        <p className="welcome-intro">
          Your passes and class reservations will live in one place, ready whenever
          you return.
        </p>
        <MarketingPreference onboarding />
        <Link className="button button-primary" href="/account">Continue to my account</Link>
      </div>
    </main>
  );
}
