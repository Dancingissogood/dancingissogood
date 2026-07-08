import type { Metadata } from "next";

import { StudioDirectory } from "@/components/StudioDirectory";
import { studioProfiles } from "@/content/site";

export const metadata: Metadata = {
  title: "Partner Studios",
  description:
    "Studios currently connected with Dancing Is So Good, including Belleville Lake Dance Company and Rhizome Roots Studio.",
};

export default function StudiosPage() {
  return (
    <main>
      <section className="studios-hero">
        <p className="eyebrow">Current studio network</p>
        <h1>Studios connected to the camp experience.</h1>
        <p>
          Dancing Is So Good is built around professional instruction, community
          spaces, and movement education. These are the studios currently connected
          with the program.
        </p>
      </section>

      <StudioDirectory studios={studioProfiles} />

      <section className="section studio-note">
        <p className="eyebrow">How they fit</p>
        <h2>Different spaces, one movement ecosystem.</h2>
        <p>
          The camp model benefits from studios that bring different strengths:
          dance technique, social connection, rhythm training, recovery, wellness,
          and education. The result is a broader class menu and a more flexible
          path for students.
        </p>
      </section>
    </main>
  );
}
