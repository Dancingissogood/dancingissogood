import "server-only";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { classSessionListSchema, classSessionMutationSchema } from "@/lib/schedule";

type ScheduleRequestOptions = {
  admin: boolean;
  body?: unknown;
  method: "DELETE" | "GET" | "PATCH" | "POST";
  path: string;
};

export async function forwardScheduleRequest(options: ScheduleRequestOptions) {
  const backendUrl = process.env["BACKEND_URL"];

  if (!backendUrl) {
    return NextResponse.json({ error: "Schedule access is not configured." }, { status: 503 });
  }

  const token = options.admin ? await getSessionToken() : null;

  if (options.admin && !token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const response = await fetch(`${backendUrl}${options.path}`, {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      headers: {
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
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
      ? classSessionListSchema.safeParse(payload)
      : classSessionMutationSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "The schedule service returned invalid data." }, { status: 502 });
    }

    return NextResponse.json(parsed.data, {
      headers: { "cache-control": "no-store" },
      status: response.status,
    });
  } catch {
    return NextResponse.json({ error: "The schedule service is unavailable." }, { status: 502 });
  }
}

async function getSessionToken() {
  const { getToken, userId } = await auth();
  return userId ? getToken() : null;
}

function normalizeError(payload: unknown) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
    ? { error: payload.error }
    : { error: "The schedule request could not be completed." };
}
