import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Impressum · ${LEGAL.productName}`,
  description: `Legal disclosure (Impressum) for ${LEGAL.productName}.`,
};

/**
 * German-style imprint for the hosted service.
 */
export default function ImpressumPage() {
  return (
    <LegalShell
      title="Impressum"
      description="Legal disclosure for the hosted German Got Easy service (Angaben gemäß § 5 DDG)."
    >
      <LegalSection id="provider" title="Service provider">
        <p>
          <strong>{LEGAL.controllerName}</strong>
          <br />
          {LEGAL.streetLine}
          <br />
          {LEGAL.postalCode} {LEGAL.locality}
          <br />
          {LEGAL.country}
        </p>
        <p>
          Email:{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
          <br />
          Website:{" "}
          <a href={LEGAL.siteUrl} rel="noopener noreferrer">
            {LEGAL.siteUrl}
          </a>
        </p>
        <p>
          This service is operated by a private individual, not a registered company.{" "}
          {LEGAL.productName} is the product name of the learning project and is not a registered
          trademark of a commercial entity.
        </p>
        <p>
          <strong>Note:</strong> Replace{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
            {LEGAL.streetLine}
          </code>{" "}
          in the site configuration with your full street address before treating this Impressum as
          complete under German disclosure rules.
        </p>
      </LegalSection>

      <LegalSection id="responsible" title="Responsible for content">
        <p>
          Responsible for journalistic/editorial content on this website (where applicable):{" "}
          {LEGAL.controllerName}, address as above.
        </p>
      </LegalSection>

      <LegalSection id="hosting" title="Hosting">
        <p>
          The application is hosted on a private server in Germany provided by{" "}
          {LEGAL.hostingProvider}, managed with Coolify. Database and identity (Keycloak) run in the
          same environment.
        </p>
      </LegalSection>

      <LegalSection id="dispute" title="Online dispute resolution">
        <p>
          The European Commission provides a platform for online dispute resolution (ODR):{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            rel="noopener noreferrer"
            target="_blank"
          >
            https://ec.europa.eu/consumers/odr
          </a>
          . The operator is not obliged and not willing to participate in dispute resolution
          proceedings before a consumer arbitration board.
        </p>
      </LegalSection>

      <LegalSection id="liability-content" title="Liability for content">
        <p>
          As a service provider, the operator is responsible for own content on these pages under
          general laws. Obligations to remove or block use of information under general laws remain
          unaffected.
        </p>
      </LegalSection>

      <LegalSection id="liability-links" title="Liability for links">
        <p>
          Outbound links to external websites are outside the operator&apos;s control. The respective
          provider is responsible for linked content. Linked pages are checked for illegal content at
          the time of linking; permanent control without concrete indications of a violation is not
          reasonable.
        </p>
      </LegalSection>

      <LegalSection id="copyright" title="Copyright">
        <p>
          Content created by the operator on these pages is subject to German copyright law unless
          otherwise stated (including open-source licensing for the project code). Reproduction or
          distribution outside statutory exceptions requires permission from the rights holder.
        </p>
      </LegalSection>

      <LegalSection id="privacy-link" title="Privacy">
        <p>
          Details on personal data: <Link href="/privacy">Privacy Policy</Link>. Service rules:{" "}
          <Link href="/terms">Terms of Use</Link>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
