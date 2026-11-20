"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type CheckoutState = "complete" | "loading" | "processing" | "unavailable";

const POLL_INTERVAL_MS = 3_000;
const MAX_STATUS_CHECKS = 10;

export function CheckoutStatus() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<CheckoutState>("loading");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const requestedSessionId = sessionId;
    let isActive = true;
    let retryTimeout: number | undefined;

    async function getCheckoutStatus(checkCount: number) {
      try {
        const response = await fetch(`/api/checkout-sessions/${encodeURIComponent(requestedSessionId)}`, {
          cache: "no-store",
        });
        const payload: unknown = await response.json();

        if (!isActive) {
          return;
        }

        if (
          !response.ok ||
          typeof payload !== "object" ||
          payload === null ||
          !("paymentStatus" in payload) ||
          typeof payload.paymentStatus !== "string"
        ) {
          setState("unavailable");
          return;
        }

        if (payload.paymentStatus === "paid") {
          setState("complete");
          window.dispatchEvent(new CustomEvent("pass-status-changed"));
          return;
        }

        if (checkCount < MAX_STATUS_CHECKS) {
          retryTimeout = window.setTimeout(() => {
            void getCheckoutStatus(checkCount + 1);
          }, POLL_INTERVAL_MS);
          return;
        }

        setState("processing");
      } catch {
        if (isActive) {
          setState("unavailable");
        }
      }
    }

    void getCheckoutStatus(1);

    return () => {
      isActive = false;
      window.clearTimeout(retryTimeout);
    };
  }, [sessionId]);

  if (state === "complete") {
    return (
      <>
        <p className="eyebrow">You&apos;re in</p>
        <h1>Welcome to the Movement Series.</h1>
        <p>Payment confirmed. Your pass is ready.</p>
      </>
    );
  }

  if (sessionId && state === "loading") {
    return <CheckoutStatusLoading />;
  }

  if (sessionId && state === "processing") {
    return (
      <>
        <p className="eyebrow">Purchase confirmation</p>
        <h1>Payment processing</h1>
        <p>Your payment is processing. Your pass will appear as soon as it clears.</p>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow">Purchase confirmation</p>
      <h1>Payment not confirmed</h1>
      <p>We couldn&apos;t confirm this payment. Contact us for help with your pass.</p>
    </>
  );
}

export function CheckoutStatusLoading() {
  return (
    <>
      <p className="eyebrow">Purchase confirmation</p>
      <h1>Confirming payment...</h1>
    </>
  );
}
