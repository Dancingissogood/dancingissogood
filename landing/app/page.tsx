import Image from "next/image";
import Link from "next/link";

import { AnimatedArrowIcon } from "@/components/AnimatedArrowIcon";
import { ClassMenu } from "@/components/ClassMenu";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PublicSchedule } from "@/components/PublicSchedule";
import { ViewerTimeZoneLabel } from "@/components/ViewerTimeZoneLabel";
import { classMenuItems } from "@/content/site";

const heroPathways = [
  {
    detail: "Find your movement",
    href: "#menu",
    label: "Explore the class menu",
  },
  {
    detail: "Follow your rhythm",
    href: "#schedule",
    label: "View the schedule",
  },
  {
    detail: "Find your place",
    href: "/studios",
    label: "Meet our studio partners",
  },
];

export default function HomePage() {
  return (
    <main id="top">
      <section className="hero" aria-label="Summer in the Mitten Movement Series">
        <div className="hero-image">
          <Image
            src="/assets/editorial/movement-hero.webp"
            alt="Two adults sharing a graceful dance movement in a sunlit studio"
            fill
            priority
            quality={90}
            sizes="100vw"
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Summer in the Mitten “Movement Series”</h1>
          <Image
            className="hero-brand-logo"
            src="/assets/brand/summer-in-the-mitten-hero-logo-on-dark-transparent.png"
            alt=""
            aria-hidden="true"
            height={1022}
            priority
            sizes="(max-width: 640px) 230px, (max-width: 900px) 270px, 330px"
            width={806}
          />
          <p className="hero-copy">Move with intention. Dance with joy.</p>
        </div>
        <div className="hero-pathways" aria-label="Explore the Movement Series">
          <p>Where will your movement take you?</p>
          <div>
            {heroPathways.map((pathway) => (
              <Link href={pathway.href} key={pathway.href}>
                <span>{pathway.detail}</span>
                <strong>{pathway.label}</strong>
                <AnimatedArrowIcon />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="program" className="section program-story" data-reveal>
        <div className="program-story-media">
          <Image
            alt="Adults learning dance and expressive movement together"
            fill
            sizes="(max-width: 820px) 100vw, 50vw"
            src="/assets/editorial/community-class.webp"
          />
        </div>
        <div className="program-story-copy">
          <p className="eyebrow">The Movement Series</p>
          <h2>Straight to the heart of dance movements.</h2>
          <p>
            Discover ballroom, Latin, swing, mobility, and recovery through movement
            that feels grounded, expressive, and entirely your own.
          </p>
          <Link className="pill-link" href="#menu">
            Discover the classes <AnimatedArrowIcon />
          </Link>
        </div>
      </section>

      <section className="section practice-section" data-reveal>
        <div className="section-heading section-heading-centered">
          <p className="eyebrow">Why movement, why now</p>
          <h2>These class movements are the epitome of dance techniques.</h2>
          <p>
            Technique matters. So do confidence, connection, and the way you feel
            when you leave the room.
          </p>
        </div>
        <div className="practice-pillars">
          <article>
            <Image
              alt=""
              aria-hidden="true"
              className="practice-pillar-art"
              height={619}
              sizes="120px"
              src="/assets/illustrations/movement-line-art.png"
              width={428}
            />
            <h3>For your movement</h3>
            <p>Build clearer technique, balance, rhythm, and expressive range.</p>
          </article>
          <article>
            <Image
              alt=""
              aria-hidden="true"
              className="practice-pillar-art"
              height={528}
              sizes="120px"
              src="/assets/illustrations/wellbeing-line-art.png"
              width={510}
            />
            <h3>For your well-being</h3>
            <p>Make room for mobility, recovery, focus, and a steadier pace.</p>
          </article>
          <article>
            <Image
              alt=""
              aria-hidden="true"
              className="practice-pillar-art"
              height={529}
              sizes="120px"
              src="/assets/illustrations/community-line-art.png"
              width={573}
            />
            <h3>For your community</h3>
            <p>Learn alongside adults who are curious, open, and ready to move.</p>
          </article>
        </div>
      </section>

      <section id="menu" className="section menu-section" data-reveal>
        <div className="section-heading">
          <p className="eyebrow">Movement menu</p>
          <h2>Find the practice that speaks to you.</h2>
          <p>
            Move between rhythm, partnership, technique, and restoration.
          </p>
        </div>
        <ClassMenu classes={classMenuItems} />
      </section>

      <section className="section restoration-story" data-reveal>
        <div className="restoration-story-media">
          <Image
            alt="Adults in a guided mobility and recovery session"
            fill
            sizes="(max-width: 820px) 100vw, 58vw"
            src="/assets/editorial/restoration.webp"
          />
        </div>
        <div className="restoration-story-copy">
          <p className="eyebrow">Restore as you go</p>
          <h2>Strong movement begins with listening.</h2>
          <p>
            Recovery is part of the program, not an afterthought. Slow down, release
            what is tight, and return to the floor with greater ease.
          </p>
          <Link className="pill-link pill-link-light" href="#schedule">
            Plan a balanced day <AnimatedArrowIcon />
          </Link>
        </div>
      </section>

      <section id="schedule" className="section schedule-section" data-reveal>
        <div className="schedule-heading-row">
          <div>
            <p className="eyebrow">Current schedule</p>
            <h2>Make the morning your own.</h2>
            <p>
              Reserve the sessions that feel right for you. Times are shown in your
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

      <section id="pass" className="section pass-section" data-reveal>
        <div className="pass-media">
          <Image
            alt="Mature adults practicing ballroom movement in a botanical studio"
            fill
            sizes="100vw"
            src="/assets/editorial/partner-practice.webp"
          />
        </div>
        <div className="pass-shade" />
        <div className="pass-copy">
          <p className="eyebrow">Your pass</p>
          <h2>Move freely through the whole series.</h2>
          <p>Follow your curiosity from one style, rhythm, and practice to the next.</p>
        </div>
        <aside className="price-card" aria-label="Movement Series pass price">
          <span className="price-label">Summer pass</span>
          <strong>$100</strong>
          <p>All classes, Monday through Wednesday.</p>
          <CheckoutButton
            className="button pass-purchase-button"
            passSlug="three-day-camp-pass"
          />
        </aside>
      </section>

      <section className="section community-section" data-reveal>
        <div>
          <p className="eyebrow">Your movement community</p>
          <h2>Good teaching. Welcoming rooms. Space to grow.</h2>
        </div>
        <div className="community-actions">
          <Link className="path-link" href="/#schedule">
            <span>Choose what moves you</span>
            <strong>Current schedule</strong>
            <AnimatedArrowIcon />
          </Link>
          <Link className="path-link path-link-rose" href="/studios">
            <span>Discover where we gather</span>
            <strong>Partner studios</strong>
            <AnimatedArrowIcon />
          </Link>
        </div>
      </section>

      <section id="contact" className="section contact-section" data-reveal>
        <div>
          <p className="eyebrow">Stay connected</p>
          <h2>Let&apos;s talk movement.</h2>
          <p>
            Questions about the series, the schedule, or choosing your first class?
            We are here to help.
          </p>
        </div>
        <a className="pill-link pill-link-light" href="mailto:dancingissogood@gmail.com">
          Get in touch <AnimatedArrowIcon />
        </a>
      </section>
    </main>
  );
}
