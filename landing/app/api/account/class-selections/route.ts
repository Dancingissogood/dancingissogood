import { NextResponse } from "next/server";

import { forwardSavedSessionRequest } from "@/lib/saved-class-sessions-backend";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const from = requestUrl.searchParams.get("from");
  const to = requestUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "A personal schedule range is required." }, { status: 400 });
  }

  const query = new URLSearchParams({ from, to });
  return forwardSavedSessionRequest({
    method: "GET",
    path: `/v1/account/class-selections?${query.toString()}`,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid class selection." }, { status: 400 });
  }

  return forwardSavedSessionRequest({
    body,
    method: "POST",
    path: "/v1/account/class-selections",
  });
}
