import { LEGAL } from "@/lib/legal";

/**
 * Public branding assets under `/public/branding`.
 * Prefer these paths everywhere (metadata, manifest, UI) so the set stays in sync.
 */
export const BRANDING = {
  productName: LEGAL.productName,
  siteUrl: LEGAL.siteUrl,
  siteHost: LEGAL.siteHost,
  description:
    "Learn German with a clear path, daily flashcards, and progress that stays with you.",
  /** Full-resolution app mark (1000×1000). */
  icon: "/branding/icon.png",
  icon32: "/branding/icon-32.png",
  icon192: "/branding/icon-192.png",
  icon512: "/branding/icon-512.png",
  appleTouchIcon: "/branding/apple-touch-icon.png",
  /** Open Graph / Twitter share image (1200×630). */
  ogImage: "/branding/og-1.png",
  ogWidth: 1200,
  ogHeight: 630,
  manifest: "/branding/site.webmanifest",
} as const;
