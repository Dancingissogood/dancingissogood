import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { navigationItems } from "@/content/site";

type SiteHeaderProps = {
  ctaHref?: string;
};

export function SiteHeader({ ctaHref = "/#contact" }: SiteHeaderProps) {
  return (
    <header className="site-header" aria-label="Primary navigation">
      <Link className="brand" href="/" aria-label="Dancing Is So Good home">
        <span className="brand-mark">DG</span>
        <span>Dancing Is So Good</span>
      </Link>
      <nav className="nav-links" aria-label="Main menu">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="auth-link" type="button">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="account-cta" type="button">
              Create Account
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
        <Link className="header-cta" href={ctaHref}>
          Request the Schedule
        </Link>
      </div>
    </header>
  );
}
