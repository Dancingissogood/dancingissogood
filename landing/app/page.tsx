import Image from "next/image";
import Link from "next/link";

import { ClassMenu } from "@/components/ClassMenu";
import { ContactForm } from "@/components/ContactForm";
import { QuickFacts } from "@/components/QuickFacts";
import { classMenuItems, quickFacts } from "@/content/site";

export default function HomePage() {
  return (
    <main id="top">
      <section className="hero" aria-label="Dance and wellness camp">
        <div className="hero-image">
          <Image
            src="/assets/dance-camp-hero.png"
            alt="Adults practicing dance and mobility in a bright studio"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">Six-week dance and wellness camp</p>
          <h1>A rotating class menu for movement, rhythm, and recovery.</h1>
          <p className="hero-copy">
            Train Monday through Wednesday with professional instructors across dance
            technique, mobility, rhythm, wellness, and recovery. Each day is built
            from focused 20-minute sessions.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#pass">
              Reserve the 3-Day Pass
            </Link>
            <Link className="button button-secondary" href="#menu">
              Explore the Menu
            </Link>
          </div>
        </div>
      </section>

      <QuickFacts facts={quickFacts} />

      <section id="program" className="section section-intro">
        <div className="section-heading" data-reveal="left">
          <p className="eyebrow">The concept</p>
          <h2>A studio camp served like a daily specials menu.</h2>
        </div>
        <div className="intro-copy" data-reveal="right">
          <p>
            Each six-week camp has a live menu shaped by the instructors teaching
            that week. Students can choose technique refreshers, private coaching,
            group sessions, recovery work, rhythm training, and wellness education.
          </p>
          <p>
            The offering changes as teacher specialties and availability change.
            Every camp week feels curated, practical, and fresh.
          </p>
        </div>
      </section>

      <section id="menu" className="section menu-section">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">Studio menu</p>
          <h2>Choose your next 20-minute section.</h2>
        </div>
        <ClassMenu classes={classMenuItems} />
      </section>

      <section id="schedule" className="section schedule-section">
        <div className="schedule-panel" data-reveal="left">
          <div>
            <p className="eyebrow">Summer schedule</p>
            <h2>Camp weeks in July, August, and September.</h2>
            <p>
              Summer camps run on the 1st and 4th Monday, Tuesday, and Wednesday
              of each month.
            </p>
          </div>
          <div className="schedule-list" aria-label="Summer camp date pattern">
            <div>
              <span>July</span>
              <strong>1st & 4th Mon-Wed</strong>
            </div>
            <div>
              <span>August</span>
              <strong>1st & 4th Mon-Wed</strong>
            </div>
            <div>
              <span>September</span>
              <strong>1st & 4th Mon-Wed</strong>
            </div>
          </div>
        </div>
        <div className="day-format" data-reveal="right">
          <h3>Daily format</h3>
          <ol>
            <li>
              <span>7:00 AM</span> Early private and guided instruction begins.
            </li>
            <li>
              <span>9:00 AM</span> Unlimited class access opens.
            </li>
            <li>
              <span>9:00 AM-2:00 PM</span> Rotating 20-minute sessions run
              throughout the day.
            </li>
            <li>
              <span>Monday-Wednesday</span> Attend as many available sections as
              you want with the pass.
            </li>
          </ol>
        </div>
      </section>

      <section id="pass" className="section pass-section">
        <div className="pass-copy" data-reveal="left">
          <p className="eyebrow">Camp pass</p>
          <h2>Three days of movement, technique, and wellness for $100.</h2>
          <p>
            The 3-day pass gives you access to the rotating class menu across
            Monday, Tuesday, and Wednesday. Come for a focused block, drop into
            favorite sections, or train through the full 9 AM to 2 PM window.
          </p>
        </div>
        <aside className="price-card" aria-label="Three day pass price" data-reveal="right">
          <span className="price-label">3-Day Pass</span>
          <strong>$100</strong>
          <p>Unlimited class access between 9 AM and 2 PM, Monday through Wednesday.</p>
          <Link className="button button-primary" href="#contact">
            Request the Schedule
          </Link>
        </aside>
      </section>

      <section className="section instructor-section">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">Instruction model</p>
          <h2>Professional instruction with room to choose your pace.</h2>
        </div>
        <div className="feature-grid">
          <div data-reveal>
            <h3>Rotating specialists</h3>
            <p>
              Class offerings shift with teacher specialties, guest instructors,
              and weekly availability.
            </p>
          </div>
          <div data-reveal>
            <h3>Private and group sessions</h3>
            <p>Move between targeted personal coaching and the energy of group instruction.</p>
          </div>
          <div data-reveal>
            <h3>Whole-dancer training</h3>
            <p>
              Dance technique pairs with recovery, meditation, rhythm, nutrition,
              and wellness.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="section contact-section">
        <div data-reveal="left">
          <p className="eyebrow">Join the next camp</p>
          <h2>Get the next schedule menu.</h2>
          <p>
            Share your details and we will send the upcoming class menu, camp
            dates, and pass information.
          </p>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
