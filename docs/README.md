# Docs

Guides for running, deploying, and extending **German Got Easy**.

This app is the learning API and the web UI. You host **PostgreSQL** and **Keycloak** separately. The browser talks only to the web origin; Next.js proxies `/v1` to the API.

| Guide | Audience | What it covers |
| --- | --- | --- |
| [Self-host (Coolify / Docker Compose)](./coolify.md) | Operators | Production compose stack, env vars, domains, first boot, troubleshooting |
| [Keycloak](./keycloak.md) | Operators | Realm and `german-backend` client. This app does not run Keycloak |
| [Auth cookies and sessions](./auth-cookies.md) | Operators / contributors | `gge_access` / `gge_refresh`, refresh flow, env flags |
| [Hosted legal pages](./legal.md) | Operators | Privacy, Terms, Impressum, cookie inventory source of truth |
| [Contributing](../CONTRIBUTING.md) | Contributors | Local `pnpm` setup, PR guidelines, licenses |
| [Future plans](./future-plans.md) | Contributors | Backlog of features to add later, with scope notes |
| [Curriculum](./curriculum.md) | Contributors | Learn path pedagogy: CEFR units, teach → practice, skill tags, A1 map |
| [Lesson authoring](./lesson-authoring.md) | Contributors | JSON shapes for units, teach blocks, exercises, and lesson audio |
| [Vocabulary book](./vocabulary-book.md) | Contributors | Vocabulary Book v1, daily drip, images, plural examples |
| [Placement](./placement.md) | Contributors | Short placement check API and UI |
| [Image attribution](./image-attribution.md) | Contributors | Free Wikimedia Commons images for concrete nouns |

The root [README](../README.md) is the project overview and local quick start.

When you finish a planned item, move it to **Shipped** in [future-plans.md](./future-plans.md) (or delete it) and update related docs so the roadmap stays honest.
