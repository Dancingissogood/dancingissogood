import Link from "next/link";
import { Suspense } from "react";

import { CheckoutStatus } from "@/components/CheckoutStatus";

export default function PurchaseSuccessPage() {
  return (
    <main className="checkout-result">
      <div>
        <p className="eyebrow">Camp pass</p>
        <h1>Thank you for joining the camp.</h1>
        <Suspense fallback={<p>Confirming your checkout.</p>}>
          <CheckoutStatus />
        </Suspense>
        <Link className="button button-primary" href="/#schedule">
          View the summer schedule
        </Link>
      </div>
    </main>
  );
}
