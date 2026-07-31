import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <SignUp forceRedirectUrl="/welcome" />
    </main>
  );
}
