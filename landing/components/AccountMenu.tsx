"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function AccountMenu() {
  const clerk = useClerk();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const displayName = user?.fullName || user?.firstName || "Your account";
  const initials = getInitials(user?.firstName, user?.lastName, email);

  const openProfile = () => {
    setIsOpen(false);
    clerk.openUserProfile();
  };

  const signOut = async () => {
    setIsOpen(false);
    await clerk.signOut({ redirectUrl: "/" });
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        ref={triggerRef}
        className="account-menu-trigger"
        type="button"
        aria-label="Open account menu"
        aria-controls="account-menu-popover"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">{initials}</span>
      </button>

      {isOpen ? (
        <div
          id="account-menu-popover"
          className="account-menu-popover"
          role="group"
          aria-label="Account menu"
        >
          <div className="account-menu-identity">
            <span className="account-menu-monogram" aria-hidden="true">
              {initials}
            </span>
            <span className="account-menu-user">
              <strong>{displayName}</strong>
              {email ? <span>{email}</span> : null}
            </span>
          </div>

          <div className="account-menu-actions">
            <Link href="/account" onClick={() => setIsOpen(false)}>
              <UserRound aria-hidden="true" />
              Account
            </Link>
            <button type="button" onClick={openProfile}>
              <Settings aria-hidden="true" />
              Manage account
            </button>
            <button type="button" onClick={signOut}>
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string,
) {
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("");

  return (initials || email.charAt(0) || "A").toUpperCase();
}
