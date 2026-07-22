import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
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
    default: "Dancing Is So Good | Dance & Wellness Camp",
    template: "%s | Dancing Is So Good",
  },
  description:
    "A six-week dance and wellness camp with 20-minute classes, private and group instruction, and unlimited Monday-Wednesday access from 9 AM to 2 PM Eastern Time.",
  openGraph: {
    title: "Dancing Is So Good",
    description:
      "Dance, mobility, rhythm, recovery, and wellness classes in focused 20-minute sessions.",
    type: "website",
    images: [
      {
        url: "/assets/dance-camp-hero-hd-v2.webp",
        width: 6868,
        height: 3664,
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
