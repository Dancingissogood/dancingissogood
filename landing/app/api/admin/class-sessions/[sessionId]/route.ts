import { NextResponse } from "next/server";

import { forwardScheduleRequest } from "@/lib/schedule-backend";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid class session update." }, { status: 400 });
  }

  return forwardScheduleRequest({
    admin: true,
    body,
    method: "PATCH",
    path: `/v1/admin/class-sessions/${encodeURIComponent(sessionId)}`,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  return forwardScheduleRequest({
    admin: true,
    method: "DELETE",
    path: `/v1/admin/class-sessions/${encodeURIComponent(sessionId)}`,
  });
}
