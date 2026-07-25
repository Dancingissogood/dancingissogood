import Image from "next/image";
import Link from "next/link";

import { ClassMenu } from "@/components/ClassMenu";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ContactForm } from "@/components/ContactForm";
import { QuickFacts } from "@/components/QuickFacts";
import { PublicSchedule } from "@/components/PublicSchedule";
import { ViewerTimeZoneLabel } from "@/components/ViewerTimeZoneLabel";
import { classMenuItems, quickFacts } from "@/content/site";

export default function HomePage() {
  return (
    <main id="top">
      <section className="hero" aria-label="Dancing Is So Good summer camp">
        <div className="hero-image">
          <Image
            src="/assets/dance-camp-hero-hd-v2.webp"
            alt="Adults practicing dance and mobility in a bright studio"
            fill
            priority
            quality={90}
            sizes="100vw"
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">Dancing Is So Good</p>
          <h1>A summer dance camp made to move with you.</h1>
          <p className="hero-copy">
            Spend three mornings exploring ballroom, Latin, social dance, mobility,
            rhythm, and recovery with professional instructors and a fresh lineup every
            camp week. Monday-Wednesday, 9 AM-2 PM ET.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#pass">
              Buy the 3-Day Pass
            </Link>
            <Link className="button button-secondary" href="#menu">
              Explore Classes
            </Link>
          </div>
        </div>
      </section>

      <QuickFacts facts={quickFacts} />

      <section id="program" className="section section-intro">
        <div className="section-heading">
          <p className="eyebrow">Make the morning yours</p>
          <h2>Build a camp day that moves with you.</h2>
        </div>
        <div className="intro-copy">
          <p>
            Start with Waltz, move into Cuban Motion, reset with mobility, then follow
            the music wherever it goes. Every class brings a new skill, specialty, and
            energy.
          </p>
          <p>
            Drop in for a favorite or stay for the full morning. The lineup changes
            with the instructors in the room, so every camp week has its own character.
          </p>
        </div>
      </section>

      <section id="menu" className="section menu-section">
        <div className="section-heading">
          <p className="eyebrow">On the menu</p>
          <h2>Find your next favorite way to move.</h2>
        </div>
        <ClassMenu classes={classMenuItems} />
      </section>

      <section id="schedule" className="section schedule-section">
        <div className="schedule-heading-row">
          <div>
            <p className="eyebrow">This week</p>
            <h2>What&apos;s on the floor.</h2>
            <p>
              A fresh lineup of dance, movement, and recovery each camp week.
            </p>
          </div>
          <div className="schedule-summary" aria-label="Schedule details">
            <div><span>Days</span><strong>Mon-Wed</strong></div>
            <div><span>Class length</span><strong>20 minutes</strong></div>
            <div><span>Studio hours</span><strong>9 AM-2 PM ET</strong></div>
            <div><span>Your time</span><strong><ViewerTimeZoneLabel /></strong></div>
          </div>
        </div>
        <PublicSchedule />
      </section>

      <section id="pass" className="section pass-section">
        <div className="pass-copy">
          <p className="eyebrow">One pass. Three days.</p>
          <h2>$100 for the full camp week.</h2>
          <p>
            Come for a favorite class or stay from first class to last. Your pass
            covers every class from Monday through Wednesday.
          </p>
        </div>
        <aside className="price-card" aria-label="3-day pass price">
          <span className="price-label">3-Day Pass</span>
          <strong>$100</strong>
          <p>
            Every class, Monday-Wednesday, 9 AM-2 PM ET.
          </p>
          <CheckoutButton
            className="button button-primary pass-purchase-button"
            passSlug="three-day-camp-pass"
          />
        </aside>
      </section>

      <section className="section instructor-section">
        <div className="section-heading">
          <p className="eyebrow">Beyond the steps</p>
          <h2>More than a dance class.</h2>
        </div>
        <div className="feature-grid">
          <div>
            <h3>Teachers who know their craft</h3>
            <p>
              Learn from professionals who bring real depth, clarity, and personality
              to every class.
            </p>
          </div>
          <div>
            <h3>Private focus, group energy</h3>
            <p>Get personal attention, then put it into motion with the room.</p>
          </div>
          <div>
            <h3>A stronger way to move</h3>
            <p>
              Technique, rhythm, mobility, and recovery work together from the first
              class to the last.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="section contact-section">
        <div>
          <p className="eyebrow">Stay in step</p>
          <h2>Be first to know what&apos;s next.</h2>
          <p>
            Join the list for upcoming camp weeks, new class lineups, and pass releases.
          </p>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
