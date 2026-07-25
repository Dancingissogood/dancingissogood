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
        <p className="eyebrow">Where we dance</p>
        <h1>Two studios. One dance community.</h1>
        <p>
          Dancing Is So Good brings together Belleville Lake Dance Company and Rhizome
          Roots Studio - two spaces built around movement, connection, and community.
        </p>
      </section>

      <StudioDirectory studios={studioProfiles} />

      <section className="section studio-note">
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
