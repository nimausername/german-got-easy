import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms for using the hosted ${LEGAL.productName} learning service.`,
};

/**
 * Terms of use for the hosted German Got Easy instance.
 */
export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Use"
      description={`Rules for using the hosted ${LEGAL.productName} service at ${LEGAL.siteHost}.`}
    >
      <LegalSection id="agreement" title="1. Agreement">
        <p>
          By creating an account or using {LEGAL.productName} at{" "}
          <strong>{LEGAL.siteUrl}</strong>, you agree to these Terms and the{" "}
          <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the hosted
          service.
        </p>
        <p>
          The service is operated by <strong>{LEGAL.controllerName}</strong>, an individual
          developer in {LEGAL.country}. {LEGAL.productName} is not a registered company or trademark
          name in the sense of a commercial brand registration; it is the product name of this
          learning project.
        </p>
      </LegalSection>

      <LegalSection id="service" title="2. The service">
        <p>
          {LEGAL.productName} is a free learning platform for German. On the hosted service you may
          use, among other things:
        </p>
        <ul>
          <li>a CEFR Learn path with teach blocks and practice exercises (currently A1-focused);</li>
          <li>lesson audio (pre-generated speech files and/or browser speech synthesis fallback);</li>
          <li>a curated vocabulary book with gradual daily unlocks of new words;</li>
          <li>topic and due flashcards with spaced repetition;</li>
          <li>a short placement check to suggest a starting level;</li>
          <li>dashboard and progress views tied to your account.</li>
        </ul>
        <p>
          The service is provided from the operator&apos;s own resources. Features may change, pause,
          or stop at any time.
        </p>
        <p>
          The project is also published as open-source software (
          <a href={LEGAL.githubUrl} rel="noopener noreferrer" target="_blank">
            GitHub
          </a>
          ). Running your own copy is separate from this hosted service and is not covered by these
          Terms.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="3. Who may use it">
        <p>
          The interface and content assume you can <strong>read and understand English</strong> well
          enough to use the product safely (including these Terms and the Privacy Policy).
        </p>
        <p>
          There is no automated age check. If you are below the digital-consent age in your country
          (often 16 in the EU), a parent or guardian should review these Terms and the Privacy Policy
          and supervise use of the service. Do not register if applicable law does not allow you to
          do so.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="4. Accounts">
        <p>
          You must provide accurate registration information and keep your password confidential.
          You are responsible for activity under your account. Contact{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> if you believe your
          account was compromised.
        </p>
        <p>
          Account deletion will be available in the product. Until then, email{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> to request deletion of
          your hosted account and associated learning data.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="5. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>break the law using the service;</li>
          <li>attempt unauthorized access to accounts, systems, or data;</li>
          <li>abuse, overload, or disrupt the service;</li>
          <li>misrepresent your identity in a harmful way;</li>
          <li>use the service to harm other users or the operator.</li>
        </ul>
        <p>The operator may suspend or delete accounts that violate these Terms.</p>
      </LegalSection>

      <LegalSection id="content" title="6. Learning content and progress">
        <p>
          Lesson and vocabulary content is provided for personal learning. It is not a substitute for
          official exams, accredited courses, or professional advice. Progress, placement
          suggestions, and scores are informational.
        </p>
        <p>
          Lesson and wordbank materials under the project&apos;s content directories are typically
          offered under Creative Commons Attribution (see the repository&apos;s content license).
          Some media (for example Wikimedia Commons images or CDN-hosted audio) remain subject to
          their own licenses and attribution requirements shown in the product or docs.
        </p>
        <p>
          You retain rights to content you submit (if any). You grant the operator a limited license
          to host and process that content as needed to run the service.
        </p>
      </LegalSection>

      <LegalSection id="no-sale" title="7. No sale of your data">
        <p>
          The hosted service is not a commercial data product. The operator does not sell your
          personal data and does not run third-party advertising against your account data. See the{" "}
          <Link href="/privacy">Privacy Policy</Link> for processing details.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="8. Availability and changes">
        <p>
          The service is offered &quot;as is&quot; and &quot;as available.&quot; There is no guarantee
          of uninterrupted uptime, perfect accuracy of content, or permanent availability. The
          operator may modify or discontinue features without liability to the extent permitted by
          law.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="9. Liability">
        <p>
          To the maximum extent permitted by applicable law, the operator is not liable for indirect,
          incidental, or consequential damages arising from use of the service. Mandatory consumer
          rights and liability for intent or gross negligence under German law remain unaffected
          where they cannot be waived.
        </p>
      </LegalSection>

      <LegalSection id="law" title="10. Governing law">
        <p>
          These Terms are governed by the {LEGAL.governingLaw}, excluding conflict-of-law rules.
          Mandatory consumer protections in your country of residence may also apply.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <p>
          Questions about these Terms:{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. Operator details are in
          the <Link href="/impressum">Impressum</Link>.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes to these Terms">
        <p>
          Updated Terms will be posted on this page with a new &quot;Last updated&quot; date.
          Continued use of the hosted service after changes means you accept the updated Terms,
          unless applicable law requires a different process.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
