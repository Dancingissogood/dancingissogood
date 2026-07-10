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

        setState(payload.paymentStatus === "paid" ? "complete" : "processing");
      } catch {
        setState("unavailable");
      }
    }

    void getCheckoutStatus();
  }, [sessionId]);

  if (!sessionId || state === "unavailable") {
    return <p>We could not confirm this checkout session. Contact us for help with your pass.</p>;
  }

  if (state === "loading") {
    return <p>Confirming your checkout.</p>;
  }

  if (state === "complete") {
    return <p>Your payment was received. Your 3-day pass is ready for camp scheduling.</p>;
  }

  if (state === "processing") {
    return <p>Your payment is still processing. We will confirm your pass once it clears.</p>;
  }

  return <p>We could not confirm this checkout session. Contact us for help with your pass.</p>;
}
