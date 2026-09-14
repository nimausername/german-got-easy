import type { Metadata } from "next";
import Link from "next/link";
import { CookieInventoryTable } from "@/components/cookie-inventory-table";
import { LegalSection, LegalShell } from "@/components/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
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
          account registration, authentication, and learning features on that service, including the
          CEFR Learn path, vocabulary book, flashcards, placement check, and related progress tools.
        </p>
      </LegalSection>

      <LegalSection id="data" title="3. What data we process">
        <p>Depending on how you use the service, we may process:</p>
        <ul>
          <li>
            <strong>Account data:</strong> email address, username (optional), display name, first
            and last name collected at registration, and authentication identifiers linked to
            Keycloak.
          </li>
          <li>
            <strong>Credentials:</strong> passwords are handled by Keycloak on{" "}
            <strong>{LEGAL.identityHost}</strong>. The learning app does not store plaintext
            passwords.
          </li>
          <li>
            <strong>Learning data:</strong> lesson, unit, and level progress; teach/practice
            completions; flashcard / spaced-repetition state; vocabulary lookup and study progress;
            placement or sample exam attempts and related scores or answers needed to operate the
            product.
          </li>
          <li>
            <strong>Preferences:</strong> such as target CEFR level and native language defaults used
            by the product.
          </li>
          <li>
            <strong>Device preference (local only):</strong> light/dark/system theme is stored in
            your browser&apos;s <strong>localStorage</strong> (key <code>theme</code>). It is not a
            cookie and is not sent to our servers as part of authentication.
          </li>
          <li>
            <strong>Technical data:</strong> necessary session cookies and ordinary server logs that
            may include IP address, timestamps, and request metadata for security and reliability.
            When you play lesson audio from the CDN, standard web-server or CDN access logs may
            record the request (for example IP, user agent, and URL) on that infrastructure.
          </li>
        </ul>
        <p>We do not intentionally collect special categories of data (for example health data).</p>
      </LegalSection>

      <LegalSection id="purposes" title="4. Why we process data">
        <p>We process personal data only to:</p>
        <ul>
          <li>create and secure your account;</li>
          <li>
            provide the learning product — CEFR lessons (teach → practice), vocabulary book with
            daily unlocks, flashcards / spaced repetition, placement suggestions, and dashboard
            progress;
          </li>
          <li>serve lesson audio and curated vocabulary media required by those features;</li>
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
        <p>
          The hosted learning site currently sets only the authentication cookies below. They are
          strictly necessary to keep you signed in. Because they are necessary for the service to
          work, we do not show a cookie-consent popup. There is no advertising or analytics cookie
          layer in the application today. If that changes, this notice will be updated and optional
          cookies will only run after consent.
        </p>
        <div className="not-prose rounded-lg border border-border/70 bg-background text-foreground">
          <CookieInventoryTable />
        </div>
        <p>
          All listed cookies are set by the learning API on this site. There are no advertising or
          analytics cookies.
        </p>
        <p>
          Cookies are set by the API and forwarded through the same-origin <code>/v1</code> proxy.
          Access tokens are never exposed to JavaScript. Theme preference uses{" "}
          <strong>localStorage</strong>, not cookies.
        </p>
        <p>
          Identity software (Keycloak) runs on a separate host (
          <strong>{LEGAL.identityHost}</strong>). In-app register and login talk to Keycloak from the
          server; learners do not receive Keycloak login cookies on {LEGAL.siteHost}.
        </p>
      </LegalSection>

      <LegalSection id="processors" title="7. Hosting and processors">
        <p>
          Infrastructure for the learning app and database runs in <strong>Germany</strong> on a
          private server at {LEGAL.hostingProvider}, orchestrated with {LEGAL.orchestration}.
          PostgreSQL and Keycloak (identity) run under the operator&apos;s control in that
          environment or as separately hosted components the operator configures.
        </p>
        <p>
          Pre-generated lesson audio (MP3) is published to an object-storage / CDN origin at{" "}
          <strong>{LEGAL.audioCdnHost}</strong> (Cloudflare R2 with a custom domain). The browser may
          request those files directly when you use Listen / Play audio in lessons. Image URLs for a
          small set of concrete vocabulary nouns may point to Wikimedia Commons or similar public
          media hosts; those hosts process ordinary download requests under their own terms.
        </p>
        <p>
          Hetzner provides server hosting. Cloudflare provides the audio CDN. The operator configures
          and controls the application, database, and identity software. Data is not intentionally
          transferred to advertising networks.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="8. Sharing">
        <p>
          We do not sell your data. We share data only when needed to run the service (for example
          with the hosting or CDN provider as infrastructure), when required by law, or when needed
          to protect the service or users against abuse or security threats.
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
          <li>
            lodge a complaint with a supervisory authority (in Germany, typically a
            Landesdatenschutzbehörde).
          </li>
        </ul>
        <p>
          Contact <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> to exercise these
          rights. See also the <Link href="/impressum">Impressum</Link> and{" "}
          <Link href="/terms">Terms of Use</Link>.
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
