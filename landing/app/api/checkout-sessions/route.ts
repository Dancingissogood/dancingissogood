import { NextResponse } from "next/server";

const checkoutRequestSchema = {
  isValid(value: unknown): value is { passSlug: string } {
    return (
      typeof value === "object" &&
      value !== null &&
      "passSlug" in value &&
      typeof value.passSlug === "string" &&
      value.passSlug.length > 0 &&
      value.passSlug.length <= 100 &&
      Object.keys(value).length === 1
    );
  },
};

export async function POST(request: Request) {
  const backendUrl = process.env["BACKEND_URL"];

  if (!backendUrl) {
    return NextResponse.json({ error: "Checkout is not configured." }, { status: 503 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  if (!checkoutRequestSchema.isValid(body)) {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  try {
    const response = await fetch(`${backendUrl}/v1/checkout-sessions`, {
      body: JSON.stringify(body),
      cache: "no-store",
      headers: { "content-type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    });
    const payload: unknown = await response.json();

    if (
      !response.ok ||
      typeof payload !== "object" ||
      payload === null ||
      !("url" in payload) ||
      typeof payload.url !== "string" ||
      !payload.url.startsWith("https://checkout.stripe.com/")
    ) {
      return NextResponse.json(
        { error: "Unable to start checkout. Please try again." },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    return NextResponse.json({ url: payload.url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to start checkout. Please try again." }, { status: 502 });
  }
}
