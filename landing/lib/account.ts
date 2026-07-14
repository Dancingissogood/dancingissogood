import { z } from "zod";

const accountSchema = z.object({
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  purchases: z.array(
    z.object({
      amountTotalCents: z.number().int().nonnegative(),
      createdAt: z.string().datetime(),
      currency: z.string().length(3),
      id: z.string().min(1),
      paidAt: z.string().datetime().nullable(),
      pass: z.object({
        accessDays: z.number().int().positive(),
        accessEnds: z.string().min(1),
        accessStarts: z.string().min(1),
        name: z.string().min(1),
      }),
      passStatus: z.enum(["ACTIVE", "USED", "EXPIRED", "CANCELED", "REFUNDED"]).nullable(),
      status: z.enum(["PENDING", "PAID", "CANCELED", "REFUNDED", "FAILED"]),
      validFrom: z.string().datetime().nullable(),
      validUntil: z.string().datetime().nullable(),
    }),
  ),
});

export type AccountSummary = z.infer<typeof accountSchema>;

export async function fetchAccountSummary(token: string): Promise<AccountSummary> {
  const backendUrl = process.env["BACKEND_URL"];

  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured.");
  }

  const response = await fetch(`${backendUrl}/v1/account`, {
    cache: "no-store",
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Account service returned ${response.status}.`);
  }

  return accountSchema.parse(await response.json());
}
