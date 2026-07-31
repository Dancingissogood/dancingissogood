import Image from "next/image";
import Link from "next/link";

import { AnimatedArrowIcon } from "@/components/AnimatedArrowIcon";
import { StudioDirectory } from "@/components/StudioDirectory";
import { studioProfiles } from "@/content/site";
import { createPublicPageMetadata } from "@/lib/site-config";

export const metadata = createPublicPageMetadata({
  title: "Partner Studios",
  description:
    "Movement Series partner studios, including Belleville Lake Dance Company and Rhizome Roots Studio.",
  path: "/studios",
});

export default function StudiosPage() {
  return (
    <main className="studios-page">
      <section className="studios-hero" aria-labelledby="studios-title">
        <Image
          alt="Adults gathering for movement class in a bright studio"
          fill
          priority
          sizes="100vw"
          src="/assets/editorial/community-class.webp"
        />
        <div className="studios-hero-shade" />
        <div className="studios-hero-content">
          <p className="eyebrow">Partner studios</p>
          <h1 id="studios-title">Movement begins with a place.</h1>
          <p>Welcoming spaces across Southeast Michigan.</p>
        </div>
      </section>

      <section className="section studios-introduction" data-reveal>
        <p className="eyebrow">Where we gather</p>
        <div>
          <h2>Spaces shaped by community.</h2>
          <p>
            Each partner brings its own character, practice, and sense of belonging
            to the Movement Series.
          </p>
        </div>
      </section>

      <StudioDirectory studios={studioProfiles} />

      <section className="section studios-cta" data-reveal>
        <div>
          <p className="eyebrow">Make your move</p>
          <h2>Find your next class.</h2>
        </div>
        <Link className="pill-link" href="/#schedule">
          View the schedule <AnimatedArrowIcon />
        </Link>
      </section>
    </main>
  );
}
