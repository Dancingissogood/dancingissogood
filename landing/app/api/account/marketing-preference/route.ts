import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const preferenceSchema = z.object({ subscribed: z.boolean() });

async function forward(method: "GET" | "PUT", body?: unknown) {
  const backendUrl = process.env["BACKEND_URL"];
  if (!backendUrl) {
    return NextResponse.json({ error: "Communication preferences are not configured." }, { status: 503 });
  }

  const { getToken, userId } = await auth();
  const token = userId ? await getToken() : null;
  if (!token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const response = await fetch(`${backendUrl}/v1/account/marketing-preference`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      method,
      signal: AbortSignal.timeout(10_000),
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        typeof payload === "object" && payload !== null && "error" in payload
          ? payload
          : { error: "Communication preferences could not be updated." },
        { status: response.status },
      );
    }

    const parsed = preferenceSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "The preference service returned invalid data." }, { status: 502 });
    }
    return NextResponse.json(parsed.data, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The preference service is unavailable." }, { status: 502 });
  }
}

export async function GET() {
  return forward("GET");
}

export async function PUT(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid communication preference." }, { status: 400 });
  }
  const parsed = preferenceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid communication preference." }, { status: 400 });
  }
  return forward("PUT", parsed.data);
}
