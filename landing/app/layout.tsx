import type { Metadata } from "next";
import { Instrument_Sans, Playfair_Display } from "next/font/google";

import { MotionProvider } from "@/components/MotionProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair-display",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dancing Is So Good | Dance & Wellness Camp",
    template: "%s | Dancing Is So Good",
  },
  description:
    "A six-week dance and wellness camp with rotating 20-minute classes, private and group instruction, and unlimited Monday-Wednesday class access.",
  openGraph: {
    title: "Dancing Is So Good",
    description:
      "A rotating dance, wellness, rhythm, and recovery camp with 20-minute class sections.",
    type: "website",
    images: [
      {
        url: "/assets/dance-camp-hero.png",
        width: 1717,
        height: 916,
        alt: "Adults practicing dance and mobility in a bright studio",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${playfairDisplay.variable}`}>
        <MotionProvider />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
