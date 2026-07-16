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
    admin: false,
    method: "GET",
    path: `/v1/class-sessions?${query.toString()}`,
  });
}
