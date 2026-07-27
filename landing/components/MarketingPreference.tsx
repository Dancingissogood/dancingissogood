"use client";

import { useEffect, useState } from "react";

type MarketingPreferenceProps = {
  onboarding?: boolean;
};

export function MarketingPreference({ onboarding = false }: MarketingPreferenceProps) {
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/account/marketing-preference", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { subscribed?: boolean };
        if (!response.ok || typeof payload.subscribed !== "boolean") throw new Error();
        if (active) setSubscribed(payload.subscribed);
      })
      .catch(() => {
        if (active) setMessage("Your communication preference could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function updatePreference(nextValue: boolean) {
    const previousValue = subscribed;
    setSubscribed(nextValue);
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/account/marketing-preference", {
        body: JSON.stringify({ subscribed: nextValue }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      });
      if (!response.ok) throw new Error();
      setMessage(nextValue ? "You’ll receive Movement Series news." : "You’ve been unsubscribed.");
    } catch {
      setSubscribed(previousValue);
      setMessage("Your preference could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={onboarding ? "marketing-preference marketing-preference-onboarding" : "marketing-preference"}>
      <div>
        <h2>{onboarding ? "Stay close to the movement" : "Email preferences"}</h2>
        <p>
          Receive occasional news about upcoming Movement Series dates, class menus,
          and pass releases. You can unsubscribe at any time.
        </p>
      </div>
      <label className="marketing-preference-control">
        <input
          checked={subscribed}
          disabled={isLoading || isSaving}
          type="checkbox"
          onChange={(event) => void updatePreference(event.target.checked)}
        />
        <span aria-hidden="true" />
        <strong>{subscribed ? "Subscribed" : "Not subscribed"}</strong>
      </label>
      {message ? <p className="marketing-preference-message" role="status">{message}</p> : null}
    </section>
  );
}
