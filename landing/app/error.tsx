"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="account-page">
      <section className="account-shell account-state" aria-labelledby="error-title">
        <p className="eyebrow">Something went wrong</p>
        <h1 id="error-title">We can&apos;t show this page right now.</h1>
        <p>Try again in a moment.</p>
        <button className="button button-primary" type="button" onClick={reset}>
          Try Again
        </button>
      </section>
    </main>
  );
}
