import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CheckoutStatus, CheckoutStatusLoading } from "@/components/CheckoutStatus";

export const metadata: Metadata = {
  title: "Purchase confirmation",
  robots: { index: false, follow: false },
};

export default function PurchaseSuccessPage() {
  return (
    <main className="checkout-result">
      <div>
        <Suspense fallback={<CheckoutStatusLoading />}>
          <CheckoutStatus />
        </Suspense>
        <Link className="button button-primary" href="/#schedule">
          View Schedule
        </Link>
      </div>
    </main>
  );
}
