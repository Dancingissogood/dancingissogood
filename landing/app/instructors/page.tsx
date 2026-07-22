import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { InstructorRoster } from "@/components/InstructorRoster";
import { instructorProfiles } from "@/content/site";

export const metadata: Metadata = {
  title: "Instructors",
  description:
    "Learn from dance, rhythm, mobility, and wellness instructors at Dancing Is So Good.",
};

export default function InstructorsPage() {
  return (
    <main>
      <section className="instructors-hero" aria-labelledby="instructors-title">
        <Image
          alt="Dance instructor leading two students through a Latin movement exercise"
          fill
          priority
          quality={90}
          sizes="100vw"
          src="/assets/instructors-hero.webp"
        />
        <div className="instructors-hero-shade" />
        <div className="instructors-hero-content">
          <p className="eyebrow">Dance and wellness</p>
          <h1 id="instructors-title">Instructors</h1>
          <p>
            Learn dance technique, rhythm, mobility, and recovery from professional
            instructors across each camp week.
          </p>
        </div>
        <p className="instructors-hero-note">Dance, mobility, rhythm, and recovery.</p>
      </section>

      <section className="section instructor-introduction">
        <div>
          <p className="eyebrow">Professional instruction</p>
          <h2>Focused teaching across every discipline.</h2>
        </div>
        <div className="instructor-introduction-copy">
          <p>
            Dance, rhythm, mobility, and wellness classes are taught by instructors
            with experience in each subject. Every 20-minute session centers on a
            specific skill students can practice immediately.
          </p>
          <p>
            Private coaching provides individual correction, while group classes build
            confidence through guided practice with other students.
          </p>
        </div>
      </section>

      <InstructorRoster instructors={instructorProfiles} />

      <section className="instructor-method" aria-labelledby="instructor-method-title">
        <div className="instructor-method-heading">
          <p className="eyebrow">Instruction</p>
          <h2 id="instructor-method-title">Focused coaching in every class.</h2>
        </div>
        <div className="instructor-method-points">
          <div>
            <span>01</span>
            <h3>Specialist teaching</h3>
            <p>Each instructor teaches within their strongest disciplines.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Personal attention</h3>
            <p>Private and group formats create room for focused correction.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Cross-training</h3>
            <p>Dance technique works alongside rhythm, mobility, and recovery.</p>
          </div>
        </div>
      </section>

      <section className="section instructor-cta">
        <div>
          <p className="eyebrow">Choose your classes</p>
          <h2>Find instruction that matches your goals.</h2>
        </div>
        <div className="instructor-cta-actions">
          <Link className="button button-primary" href="/#schedule">
            View Schedule
          </Link>
          <Link className="button instructor-cta-secondary" href="/#pass">
            Buy the 3-Day Pass
          </Link>
        </div>
      </section>
    </main>
  );
}
