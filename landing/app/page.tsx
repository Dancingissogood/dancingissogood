import Image from "next/image";
import Link from "next/link";

import { ClassMenu } from "@/components/ClassMenu";
import { CheckoutButton } from "@/components/CheckoutButton";
import { QuickFacts } from "@/components/QuickFacts";
import { PublicSchedule } from "@/components/PublicSchedule";
import { ViewerTimeZoneLabel } from "@/components/ViewerTimeZoneLabel";
import { classMenuItems, quickFacts } from "@/content/site";

export default function HomePage() {
  return (
    <main id="top">
      <section className="hero" aria-label="Summer in the Mitten Movement Series">
        <div className="hero-image">
          <Image
            src="/assets/movement-series-hero.webp"
            alt="Adults sharing ballroom dance and restorative movement in a bright studio"
            fill
            priority
            quality={90}
            sizes="100vw"
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">Summer in the Mitten</p>
          <h1>Movement that brings you back to yourself.</h1>
          <p className="hero-copy">
            Three open mornings of dance, rhythm, mobility, and restoration, guided by
            professional instructors and shaped for curious beginners and experienced
            dancers alike.
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
          <p className="eyebrow">The Movement Series</p>
          <h2>Arrive as you are. Leave more connected.</h2>
        </div>
        <div className="intro-copy">
          <p>
            Move from Waltz to Cuban Motion, pause for recovery, then follow the music
            somewhere new. Each focused session takes you straight to the heart of the
            technique.
          </p>
          <p>
            Your pass opens the full schedule from Monday through Wednesday. Choose a
            few classes or settle in for the day; the pace is yours.
          </p>
        </div>
      </section>

      <section id="menu" className="section menu-section">
        <div className="section-heading">
          <p className="eyebrow">Movement Menu</p>
          <h2>Technique, rhythm, and room to explore.</h2>
        </div>
        <ClassMenu classes={classMenuItems} />
      </section>

      <section id="schedule" className="section schedule-section">
        <div className="schedule-heading-row">
          <div>
            <p className="eyebrow">Current Schedule</p>
            <h2>Plan your time in the studio.</h2>
            <p>
              Reserve the sessions that speak to you. All class times are shown in your
              selected time zone.
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
          <p className="eyebrow">A fuller practice</p>
          <h2>Move well, learn deeply, feel at home.</h2>
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
          <p className="eyebrow">Stay connected</p>
          <h2>Questions about the series?</h2>
          <p>
            We are here to help you choose the right camp week and make the most of
            your time in the studio.
          </p>
        </div>
        <a className="button button-secondary" href="mailto:dancingissogood@gmail.com">
          Get in touch
        </a>
      </section>
    </main>
  );
}
