/**
 * Public legal and contact details for the hosted German Got Easy service.
 * Self-hosted deployments of the open-source code are separate controllers.
 */
export const LEGAL = {
  productName: "German Got Easy",
  siteHost: "german.nimakhabbazi.de",
  siteUrl: "https://german.nimakhabbazi.de",
  controllerName: "Nima Khabbazi",
  /** Public GitHub repository for this open-source project. */
  githubUrl: "https://github.com/nimausername/german-got-easy",
  /** Town only until a full street address is added for Impressum completeness. */
  locality: "Rielasingen-Worblingen",
  country: "Germany",
  /** Replace with street and house number before relying on this as a complete Impressum. */
  streetLine: "Singener Straße",
  postalCode: "78239",
  contactEmail: "iam@nimakhabbazi.de",
  hostingProvider: "Hetzner Online GmbH (Germany)",
  orchestration: "Coolify on a private Hetzner server",
  /** Public CDN origin for pre-generated lesson MP3s (Cloudflare R2 custom domain). */
  audioCdnHost: "germanaudio.nimakhabbazi.de",
  audioCdnUrl: "https://germanaudio.nimakhabbazi.de",
  identityHost: "auth.nimakhabbazi.de",
  effectiveDate: "14 September 2026",
  governingLaw: "laws of the Federal Republic of Germany",
} as const;

/**
 * Cookie inventory shown on the Privacy Policy. Keep in sync with
 * `backend/src/lib/cookies.ts`.
 */
export const AUTH_COOKIES = [
  {
    name: "gge_access",
    purpose: "httpOnly access token so the API can authenticate your session",
    category: "Strictly necessary",
    duration: "Matches the Keycloak access-token lifetime (typically a few minutes)",
    path: "/",
    flags: "httpOnly; Secure on HTTPS; SameSite=Lax (default)",
  },
  {
    name: "gge_refresh",
    purpose: "httpOnly refresh token used only to renew the access cookie",
    category: "Strictly necessary",
    duration:
      "Matches the Keycloak refresh-token lifetime (fallback max about 30 days)",
    path: "/v1/auth",
    flags: "httpOnly; Secure on HTTPS; SameSite=Lax (default)",
  },
] as const;

/**
 * Shared nav targets for privacy, terms, and imprint pages.
 */
export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/impressum", label: "Impressum" },
] as const;
