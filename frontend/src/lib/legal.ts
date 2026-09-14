/**
 * Public legal and contact details for the hosted German Got Easy service.
 * Self-hosted deployments of the open-source code are separate controllers.
 */
export const LEGAL = {
  productName: "German Got Easy",
  siteHost: "german.nimakhabbazi.de",
  siteUrl: "https://german.nimakhabbazi.de",
  controllerName: "Nima Khabbazi",
  /** Town only until a full street address is added for Impressum completeness. */
  locality: "Rielasingen-Worblingen",
  country: "Germany",
  /** Replace with street and house number before relying on this as a complete Impressum. */
  streetLine: "[Street and house number]",
  postalCode: "78239",
  contactEmail: "iam@nimakhabbazi.de",
  hostingProvider: "Hetzner Online GmbH (Germany)",
  orchestration: "Coolify on a private Hetzner server",
  effectiveDate: "14 September 2026",
  governingLaw: "laws of the Federal Republic of Germany",
} as const;

/**
 * Shared nav targets for privacy, terms, and imprint pages.
 */
export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/impressum", label: "Impressum" },
] as const;
