import {
  registrationListSchema,
  registrationMutationSchema,
  type ClassRegistration,
} from "@/lib/registrations";

export async function fetchRegistrations(from: string, to: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ from, to });
  const response = await fetch(`/api/account/reservations?${query.toString()}`, {
    cache: "no-store",
    signal,
  });
  const payload: unknown = await response.json();
  const parsed = registrationListSchema.safeParse(payload);

  if (!response.ok || !parsed.success) {
    throw new Error(readApiError(payload, "Your reservations could not be loaded."));
  }

  return parsed.data.registrations;
}

export async function reserveClassSession(classSessionId: string): Promise<ClassRegistration> {
  const response = await fetch("/api/account/reservations", {
    body: JSON.stringify({ classSessionId }),
    cache: "no-store",
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const payload: unknown = await response.json();
  const parsed = registrationMutationSchema.safeParse(payload);

  if (!response.ok || !parsed.success) {
    throw new Error(readApiError(payload, "This class could not be reserved."));
  }

  return parsed.data.registration;
}

export async function cancelClassReservation(classSessionId: string): Promise<void> {
  const response = await fetch(
    `/api/account/reservations/${encodeURIComponent(classSessionId)}`,
    { cache: "no-store", method: "DELETE" },
  );

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new Error(readApiError(payload, "This reservation could not be canceled."));
  }
}

function readApiError(payload: unknown, defaultMessage: string) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : defaultMessage;
}
