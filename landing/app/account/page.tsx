import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { fetchAccountSummary } from "@/lib/account";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  description: "View your Dancing Is So Good passes and account details.",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

export default async function AccountPage() {
  const { getToken, userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/account");
  }

  const token = await getToken();

  if (!token) {
    redirect("/sign-in?redirect_url=/account");
  }

  let account;

  try {
    account = await fetchAccountSummary(token);
  } catch {
    return (
      <main className="account-page">
        <section className="account-shell account-state" aria-labelledby="account-title">
          <p className="eyebrow">Your account</p>
          <h1 id="account-title">Account details are temporarily unavailable.</h1>
          <p>Please try again shortly.</p>
          <Link className="button button-primary" href="/account">
            Try Again
          </Link>
        </section>
      </main>
    );
  }

  const displayName = [account.firstName, account.lastName].filter(Boolean).join(" ");

  return (
    <main className="account-page">
      <div className="account-shell">
        <header className="account-heading">
          <div>
            <p className="eyebrow">Your account</p>
            <h1>{displayName || "Welcome back"}</h1>
            <p>{account.email}</p>
          </div>
          <div className="account-heading-actions">
            {account.role === "ADMIN" ? (
              <Link className="button button-secondary" href="/admin/schedule">
                Manage Schedule
              </Link>
            ) : null}
            <Link className="button button-secondary" href="/#pass">
              Purchase a Pass
            </Link>
          </div>
        </header>

        <section className="account-passes" aria-labelledby="passes-title">
          <div className="account-section-heading">
            <h2 id="passes-title">Passes</h2>
            <span>{account.purchases.length}</span>
          </div>

          {account.purchases.length === 0 ? (
            <div className="account-empty">
              <h3>No passes yet</h3>
              <p>Purchased passes will appear here.</p>
            </div>
          ) : (
            <div className="account-pass-list">
              {account.purchases.map((purchase) => (
                <article className="account-pass" key={purchase.id}>
                  <div>
                    <span className={`account-status account-status-${purchase.status.toLowerCase()}`}>
                      {purchase.passStatus ?? purchase.status}
                    </span>
                    <h3>{purchase.pass.name}</h3>
                    <p>
                      {purchase.pass.accessDays}-day access, {purchase.pass.accessStarts} to{" "}
                      {purchase.pass.accessEnds}
                    </p>
                  </div>
                  <dl>
                    <div>
                      <dt>Purchased</dt>
                      <dd>{dateFormatter.format(new Date(purchase.paidAt ?? purchase.createdAt))}</dd>
                    </div>
                    <div>
                      <dt>Amount</dt>
                      <dd>
                        {currencyFormatter.format(purchase.amountTotalCents / 100)} {purchase.currency.toUpperCase()}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
