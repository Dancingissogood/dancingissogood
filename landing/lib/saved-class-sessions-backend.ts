import "server-only";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  savedClassSessionListSchema,
  savedClassSessionMutationSchema,
} from "@/lib/saved-class-sessions";

type SavedSessionRequestOptions = {
  body?: unknown;
  method: "DELETE" | "GET" | "POST";
  path: string;
};

export async function forwardSavedSessionRequest(options: SavedSessionRequestOptions) {
  const backendUrl = process.env["BACKEND_URL"];

  if (!backendUrl) {
    return NextResponse.json({ error: "Personal schedule access is not configured." }, { status: 503 });
  }

  const { getToken, userId } = await auth();
  const token = userId ? await getToken() : null;

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const response = await fetch(`${backendUrl}${options.path}`, {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      },
      method: options.method,
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const payload: unknown = await response.json();

    if (!response.ok) {
      return NextResponse.json(normalizeError(payload), { status: response.status });
    }

    const parsed = options.method === "GET"
      ? savedClassSessionListSchema.safeParse(payload)
      : savedClassSessionMutationSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "The personal schedule service returned invalid data." },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed.data, {
      headers: { "cache-control": "no-store" },
      status: response.status,
    });
  } catch {
    return NextResponse.json({ error: "The personal schedule service is unavailable." }, { status: 502 });
  }
}

function normalizeError(payload: unknown) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
    ? { error: payload.error }
    : { error: "The personal schedule request could not be completed." };
}
