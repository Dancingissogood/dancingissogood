import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="account-page">
      <section className="account-shell account-state" aria-labelledby="not-found-title">
        <p className="eyebrow">Page not found</p>
        <h1 id="not-found-title">We can&apos;t find that page.</h1>
        <Link className="button button-primary" href="/">
          Go Home
        </Link>
      </section>
    </main>
  );
}
