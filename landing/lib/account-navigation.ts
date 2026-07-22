import { z } from "zod";

export const accountNavigationSchema = z.object({
  hasUsablePass: z.boolean(),
});

export async function fetchAccountNavigationState(signal?: AbortSignal) {
  const response = await fetch("/api/account/navigation", {
    cache: "no-store",
    signal,
  });
  const payload: unknown = await response.json();
  const parsed = accountNavigationSchema.safeParse(payload);

  if (!response.ok || !parsed.success) {
    throw new Error("Account navigation state is unavailable.");
  }

  return parsed.data;
}
