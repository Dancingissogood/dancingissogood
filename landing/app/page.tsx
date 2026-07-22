import Image from "next/image";
import Link from "next/link";

import { ClassMenu } from "@/components/ClassMenu";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ContactForm } from "@/components/ContactForm";
import { QuickFacts } from "@/components/QuickFacts";
import { PublicSchedule } from "@/components/PublicSchedule";
import { classMenuItems, quickFacts } from "@/content/site";

export default function HomePage() {
  return (
    <main id="top">
      <section className="hero" aria-label="Dance and wellness camp">
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
          <p className="eyebrow">Dance and wellness camp</p>
          <h1>Six weeks of dance, movement, and wellness.</h1>
          <p className="hero-copy">
            Train with professional instructors Monday through Wednesday from 9 AM to
            2 PM. Choose dance, mobility, rhythm, recovery, and wellness classes in
            focused 20-minute sessions.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#pass">
              Buy the 3-Day Pass
            </Link>
            <Link className="button button-secondary" href="#menu">
              View Classes
            </Link>
          </div>
        </div>
      </section>

      <QuickFacts facts={quickFacts} />

      <section id="program" className="section section-intro">
        <div className="section-heading">
          <p className="eyebrow">Monday through Wednesday</p>
          <h2>Train from 9 AM to 2 PM at your own pace.</h2>
        </div>
        <div className="intro-copy">
          <p>
            Camp days include dance technique, private coaching, group instruction,
            mobility, rhythm training, recovery, and wellness education. Each class
            runs for 20 minutes.
          </p>
          <p>
            Attend a focused block or stay through the full class window. Instructors
            teach within their specialties, so schedules may change from one camp week
            to the next.
          </p>
        </div>
      </section>

      <section id="menu" className="section menu-section">
        <div className="section-heading">
          <p className="eyebrow">Classes</p>
          <h2>Dance, mobility, rhythm, and recovery in 20 minutes.</h2>
        </div>
        <ClassMenu classes={classMenuItems} />
      </section>

      <section id="schedule" className="section schedule-section">
        <div className="schedule-heading-row">
          <div>
            <p className="eyebrow">Class schedule</p>
            <h2>See every class from 9 AM to 2 PM.</h2>
            <p>
              Check class times for Monday, Tuesday, and Wednesday. Your pass includes
              unlimited access throughout the daily class window.
            </p>
          </div>
          <div className="schedule-summary" aria-label="Schedule details">
            <div><span>Days</span><strong>Monday-Wednesday</strong></div>
            <div><span>Class length</span><strong>20 minutes</strong></div>
            <div><span>Access</span><strong>Unlimited, 9 AM-2 PM</strong></div>
            <div><span>Time zone</span><strong>Eastern Time</strong></div>
          </div>
        </div>
        <PublicSchedule />
      </section>

      <section id="pass" className="section pass-section">
        <div className="pass-copy">
          <p className="eyebrow">Camp pass</p>
          <h2>Three days of movement, technique, and wellness for $100.</h2>
          <p>
            The 3-day pass includes classes on Monday, Tuesday, and Wednesday.
            Come for a focused block, return for favorite classes, or train through
            the full 9 AM to 2 PM window.
          </p>
        </div>
        <aside className="price-card" aria-label="Three day pass price">
          <span className="price-label">3-Day Pass</span>
          <strong>$100</strong>
          <p>Unlimited class access between 9 AM and 2 PM, Monday through Wednesday.</p>
          <CheckoutButton
            className="button button-primary pass-purchase-button"
            passSlug="three-day-camp-pass"
          />
        </aside>
      </section>

      <section className="section instructor-section">
        <div className="section-heading">
          <p className="eyebrow">What to expect</p>
          <h2>Professional guidance across dance and wellness.</h2>
        </div>
        <div className="feature-grid">
          <div>
            <h3>Specialist instructors</h3>
            <p>
              Learn each discipline from instructors with relevant professional
              experience.
            </p>
          </div>
          <div>
            <h3>Private and group sessions</h3>
            <p>Move between targeted personal coaching and the energy of group instruction.</p>
          </div>
          <div>
            <h3>Dance and wellness</h3>
            <p>
              Dance technique pairs with recovery, meditation, rhythm, nutrition,
              and wellness.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="section contact-section">
        <div>
          <p className="eyebrow">Camp updates</p>
          <h2>Receive upcoming camp dates and class schedules.</h2>
          <p>
            Share your details to receive upcoming dates, class times, and pass
            information.
          </p>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
