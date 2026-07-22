import {
  savedClassSessionListSchema,
  savedClassSessionMutationSchema,
  type SavedClassSession,
} from "@/lib/saved-class-sessions";

export async function fetchSavedClassSessions(from: string, to: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ from, to });
  const response = await fetch(`/api/account/class-selections?${query.toString()}`, {
    cache: "no-store",
    signal,
  });
  const payload: unknown = await response.json();
  const parsed = savedClassSessionListSchema.safeParse(payload);

  if (!response.ok || !parsed.success) {
    throw new Error(readApiError(payload, "Your saved classes could not be loaded."));
  }

  return parsed.data.selections;
}

export async function saveClassSession(classSessionId: string): Promise<SavedClassSession> {
  const response = await fetch("/api/account/class-selections", {
    body: JSON.stringify({ classSessionId }),
    cache: "no-store",
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const payload: unknown = await response.json();
  const parsed = savedClassSessionMutationSchema.safeParse(payload);

  if (!response.ok || !parsed.success) {
    throw new Error(readApiError(payload, "This class could not be saved."));
  }

  return parsed.data.selection;
}

export async function removeSavedClassSession(classSessionId: string): Promise<void> {
  const response = await fetch(
    `/api/account/class-selections/${encodeURIComponent(classSessionId)}`,
    { cache: "no-store", method: "DELETE" },
  );

  if (!response.ok) {
    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(readApiError(payload, "This class could not be removed."));
  }
}

function readApiError(payload: unknown, defaultMessage: string) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : defaultMessage;
}
