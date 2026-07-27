"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type CheckoutState = "complete" | "loading" | "processing" | "unavailable";

export function CheckoutStatus() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<CheckoutState>("loading");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const requestedSessionId = sessionId;

    async function getCheckoutStatus() {
      try {
        const response = await fetch(`/api/checkout-sessions/${encodeURIComponent(requestedSessionId)}`, {
          cache: "no-store",
        });
        const payload: unknown = await response.json();

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

        const nextState = payload.paymentStatus === "paid" ? "complete" : "processing";
        setState(nextState);

        if (nextState === "complete") {
          window.dispatchEvent(new CustomEvent("pass-status-changed"));
        }
      } catch {
        setState("unavailable");
      }
    }

    void getCheckoutStatus();
  }, [sessionId]);

  if (!sessionId || state === "unavailable") {
    return <p>We couldn&apos;t confirm this payment. Contact us for help with your pass.</p>;
  }

  if (state === "loading") {
    return <p>Confirming payment...</p>;
  }

  if (state === "complete") {
    return <p>Payment confirmed. Your pass is ready.</p>;
  }

  if (state === "processing") {
    return <p>Your payment is processing. Your pass will appear as soon as it clears.</p>;
  }

  return <p>We couldn&apos;t confirm this payment. Contact us for help with your pass.</p>;
}
