import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Love Productions LLC collects, uses, and protects information for Dancing Is So Good.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <article className="legal-document">
        <header className="legal-heading">
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
          <p className="legal-effective-date">Effective and last updated July 16, 2026</p>
          <p>
            Love Productions LLC operates Dancing Is So Good. This Privacy Policy
            explains how we collect, use, disclose, and protect personal information
            when you use dancingissogood.com, create an account, purchase a pass,
            register for a class, or communicate with us.
          </p>
        </header>

        <section>
          <h2>1. Information we collect</h2>
          <h3>Information you provide</h3>
          <ul>
            <li>
              <strong>Account information:</strong> your email address, first and last
              name, verified phone number if provided, authentication identifier, and
              account role.
            </li>
            <li>
              <strong>Purchase information:</strong> the pass purchased, amount,
              currency, transaction status, purchase and validity dates, purchaser
              email, and identifiers associated with Stripe checkout, customer, and
              payment records.
            </li>
            <li>
              <strong>Class information:</strong> class reservations, attendance or
              cancellation status, and the pass used for a reservation when those
              features are available.
            </li>
            <li>
              <strong>Communications:</strong> your name, contact information, areas of
              interest, and anything else you include when requesting information or
              contacting us.
            </li>
          </ul>

          <h3>Payment information</h3>
          <p>
            Payments are processed through Stripe-hosted checkout. Stripe collects and
            processes your payment card and billing information. We receive transaction
            confirmations and related customer details, but we do not receive or store
            your full payment card number.
          </p>

          <h3>Information collected automatically</h3>
          <p>
            When you use the site, we and our infrastructure providers may automatically
            process technical information such as IP address, browser and device type,
            operating system, requested pages, timestamps, referring pages, and error or
            security events. We use this information to deliver, secure, maintain, and
            troubleshoot the service.
          </p>
        </section>

        <section>
          <h2>2. How we use information</h2>
          <p>We use personal information to:</p>
          <ul>
            <li>Create, authenticate, secure, and support user accounts.</li>
            <li>Process pass purchases and maintain accurate transaction records.</li>
            <li>Connect guest purchases to an account using a verified email address.</li>
            <li>Display account details, passes, schedules, and registrations.</li>
            <li>Administer classes and communicate schedule or service changes.</li>
            <li>Respond to questions, support requests, and requests for information.</li>
            <li>Detect fraud, abuse, security incidents, and technical failures.</li>
            <li>Comply with legal, tax, accounting, and contractual obligations.</li>
            <li>Establish, exercise, or defend legal claims and enforce our terms.</li>
          </ul>
        </section>

        <section>
          <h2>3. Cookies and similar technologies</h2>
          <p>
            The site uses cookies and similar browser storage required for account
            authentication, session continuity, security, and core site operation. Clerk
            uses these technologies to keep users signed in and protect account sessions.
            We do not currently use advertising cookies or cross-site behavioral
            advertising trackers. If our practices materially change, we will update this
            policy and provide any choices required by law.
          </p>
        </section>

        <section>
          <h2>4. How we disclose information</h2>
          <p>We may disclose personal information to the following recipients:</p>
          <ul>
            <li>
              <strong>Authentication providers.</strong> Clerk provides account and
              session management. If you choose Google sign-in, Google also processes
              authentication information according to your relationship with Google.
            </li>
            <li>
              <strong>Payment providers.</strong> Stripe processes checkout and payments
              and helps prevent fraudulent transactions.
            </li>
            <li>
              <strong>Infrastructure providers.</strong> Hosting, cloud computing,
              database, security, and operational providers process information to run
              and protect the site and services.
            </li>
            <li>
              <strong>Studios and instructors.</strong> We may provide information needed
              to administer a class, confirm eligibility, manage attendance, or address
              safety and operational needs.
            </li>
            <li>
              <strong>Professional advisers.</strong> Accountants, attorneys, insurers,
              and other advisers may receive information where reasonably necessary for
              their services.
            </li>
            <li>
              <strong>Authorities and other parties.</strong> We may disclose information
              when reasonably necessary to comply with law or legal process, protect
              rights and safety, investigate misconduct, or enforce an agreement.
            </li>
            <li>
              <strong>Business transaction recipients.</strong> Information may be
              transferred as part of a merger, financing, reorganization, sale of assets,
              or similar transaction, subject to applicable law.
            </li>
          </ul>
          <p>
            We do not sell personal information for money, and we do not share personal
            information for cross-context behavioral advertising.
          </p>
        </section>

        <section>
          <h2>5. Service providers</h2>
          <p>
            Our providers process information under their own terms and privacy notices
            where they act independently. You can review the privacy information for
            <a href="https://clerk.com/legal/privacy" rel="noreferrer" target="_blank"> Clerk</a>
            {" "}and the
            <a href="https://stripe.com/privacy" rel="noreferrer" target="_blank"> Stripe Privacy Policy</a>.
          </p>
        </section>

        <section>
          <h2>6. Data retention</h2>
          <p>
            We retain information only for as long as reasonably necessary for the
            purposes described in this policy. Account information is generally retained
            while an account remains active. Purchase, payment-event, and attendance
            records may be kept longer to satisfy tax, accounting, fraud-prevention,
            dispute-resolution, and legal requirements. When information is no longer
            required, we will delete, de-identify, or securely isolate it as appropriate.
          </p>
        </section>

        <section>
          <h2>7. Security</h2>
          <p>
            We use administrative, technical, and organizational safeguards designed to
            protect personal information, including managed authentication, access
            controls, encrypted network connections, restricted payment credentials, and
            verified payment webhooks. No method of transmission or storage is completely
            secure, so we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>8. Your choices and privacy rights</h2>
          <p>
            Depending on where you live, you may have rights to request access,
            correction, deletion, or a portable copy of personal information; to object
            to or restrict certain processing; or to appeal our response to a request.
            You may also update certain account details through the account or identity
            provider interface.
          </p>
          <p>
            To submit a privacy request, email
            <a href="mailto:dancingissogood@gmail.com"> dancingissogood@gmail.com</a>.
            We may need to verify your identity before completing a request. We will not
            discriminate against you for exercising a right provided by law. Some
            information may be retained where permitted or required by law.
          </p>
        </section>

        <section>
          <h2>9. Children&apos;s privacy</h2>
          <p>
            The website and online account services are not directed to children under
            13, and children under 13 should not create an account or provide personal
            information through the site. A parent or legal guardian should contact us
            directly before providing information about a child. If we learn that we
            collected personal information from a child in violation of applicable law,
            we will take appropriate steps to delete it.
          </p>
        </section>

        <section>
          <h2>10. External links</h2>
          <p>
            The site may link to participating studios and other third-party services.
            We do not control their privacy practices. Review their policies before
            providing personal information directly to them.
          </p>
        </section>

        <section>
          <h2>11. Changes to this policy</h2>
          <p>
            We may update this policy to reflect changes to our services, providers, or
            legal obligations. We will post the revised policy with a new effective date
            and provide additional notice when required by law.
          </p>
        </section>

        <section>
          <h2>12. Contact us</h2>
          <p>
            For privacy questions or requests, contact Love Productions LLC at
            <a href="mailto:dancingissogood@gmail.com"> dancingissogood@gmail.com</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
