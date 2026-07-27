import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";

import { MotionEffects } from "@/components/MotionEffects";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
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
  themeColor: "#38322f",
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
      <body className={outfit.variable}>
        <ClerkProvider
          appearance={{
            variables: {
              borderRadius: "0.5rem",
              colorBackground: "#ffffff",
              colorBorder: "#cbc5c0",
              colorForeground: "#342f2c",
              colorInput: "#faf7f3",
              colorInputForeground: "#342f2c",
              colorMuted: "#fcf0e9",
              colorMutedForeground: "#6d6560",
              colorNeutral: "#38322f",
              colorPrimary: "#ad624a",
              colorRing: "#d58f79",
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: "16px",
              fontWeight: {
                bold: 600,
                medium: 500,
                normal: 300,
                semibold: 600,
              },
            },
            elements: {
              dividerText: {
                fontSize: "0.8rem",
                fontWeight: 300,
              },
              footerActionLink: {
                color: "#ad624a",
                fontSize: "0.9rem",
                fontWeight: 600,
              },
              footerActionText: {
                fontSize: "0.9rem",
                fontWeight: 300,
              },
              formButtonPrimary: {
                fontSize: "1rem",
                fontWeight: 600,
                minHeight: "48px",
              },
              formFieldInput: {
                fontSize: "1rem",
                minHeight: "48px",
              },
              formFieldLabel: {
                fontSize: "0.9rem",
                fontWeight: 500,
              },
              headerSubtitle: {
                fontSize: "1rem",
                fontWeight: 300,
                lineHeight: 1.7,
              },
              headerTitle: {
                fontSize: "1.5rem",
                fontWeight: 600,
              },
              socialButtonsBlockButton: {
                fontSize: "1rem",
                fontWeight: 600,
                minHeight: "48px",
              },
            },
          }}
        >
          <MotionEffects />
          <SiteHeader />
          {children}
          <SiteFooter />
        </ClerkProvider>
      </body>
    </html>
  );
}
