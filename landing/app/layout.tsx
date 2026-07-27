import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, DM_Sans } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bodoni-moda",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Summer in the Mitten | Movement Series",
    template: "%s | Summer in the Mitten",
  },
  description:
    "A summer movement series of ballroom, Latin, swing, mobility, rhythm, and recovery in Southeast Michigan.",
  openGraph: {
    title: "Summer in the Mitten “Movement Series”",
    description:
      "Three open mornings of dance, rhythm, movement, and restoration.",
    type: "website",
    images: [
      {
        url: "/assets/movement-series-hero.webp",
        width: 2400,
        height: 1350,
        alt: "Adults sharing ballroom dance and restorative movement in a bright studio",
      },
    ],
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#fbfcf8",
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${bodoniModa.variable}`}>
        <ClerkProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ClerkProvider>
      </body>
    </html>
  );
}
