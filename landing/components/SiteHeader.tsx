"use client";

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { CalendarDays, Menu, UserRound, X } from "lucide-react";
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
  const mobileMenuRef = useRef<HTMLDialogElement>(null);
  const navigationRequestRef = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountAction, setAccountAction] = useState<AccountActionState>("loading");

  function openMobileMenu() {
    mobileMenuRef.current?.showModal();
    setIsMobileMenuOpen(true);
  }

  function closeMobileMenu() {
    mobileMenuRef.current?.close();
  }

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
      <Link className="brand" href="/" aria-label="Summer in the Mitten Movement Series home">
        <span className="brand-mark">SM</span>
        <span className="brand-copy">
          <strong>Summer in the Mitten</strong>
          <small>Movement Series</small>
        </span>
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
            <SignUpButton forceRedirectUrl="/welcome" mode="modal">
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
        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMobileMenuOpen}
          aria-label="Open menu"
          className="mobile-menu-button"
          type="button"
          onClick={openMobileMenu}
        >
          <Menu aria-hidden="true" />
        </button>
      </div>
      <dialog
        aria-label="Main menu"
        className="mobile-nav-dialog"
        id="mobile-navigation"
        ref={mobileMenuRef}
        onCancel={() => setIsMobileMenuOpen(false)}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        <div className="mobile-nav-heading">
          <Link className="brand" href="/" onClick={closeMobileMenu}>
            <span className="brand-mark">SM</span>
            <span className="brand-copy">
              <strong>Summer in the Mitten</strong>
              <small>Movement Series</small>
            </span>
          </Link>
          <button
            aria-label="Close menu"
            className="mobile-menu-button mobile-menu-close"
            type="button"
            onClick={closeMobileMenu}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <nav className="mobile-nav-links" aria-label="Mobile menu">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={closeMobileMenu}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-nav-account">
          {isLoaded && isSignedIn ? (
            <Link className="mobile-nav-account-link" href="/account" onClick={closeMobileMenu}>
              <UserRound aria-hidden="true" />
              My Account
            </Link>
          ) : null}
          {isLoaded && !isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="button mobile-nav-sign-in" type="button" onClick={closeMobileMenu}>
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton forceRedirectUrl="/welcome" mode="modal">
                <button className="button mobile-nav-create-account" type="button" onClick={closeMobileMenu}>
                  Create Account
                </button>
              </SignUpButton>
            </>
          ) : null}
        </div>
      </dialog>
    </header>
  );
}
