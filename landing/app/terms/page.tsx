import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing the Dancing Is So Good website, accounts, passes, and programs.",
};

export default function TermsOfServicePage() {
  return (
    <main className="legal-page">
      <article className="legal-document">
        <header className="legal-heading">
          <p className="eyebrow">Legal</p>
          <h1>Terms of Service</h1>
          <p className="legal-effective-date">Effective and last updated July 16, 2026</p>
          <p>
            These Terms of Service govern your use of dancingissogood.com and the
            accounts, passes, schedules, registrations, and related services offered by
            Love Productions LLC through Dancing Is So Good. By using the site, creating
            an account, or completing a purchase, you agree to these Terms.
          </p>
        </header>

        <section>
          <h2>1. Eligibility and authority</h2>
          <p>
            You must be legally capable of entering into a binding agreement to use paid
            services. If you use the site or purchase a pass for another person, you
            represent that you are authorized to provide the necessary information and
            accept these Terms on their behalf. A parent or legal guardian must act for a
            minor where required by law.
          </p>
        </section>

        <section>
          <h2>2. Accounts</h2>
          <p>
            Some features require an account, while guest checkout may be available for
            certain purchases. You must provide accurate information, keep it current,
            protect your sign-in credentials, and notify us promptly if you suspect
            unauthorized account use. You are responsible for activity conducted through
            your account unless applicable law provides otherwise.
          </p>
          <p>
            We may connect a guest purchase to an account when the verified account email
            matches the purchaser email. You may not impersonate another person, create
            an account using information you are not authorized to use, or interfere with
            another person&apos;s account.
          </p>
        </section>

        <section>
          <h2>3. Programs, schedules, and availability</h2>
          <p>
            Class menus rotate based on instructor specialties, studio availability,
            enrollment, safety, and operational needs. Published schedules, instructors,
            locations, class descriptions, capacities, and times may change. We may add,
            substitute, reschedule, relocate, or cancel a class or program when reasonably
            necessary. We will make reasonable efforts to communicate material changes to
            affected participants using available contact information.
          </p>
          <p>
            A pass provides access only during its stated validity period and subject to
            the schedule, capacity, reservation requirements, studio rules, and any terms
            displayed at purchase. A pass does not guarantee that a particular class,
            instructor, time, or location will be available.
          </p>
        </section>

        <section>
          <h2>4. Purchases and payment</h2>
          <ul>
            <li>Prices and included access are shown before you complete checkout.</li>
            <li>Current camp passes are one-time purchases, not recurring subscriptions.</li>
            <li>Stripe processes payments and may apply its own terms to your payment.</li>
            <li>You authorize the displayed charge, plus any taxes disclosed at checkout.</li>
            <li>
              You represent that you are authorized to use the selected payment method
              and that the billing information supplied to Stripe is accurate.
            </li>
          </ul>
          <p>
            An order is complete only after payment is successfully processed and we
            issue confirmation. We may reject or cancel a transaction affected by fraud,
            unauthorized use, pricing or configuration error, or legal restriction. If
            we cancel a completed transaction for one of these reasons, we will provide
            any refund required by law.
          </p>
        </section>

        <section>
          <h2>5. Cancellations, credits, and refunds</h2>
          <p>
            To request a cancellation, credit, or refund, contact us promptly at
            <a href="mailto:dancingissogood@gmail.com"> dancingissogood@gmail.com</a>.
            Eligibility depends on the timing of the request, whether the pass or class
            access has been used, commitments made to studios and instructors, and any
            cancellation terms presented at checkout or agreed to in writing. We will
            honor applicable law and any written refund or cancellation commitment made
            at the time of purchase.
          </p>
          <p>
            If we cancel an entire paid program and do not provide a reasonable substitute,
            credit, or rescheduled option, contact us regarding the available remedy.
            Failure to attend an available class does not by itself entitle a participant
            to a refund.
          </p>
        </section>

        <section>
          <h2>6. Health, safety, and participation</h2>
          <p>
            Dance, stretching, mobility, yoga, acro yoga, massage, juggling, and other
            physical activities involve inherent risks, including falls, collisions,
            overexertion, and injury. You are responsible for deciding whether an activity
            is appropriate for you and for disclosing relevant limitations to the
            instructor when appropriate. Consult a qualified health professional before
            participating if you have a medical condition, are pregnant, are recovering
            from injury, or have concerns about your ability to participate safely.
          </p>
          <p>
            Follow instructor directions, posted studio rules, and reasonable safety
            instructions. Stop participating and seek appropriate assistance if you feel
            pain, dizziness, illness, or unsafe conditions. Program information, including
            nutrition, recovery, massage, meditation, wellness, or home-remedy content, is
            educational and is not medical diagnosis, treatment, or individualized
            professional advice.
          </p>
          <p>
            Participation may require a separate studio or activity waiver. These Terms
            do not replace any waiver or informed-consent document presented for an
            in-person activity.
          </p>
        </section>

        <section>
          <h2>7. Participant conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Harass, threaten, discriminate against, or endanger another person.</li>
            <li>Disrupt instruction or disregard reasonable safety and studio rules.</li>
            <li>Attend while impaired in a manner that creates a safety risk.</li>
            <li>Use another person&apos;s pass or transfer a pass without written permission.</li>
            <li>Record participants or instructors where recording is prohibited.</li>
            <li>Damage property or use the site or services for unlawful purposes.</li>
          </ul>
          <p>
            We may remove or restrict a participant when reasonably necessary to protect
            safety, maintain an appropriate learning environment, prevent fraud, or enforce
            these Terms. Any refund in that situation remains subject to Section 5 and
            applicable law.
          </p>
        </section>

        <section>
          <h2>8. Acceptable use of the site</h2>
          <p>
            You may not probe or bypass security, access nonpublic systems without
            authorization, introduce malicious code, scrape the site in a way that burdens
            its operation, interfere with another user, reverse engineer protected
            portions of the service except where law expressly permits it, or use the site
            to violate another person&apos;s rights.
          </p>
        </section>

        <section>
          <h2>9. Intellectual property</h2>
          <p>
            The site and its original text, design, graphics, photographs, branding,
            software, schedules, and other content are owned by Love Productions LLC or
            used with permission and are protected by applicable intellectual-property
            laws. We grant you a limited, revocable, nonexclusive, nontransferable license
            to use the site for personal, noncommercial purposes. No other right is granted.
          </p>
          <p>
            Names, logos, photographs, and materials belonging to participating studios,
            instructors, payment providers, and other third parties remain the property of
            their respective owners.
          </p>
        </section>

        <section>
          <h2>10. Third-party services and locations</h2>
          <p>
            The service relies on third parties for authentication, payments, hosting, and
            in-person instruction or studio space. Third-party websites and services are
            governed by their own terms. Participating studios may impose reasonable rules
            for their premises and activities. Love Productions LLC is responsible only
            for its own obligations and does not control independent third-party services.
          </p>
        </section>

        <section>
          <h2>11. Disclaimers</h2>
          <p>
            To the fullest extent permitted by law, the site and services are provided on
            an &quot;as is&quot; and &quot;as available&quot; basis. We do not warrant uninterrupted or
            error-free operation, permanent availability of a particular class, or that
            general educational information will meet every participant&apos;s needs. Nothing
            in these Terms excludes warranties or rights that cannot lawfully be excluded.
          </p>
        </section>

        <section>
          <h2>12. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Love Productions LLC and its members,
            employees, and agents will not be liable for indirect, incidental, special,
            consequential, exemplary, or punitive damages arising from the site or services.
            Our aggregate liability for a claim relating to a purchased pass will not
            exceed the amount you paid for the pass giving rise to the claim.
          </p>
          <p>
            These limitations do not apply to liability that cannot legally be limited or
            excluded, including where applicable liability for gross negligence, willful
            misconduct, or personal injury caused by a party&apos;s legally actionable conduct.
          </p>
        </section>

        <section>
          <h2>13. Indemnification</h2>
          <p>
            To the extent permitted by law, you agree to indemnify and hold Love Productions
            LLC harmless from third-party claims, losses, and reasonable expenses arising
            from your unlawful misuse of the site, violation of these Terms, infringement
            of another person&apos;s rights, or intentional misconduct. This section does not
            require indemnification for our own negligence or conduct where prohibited by law.
          </p>
        </section>

        <section>
          <h2>14. Suspension and termination</h2>
          <p>
            You may stop using the site at any time. We may suspend or terminate access
            when reasonably necessary to address security risk, unlawful activity, fraud,
            material breach, nonpayment, or danger to others. Provisions that by their
            nature should survive termination will remain effective, including payment,
            intellectual-property, disclaimer, liability, and dispute provisions.
          </p>
        </section>

        <section>
          <h2>15. Applicable law and disputes</h2>
          <p>
            These Terms are governed by applicable United States federal law and the state
            law applicable to Love Productions LLC, without regard to conflict-of-law
            principles. Before filing a formal claim, you and Love Productions LLC agree
            to make a good-faith effort to resolve the dispute by written notice, unless
            immediate relief is reasonably necessary or this requirement is prohibited by
            law. Nothing in these Terms prevents either party from using an available
            small-claims process or exercising a nonwaivable statutory right.
          </p>
        </section>

        <section>
          <h2>16. General terms</h2>
          <p>
            These Terms, the <Link href="/privacy">Privacy Policy</Link>, and any terms
            presented at purchase form the agreement relating to the site and services.
            If a provision is unenforceable, it will be limited to the minimum extent
            necessary and the remaining provisions will continue in effect. Our failure to
            enforce a provision is not a waiver. You may not assign these Terms without our
            written consent; we may assign them as part of a merger, reorganization, sale,
            or transfer of the relevant business.
          </p>
        </section>

        <section>
          <h2>17. Changes to these Terms</h2>
          <p>
            We may update these Terms to reflect changes in services, operations, or law.
            The revised version will be posted with a new effective date. We will provide
            additional notice of material changes when required by law. Changes will not
            retroactively alter a completed purchase unless permitted by law and clearly
            communicated.
          </p>
        </section>

        <section>
          <h2>18. Contact</h2>
          <p>
            Questions about these Terms may be sent to Love Productions LLC at
            <a href="mailto:dancingissogood@gmail.com"> dancingissogood@gmail.com</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
