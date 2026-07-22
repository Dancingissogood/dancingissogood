import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-primary">
        <div className="footer-brand">
          <span className="brand-mark brand-mark-footer">DG</span>
          <div>
            <p>Dancing Is So Good</p>
            <span>Six-week dance and wellness camp. Monday-Wednesday, 9 AM-2 PM Eastern Time.</span>
          </div>
        </div>
        <Link className="footer-schedule-link" href="/#contact">
          Request the next schedule
        </Link>
      </div>
      <div className="footer-legal-row">
        <div>
          <p>Dancing Is So Good is operated by Love Productions LLC.</p>
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
