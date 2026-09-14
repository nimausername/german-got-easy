import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy · ${LEGAL.productName}`,
  description: `How ${LEGAL.productName} collects and uses personal data on the hosted service.`,
};

/**
 * Privacy notice for the hosted German Got Easy instance.
 */
export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      description={`How ${LEGAL.productName} handles personal data on ${LEGAL.siteHost}.`}
    >
      <LegalSection id="who" title="1. Who is responsible">
        <p>
          The controller for personal data processed on the hosted service at{" "}
          <strong>{LEGAL.siteHost}</strong> is:
        </p>
        <p>
          <strong>{LEGAL.controllerName}</strong>
          <br />
          {LEGAL.streetLine}
          <br />
          {LEGAL.postalCode} {LEGAL.locality}
          <br />
          {LEGAL.country}
          <br />
          Email:{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
        </p>
        <p>
          {LEGAL.productName} is provided by {LEGAL.controllerName} as an individual developer. It is
          not a registered company or trademark. Costs of hosting are paid privately. The open-source
          codebase may be self-hosted by others; those operators are controllers for their own
          deployments and this notice does not apply to them.
        </p>
      </LegalSection>

      <LegalSection id="scope" title="2. Scope">
        <p>
          This notice applies only to the hosted learning service at {LEGAL.siteUrl}. It covers
          account registration, authentication, and learning features on that service.
        </p>
      </LegalSection>

      <LegalSection id="data" title="3. What data we process">
        <p>Depending on how you use the service, we may process:</p>
        <ul>
          <li>
            <strong>Account data:</strong> email address, username (optional), display name, and
            authentication identifiers linked to Keycloak.
          </li>
          <li>
            <strong>Credentials:</strong> passwords are handled by Keycloak on the same private
            server. The learning app does not store plaintext passwords.
          </li>
          <li>
            <strong>Learning data:</strong> lesson, unit, and level progress; flashcard / spaced
            repetition state; exam or placement attempts and related scores or answers needed to
            operate the product.
          </li>
          <li>
            <strong>Preferences:</strong> such as target CEFR level and native language defaults used
            by the product.
          </li>
          <li>
            <strong>Technical data:</strong> necessary session cookies and ordinary server logs that
            may include IP address, timestamps, and request metadata for security and reliability.
          </li>
        </ul>
        <p>We do not intentionally collect special categories of data (for example health data).</p>
      </LegalSection>

      <LegalSection id="purposes" title="4. Why we process data">
        <p>We process personal data only to:</p>
        <ul>
          <li>create and secure your account;</li>
          <li>provide the learning product (progress, flashcards, lessons, related features);</li>
          <li>maintain, troubleshoot, and protect the service;</li>
          <li>
            improve product functions over time (including future habit- or study-pattern features
            that help you learn), still within this learning service.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> sell personal data. We do <strong>not</strong> use personal data
          for third-party advertising. We do <strong>not</strong> rent or trade your account or
          learning data with marketing partners.
        </p>
      </LegalSection>

      <LegalSection id="legal-bases" title="5. Legal bases (GDPR)">
        <p>Where the GDPR applies, processing is based on:</p>
        <ul>
          <li>
            <strong>Article 6(1)(b)</strong> — performance of a contract / steps to provide the
            service you request (account and learning features);
          </li>
          <li>
            <strong>Article 6(1)(f)</strong> — legitimate interests in securing and operating a
            reliable service (for example logs and abuse prevention), balanced against your rights;
          </li>
          <li>
            <strong>Article 6(1)(a)</strong> — consent, only if we later ask for optional processing
            that needs it (we will explain clearly at that time).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies" title="6. Cookies">
        <p>The hosted service currently sets only authentication cookies:</p>
        <ul>
          <li>
            <strong>gge_access</strong> — httpOnly session cookie for API access;
          </li>
          <li>
            <strong>gge_refresh</strong> — httpOnly refresh cookie limited to authentication routes.
          </li>
        </ul>
        <p>
          These cookies are strictly necessary to keep you signed in. There is no advertising or
          analytics cookie layer in the application today. If that changes, this notice will be
          updated.
        </p>
      </LegalSection>

      <LegalSection id="processors" title="7. Hosting and processors">
        <p>
          Infrastructure runs in <strong>Germany</strong> on a private server at{" "}
          {LEGAL.hostingProvider}, orchestrated with {LEGAL.orchestration}. PostgreSQL and Keycloak
          run in that same environment under the operator&apos;s control.
        </p>
        <p>
          Hetzner provides server hosting. The operator configures and controls the application,
          database, and identity software on that server. Data is not intentionally transferred to
          advertising networks.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="8. Sharing">
        <p>
          We do not sell your data. We share data only when needed to run the service (for example
          with the hosting provider as infrastructure), when required by law, or when needed to
          protect the service or users against abuse or security threats.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="9. Retention and deletion">
        <p>
          We keep account and learning data while your account remains active so the product can
          work. An in-app account deletion feature is planned; until it ships, you may request
          deletion by emailing{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. After a verified
          deletion request (or once self-service deletion is available), account and associated
          learning data on the live systems will be removed.
        </p>
        <p>
          There is currently no separate backup system. If backups are introduced later, this notice
          will describe retention for those copies.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="10. Your rights">
        <p>If GDPR applies to you, you may have the right to:</p>
        <ul>
          <li>access your personal data;</li>
          <li>rectify inaccurate data;</li>
          <li>erase data (subject to legal limits);</li>
          <li>restrict or object to certain processing;</li>
          <li>data portability for data you provided;</li>
          <li>lodge a complaint with a supervisory authority (in Germany, typically a Landesdatenschutzbehörde).</li>
        </ul>
        <p>
          Contact <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> to exercise these
          rights. See also the{" "}
          <Link href="/impressum">Impressum</Link> and <Link href="/terms">Terms of Use</Link>.
        </p>
      </LegalSection>

      <LegalSection id="minors" title="11. Younger users">
        <p>
          The service is written in English and offered to people who can read and understand it.
          There is no automated age gate. If you are a parent or guardian and believe a child has
          provided personal data without appropriate permission under applicable law, contact{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> so the account can be
          reviewed and removed where required.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes">
        <p>
          This notice may be updated when the product, hosting, or legal requirements change. The
          &quot;Last updated&quot; date at the top of this page will change when that happens.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
