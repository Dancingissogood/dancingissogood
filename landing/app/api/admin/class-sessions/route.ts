import { NextResponse } from "next/server";

import { forwardScheduleRequest } from "@/lib/schedule-backend";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const from = requestUrl.searchParams.get("from");
  const to = requestUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "A schedule range is required." }, { status: 400 });
  }

  const query = new URLSearchParams({ from, to });
  return forwardScheduleRequest({
    admin: true,
    method: "GET",
    path: `/v1/admin/class-sessions?${query.toString()}`,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid class session." }, { status: 400 });
  }

  return forwardScheduleRequest({
    admin: true,
    body,
    method: "POST",
    path: "/v1/admin/class-sessions",
  });
}
