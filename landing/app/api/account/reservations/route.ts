import { NextResponse } from "next/server";

import { forwardRegistrationRequest } from "@/lib/registrations-backend";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const from = requestUrl.searchParams.get("from");
  const to = requestUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "A reservation range is required." }, { status: 400 });
  }

  const query = new URLSearchParams({ from, to });
  return forwardRegistrationRequest({
    method: "GET",
    path: `/v1/account/reservations?${query.toString()}`,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid class reservation." }, { status: 400 });
  }

  return forwardRegistrationRequest({
    body,
    method: "POST",
    path: "/v1/account/reservations",
  });
}
