import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { InstructorRoster } from "@/components/InstructorRoster";
import { instructorProfiles } from "@/content/site";

export const metadata: Metadata = {
  title: "Instructors",
  description:
    "Meet the rotating dance, rhythm, mobility, and wellness specialists shaping each Dancing Is So Good camp.",
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
          <p className="eyebrow">Teaching roster</p>
          <h1 id="instructors-title">Instructors</h1>
          <p>
            A rotating team of dance, rhythm, mobility, and wellness specialists
            shapes every camp menu.
          </p>
        </div>
        <p className="instructors-hero-note">Professional instruction. Twenty-minute focus.</p>
      </section>

      <section className="section instructor-introduction">
        <div>
          <p className="eyebrow">A living roster</p>
          <h2>The teachers change as the menu evolves.</h2>
        </div>
        <div className="instructor-introduction-copy">
          <p>
            Each six-week camp brings together specialists around the classes they
            teach best. That keeps instruction focused and lets the schedule respond
            to guest teachers, studio availability, and the needs of the group.
          </p>
          <p>
            Instructor names, full biographies, and confirmed teaching dates will be
            added as each camp roster is finalized.
          </p>
        </div>
      </section>

      <InstructorRoster instructors={instructorProfiles} />

      <section className="instructor-method" aria-labelledby="instructor-method-title">
        <div className="instructor-method-heading">
          <p className="eyebrow">The teaching model</p>
          <h2 id="instructor-method-title">Specialists where they matter most.</h2>
        </div>
        <div className="instructor-method-points">
          <div>
            <span>01</span>
            <h3>Rotating expertise</h3>
            <p>Teachers enter the schedule around their strongest disciplines.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Personal attention</h3>
            <p>Private and group formats create room for focused correction.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Connected training</h3>
            <p>Dance technique works alongside rhythm, mobility, and recovery.</p>
          </div>
        </div>
      </section>

      <section className="section instructor-cta">
        <div>
          <p className="eyebrow">Plan your camp</p>
          <h2>Follow the instructors into the live class menu.</h2>
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
