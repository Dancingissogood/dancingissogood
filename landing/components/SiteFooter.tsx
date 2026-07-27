import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link
            aria-label="Summer in the Mitten Movement Series home"
            className="footer-brand-home"
            href="/"
          >
            <BrandLogo className="footer-brand-logo" variant="on-dark" />
          </Link>
          <p className="footer-brand-tagline">
            Move, learn, restore, and connect in Southeast Michigan.
          </p>
        </div>
        <div className="footer-column">
          <h2>Explore</h2>
          <Link href="/#program">The program</Link>
          <Link href="/#menu">Class menu</Link>
          <Link href="/#schedule">Current schedule</Link>
          <Link href="/#pass">3-Day Pass</Link>
        </div>
        <div className="footer-column">
          <h2>Community</h2>
          <Link href="/instructors">Instructors</Link>
          <Link href="/studios">Partner studios</Link>
          <Link href="/account">My account</Link>
        </div>
        <div className="footer-column">
          <h2>Connect</h2>
          <a href="mailto:dancingissogood@gmail.com">Email us</a>
          <span>Monday-Wednesday</span>
          <span>9 AM-2 PM ET</span>
        </div>
      </div>
      <div className="footer-legal-row">
        <div>
          <p>Summer in the Mitten “Movement Series” is operated by Love Productions LLC.</p>
          <span>&copy; {currentYear} Love Productions LLC. All rights reserved.</span>
        </div>
        <nav className="footer-legal-links" aria-label="Legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <a href="mailto:dancingissogood@gmail.com">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
