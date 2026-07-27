import type { Metadata } from "next";
import Image from "next/image";

import { StudioDirectory } from "@/components/StudioDirectory";
import { studioProfiles } from "@/content/site";

export const metadata: Metadata = {
  title: "Partner Studios",
  description:
    "Movement Series partner studios, including Belleville Lake Dance Company and Rhizome Roots Studio.",
};

export default function StudiosPage() {
  return (
    <main>
      <section className="studios-hero">
        <Image
          alt="Adults gathering for movement class in a bright studio"
          fill
          priority
          sizes="100vw"
          src="/assets/editorial/community-class.webp"
        />
        <div className="studios-hero-shade" />
        <div className="studios-hero-content">
          <p className="eyebrow">Where we move</p>
          <h1>Local spaces. Shared movement.</h1>
          <p>
            Two studios rooted in learning, well-being, creativity, and community.
          </p>
        </div>
      </section>

      <StudioDirectory studios={studioProfiles} />

      <section className="section studio-note" data-reveal>
        <p className="eyebrow">Our studio partners</p>
        <h2>Local roots. Room to move.</h2>
        <p>
          Together, these studios make space for ballroom, social dance, mobility,
          recovery, and the shared joy of learning something new.
        </p>
      </section>
    </main>
  );
}
