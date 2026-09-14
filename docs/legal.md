# Hosted legal pages

Public pages for the **hosted** instance at `german.nimakhabbazi.de`. Self-hosted operators must publish their own notices.

## Pages

| Path | Purpose |
| --- | --- |
| `/privacy` | Privacy Policy (controller, data categories, processors, cookie table) |
| `/terms` | Terms of Use |
| `/impressum` | German Impressum (§ 5 DDG style disclosure) |

Shared copy and cookie inventory live in `frontend/src/lib/legal.ts` (`LEGAL`, `AUTH_COOKIES`, `LEGAL_LINKS`).

Brand favicon, Apple touch icon, PWA icons, and the social Open Graph image live under `frontend/public/branding/`. Paths and metadata defaults are centralized in `frontend/src/lib/branding.ts` and applied from `frontend/src/app/layout.tsx`.

## Product features covered

The legal pages describe the shipped learning product:

- Account register/login via Keycloak (server-side)
- CEFR Learn path (teach → practice) and lesson audio CDN
- Vocabulary book with daily unlocks and optional Commons images
- Flashcards / spaced repetition
- Placement check and dashboard progress
- Strictly necessary auth cookies only (`gge_access`, `gge_refresh`)

Public surfaces (home, login, register) show a non-blocking footer line: necessary session cookies only, linking to `/privacy#cookies`. There is no consent popup while cookies remain strictly necessary.

## Operator checklist

1. Replace `LEGAL.streetLine` with a complete postal address before treating the Impressum as complete.
2. Keep `AUTH_COOKIES` aligned with `backend/src/lib/cookies.ts`.
3. Update `LEGAL.audioCdnHost` / `LEGAL.identityHost` if those public hostnames change.
4. These pages are informational templates, not legal advice.

## Key code

| Area | Location |
| --- | --- |
| Constants | `frontend/src/lib/legal.ts` |
| Branding assets / OG | `frontend/public/branding/`, `frontend/src/lib/branding.ts` |
| Layout | `frontend/src/components/legal-shell.tsx` |
| Cookie table | `frontend/src/components/cookie-inventory-table.tsx` |
| Footer links | `frontend/src/components/legal-footer-links.tsx` |
