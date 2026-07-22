import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { accountNavigationSchema } from "@/lib/account-navigation";

export async function GET() {
  const { getToken, userId } = await auth();
  const token = userId ? await getToken() : null;

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const backendUrl = process.env["BACKEND_URL"];

  if (!backendUrl) {
    return NextResponse.json(
      { error: "Account navigation state is not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${backendUrl}/v1/account/navigation`, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    const payload: unknown = await response.json();
    const parsed = accountNavigationSchema.safeParse(payload);

    if (!response.ok || !parsed.success) {
      return NextResponse.json(
        { error: "Account navigation state is unavailable." },
        { status: response.ok ? 502 : response.status },
      );
    }

    return NextResponse.json(
      parsed.data,
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Account navigation state is unavailable." },
      { status: 502 },
    );
  }
}
