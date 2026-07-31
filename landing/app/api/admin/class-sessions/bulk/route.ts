import { NextResponse } from "next/server";

import { forwardScheduleRequest } from "@/lib/schedule-backend";

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid bulk class update." }, { status: 400 });
  }

  return forwardScheduleRequest({
    admin: true,
    body,
    method: "PATCH",
    path: "/v1/admin/class-sessions/bulk",
    responseType: "bulk-update",
  });
}
