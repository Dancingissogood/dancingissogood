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
      <Link className="header-cta" href={ctaHref}>
        Request the Schedule
      </Link>
    </header>
  );
}
