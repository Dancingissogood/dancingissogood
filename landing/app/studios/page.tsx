import type { Metadata } from "next";

import { StudioDirectory } from "@/components/StudioDirectory";
import { studioProfiles } from "@/content/site";

export const metadata: Metadata = {
  title: "Partner Studios",
  description:
    "Dancing Is So Good partner studios, including Belleville Lake Dance Company and Rhizome Roots Studio.",
};

export default function StudiosPage() {
  return (
    <main>
      <section className="studios-hero">
        <p className="eyebrow">Partner studios</p>
        <h1>Studios supporting dance and wellness.</h1>
        <p>
          Dancing Is So Good works with Belleville Lake Dance Company and Rhizome
          Roots Studio for dance instruction, movement education, and wellness classes.
        </p>
      </section>

      <StudioDirectory studios={studioProfiles} />

      <section className="section studio-note">
        <p className="eyebrow">Shared strengths</p>
        <h2>Dance training, wellness, and community.</h2>
        <p>
          Partner studios contribute experience in dance technique, social dancing,
          rhythm, mobility, recovery, wellness, and education.
        </p>
      </section>
    </main>
  );
}
