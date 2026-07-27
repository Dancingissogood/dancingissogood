import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { InstructorRoster } from "@/components/InstructorRoster";
import { instructorProfiles } from "@/content/site";

export const metadata: Metadata = {
  title: "Instructors",
  description:
    "Meet the dance, rhythm, mobility, and recovery instructors of Summer in the Mitten.",
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
          <p className="eyebrow">Meet the team</p>
          <h1 id="instructors-title">Instructors</h1>
          <p>
            Specialists in ballroom, Latin, social dance, mobility, rhythm, and recovery.
          </p>
        </div>
        <p className="instructors-hero-note">Technique with feeling.</p>
      </section>

      <section className="section instructor-introduction">
        <div>
          <p className="eyebrow">On the floor</p>
          <h2>Great teaching changes how movement feels.</h2>
        </div>
        <div className="instructor-introduction-copy">
          <p>
            Our instructors bring professional experience and a point of view to every
            class. You&apos;ll work on the details that make movement feel clearer,
            stronger, and more musical.
          </p>
          <p>
            Choose the focus of private coaching or join the momentum of a group class.
            Either way, there is room to ask questions, try again, and make the
            movement your own.
          </p>
        </div>
      </section>

      <InstructorRoster instructors={instructorProfiles} />

      <section className="instructor-method" aria-labelledby="instructor-method-title">
        <div className="instructor-method-heading">
          <p className="eyebrow">How we teach</p>
          <h2 id="instructor-method-title">Specific, personal, and made to move.</h2>
        </div>
        <div className="instructor-method-points">
          <div>
            <span>01</span>
            <h3>Deep expertise</h3>
            <p>Learn from instructors who know the style from the inside.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Personal attention</h3>
            <p>Get useful corrections without losing the joy of the class.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Whole-body training</h3>
            <p>Technique, rhythm, mobility, and recovery work together.</p>
          </div>
        </div>
      </section>

      <section className="section instructor-cta">
        <div>
          <p className="eyebrow">Join us</p>
          <h2>Meet us on the floor.</h2>
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
