"use client";

import { useState } from "react";

import { AnimatedArrowIcon } from "@/components/AnimatedArrowIcon";

type CheckoutButtonProps = {
  className?: string;
  passSlug: string;
};

export function CheckoutButton({ className = "button button-primary", passSlug }: CheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function startCheckout() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout-sessions", {
        body: JSON.stringify({ passSlug }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload: unknown = await response.json();

      if (
        !response.ok ||
        typeof payload !== "object" ||
        payload === null ||
        !("url" in payload) ||
        typeof payload.url !== "string"
      ) {
        throw new Error("Unable to start checkout.");
      }

      window.location.assign(payload.url);
    } catch {
      setError("Checkout could not be started. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="checkout-control">
      {error ? <p aria-live="polite" className="checkout-error">{error}</p> : null}
      <button className={className} disabled={isLoading} onClick={startCheckout} type="button">
        <span>{isLoading ? "Opening checkout..." : "Buy the 3-Day Pass"}</span>
        <AnimatedArrowIcon />
      </button>
    </div>
  );
}
