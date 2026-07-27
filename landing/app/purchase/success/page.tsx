import Link from "next/link";
import { Suspense } from "react";

import { CheckoutStatus } from "@/components/CheckoutStatus";

export default function PurchaseSuccessPage() {
  return (
    <main className="checkout-result">
      <div>
        <p className="eyebrow">You&apos;re in</p>
        <h1>Welcome to the Movement Series.</h1>
        <Suspense fallback={<p>Confirming payment...</p>}>
          <CheckoutStatus />
        </Suspense>
        <Link className="button button-primary" href="/#schedule">
          View Schedule
        </Link>
      </div>
    </main>
  );
}
