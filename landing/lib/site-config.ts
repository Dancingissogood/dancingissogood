import type { Metadata } from "next";

export const siteConfig = {
  description:
    "A summer movement series of ballroom, Latin, swing, mobility, rhythm, and recovery in Southeast Michigan.",
  name: "Summer in the Mitten Movement Series",
  shortName: "Movement Series",
  url: "https://dancingissogood.com",
} as const;

export const siteUrl = new URL(siteConfig.url);

const socialImage = {
  url: "/assets/movement-series-hero.webp",
  width: 2400,
  height: 1350,
  alt: "Adults sharing ballroom dance and restorative movement in a bright studio",
};

type PublicPageMetadata = {
  description: string;
  path: `/${string}`;
  title: string;
};

export function createPublicPageMetadata({
  description,
  path,
  title,
}: PublicPageMetadata): Metadata {
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
      siteName: siteConfig.name,
      locale: "en_US",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
  };
}
