import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const backendUrl = process.env["BACKEND_URL"];
  const { sessionId } = await params;

  if (!backendUrl) {
    return NextResponse.json({ error: "Checkout is not configured." }, { status: 503 });
  }

  if (!/^cs_(?:test|live)_/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid Checkout session." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${backendUrl}/v1/checkout-sessions/${encodeURIComponent(sessionId)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    const payload: unknown = await response.json();

    if (
      !response.ok ||
      typeof payload !== "object" ||
      payload === null ||
      !("paymentStatus" in payload) ||
      !("status" in payload) ||
      typeof payload.paymentStatus !== "string" ||
      typeof payload.status !== "string"
    ) {
      return NextResponse.json({ error: "Checkout session not found." }, { status: 404 });
    }

    return NextResponse.json({
      paymentStatus: payload.paymentStatus,
      status: payload.status,
    });
  } catch {
    return NextResponse.json({ error: "Checkout session not found." }, { status: 404 });
  }
}
