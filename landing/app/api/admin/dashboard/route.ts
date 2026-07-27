import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

async function forward(path: string, method: "GET" | "POST") {
  const backendUrl = process.env["BACKEND_URL"];
  if (!backendUrl) return NextResponse.json({ error: "The dashboard is not configured." }, { status: 503 });

  const { getToken, userId } = await auth();
  const token = userId ? await getToken() : null;
  if (!token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
      method,
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 204) return new NextResponse(null, { status: 204 });
    const payload: unknown = await response.json();
    return NextResponse.json(payload, {
      headers: { "cache-control": "no-store" },
      status: response.status,
    });
  } catch {
    return NextResponse.json({ error: "The dashboard service is unavailable." }, { status: 502 });
  }
}

export async function GET() {
  return forward("/v1/admin/dashboard", "GET");
}

export async function POST() {
  return forward("/v1/admin/dashboard/reservations-seen", "POST");
}
