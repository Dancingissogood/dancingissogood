import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="brand-mark brand-mark-footer">DG</span>
        <div>
          <p>Dancing Is So Good</p>
          <span>Dance, wellness, rhythm, and recovery in one rotating studio menu.</span>
        </div>
      </div>
      <Link className="footer-link" href="/#contact">
        Request the next schedule
      </Link>
    </footer>
  );
}
