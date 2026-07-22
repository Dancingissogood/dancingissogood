"use client";

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AccountMenu } from "@/components/AccountMenu";
import { navigationItems } from "@/content/site";
import { fetchAccountNavigationState } from "@/lib/account-navigation";

type SiteHeaderProps = {
  ctaHref?: string;
};

type AccountActionState = "loading" | "has-pass" | "no-pass" | "unavailable";

export function SiteHeader({ ctaHref = "/#pass" }: SiteHeaderProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const navigationRequestRef = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountAction, setAccountAction] = useState<AccountActionState>("loading");

  useEffect(() => {
    let animationFrame = 0;

    const updateHeader = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        setIsScrolled(window.scrollY > 12);
      });
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeader);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    let active = true;

    async function loadAccountAction() {
      const requestId = ++navigationRequestRef.current;
      setAccountAction("loading");

      try {
        const account = await fetchAccountNavigationState();

        if (active && requestId === navigationRequestRef.current) {
          setAccountAction(account.hasUsablePass ? "has-pass" : "no-pass");
        }
      } catch {
        if (active && requestId === navigationRequestRef.current) {
          setAccountAction("unavailable");
        }
      }
    }

    const refreshAccountAction = () => void loadAccountAction();

    void loadAccountAction();
    window.addEventListener("focus", refreshAccountAction);
    window.addEventListener("pass-status-changed", refreshAccountAction);

    return () => {
      active = false;
      navigationRequestRef.current += 1;
      window.removeEventListener("focus", refreshAccountAction);
      window.removeEventListener("pass-status-changed", refreshAccountAction);
    };
  }, [isLoaded, isSignedIn]);

  return (
    <header
      className="site-header"
      data-scrolled={isScrolled}
      aria-label="Primary navigation"
    >
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
      <div className="header-actions" aria-live="polite">
        {isLoaded && !isSignedIn ? (
          <>
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
          </>
        ) : null}
        {isLoaded && isSignedIn ? <AccountMenu /> : null}
        {!isLoaded || (isSignedIn && accountAction === "loading") ? (
          <span
            aria-busy="true"
            aria-label="Loading account action"
            className="header-cta header-cta-loading"
            role="status"
          />
        ) : isSignedIn && accountAction === "has-pass" ? (
          <Link className="header-cta" href="/account#my-schedule">
            <CalendarDays aria-hidden="true" />
            My Schedule
          </Link>
        ) : isSignedIn && accountAction === "unavailable" ? (
          <Link className="header-cta" href="/account">
            My Account
          </Link>
        ) : (
          <Link className="header-cta" href={ctaHref}>
            Buy Pass
          </Link>
        )}
      </div>
    </header>
  );
}
