# German Got Easy

Open-source platform to learn German: a CEFR **Learn** path (theme units with teach → practice lessons), a curated flashcard word bank (600 seeded lemmas; ~109 live at first boot, then **20 new words per UTC day** until the queue is empty), and spaced repetition.

Flashcards use spaced repetition plus German-specific prompts: recognition (DE→EN), production (EN→DE), article/gender, cloze, and plural. Learners pick a life topic (Food, Travel, Essentials…) to learn related words together, and can run a separate “review due” session across all topics. Failed cards requeue later in the same session.

## How it fits together

You host **PostgreSQL** and **Keycloak**. This repo runs the learning API and the web app.

```mermaid
flowchart LR
  browser[Browser] --> web[Next.js web]
  web -->|"same-origin /v1"| api[Fastify API]
  api --> db[PostgreSQL]
  api --> idp[Keycloak]
```

Learners open only the web origin. Next.js proxies `/v1` to the API, so login does not depend on a public API hostname, CORS, or a runtime `API_URL`.

## Documentation

Guides live in [`docs/`](./docs/README.md). Start there if you are self-hosting or changing auth.

| Guide | What it covers |
| --- | --- |
| [Docs index](./docs/README.md) | Map of every guide in this repository |
| [Self-host (Coolify / Docker Compose)](./docs/coolify.md) | Production deploy, env vars, domains, and first-boot |
| [Keycloak](./docs/keycloak.md) | Realm and confidential client this app expects |
| [Auth cookies and sessions](./docs/auth-cookies.md) | httpOnly session cookies and refresh flow |
| [Hosted legal pages](./docs/legal.md) | Privacy, Terms, Impressum for the hosted site |
| [Contributing](./CONTRIBUTING.md) | Local setup, PR guidelines, licenses |
| [Future plans](./docs/future-plans.md) | Backlog of features to add next |
| [Curriculum](./docs/curriculum.md) | Learn path pedagogy and A1 unit map |
| [Lesson authoring](./docs/lesson-authoring.md) | How to add teach → practice lesson JSON |
| [Vocabulary book](./docs/vocabulary-book.md) | What Vocabulary Book v1 shipped |
| [Placement](./docs/placement.md) | Short placement check |
| [Image attribution](./docs/image-attribution.md) | Free Commons images for concrete nouns |

Word drip env (optional): `WORD_DAILY_RELEASE_LIMIT` (default 20), `WORD_RELEASE_CRON_ENABLED` (default true). Manual unlock: `pnpm --dir backend word:release`.

## Stack

- **Web:** Next.js + TypeScript + Tailwind + shadcn/ReUI
- **API:** Fastify + Prisma + Zod
- **Database:** PostgreSQL you host
- **Auth:** Keycloak you host (in-app register/login forms; the app does not run Keycloak)

## Quick start (local)

Prerequisites: Node.js 20+, [pnpm](https://pnpm.io), PostgreSQL, and a Keycloak realm as in [Keycloak](./docs/keycloak.md).

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `KEYCLOAK_URL`, `KEYCLOAK_BACKEND_CLIENT_SECRET`, and `CORS_ORIGIN=http://localhost:3000`.
2. Install, migrate, and seed:

```bash
pnpm --dir backend install
pnpm --dir frontend install
pnpm --dir backend prisma:migrate
pnpm --dir backend prisma:seed
```

3. Run the API and the web app:

```bash
pnpm --dir backend dev
pnpm --dir frontend dev
```

- Web: http://localhost:3000
- API health: http://localhost:4000/health

The web app proxies `/v1` to `http://localhost:4000`. You do not need `frontend/.env.local` unless the API uses another origin.

To bundle Postgres in Docker instead of a local database (Keycloak still required):

```bash
export SERVICE_PASSWORD_64_POSTGRES=choose-a-long-password
export KEYCLOAK_URL=https://auth.example.com
export KEYCLOAK_BACKEND_CLIENT_SECRET=your-client-secret
export CORS_ORIGIN=http://localhost:3000
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up --build
```

## Self-hosting

Production uses the committed `docker-compose.yml` (API + web only). Coolify is the documented path: [Self-host (Coolify / Docker Compose)](./docs/coolify.md).

Required environment variables:

| Variable | Example |
| --- | --- |
| `DATABASE_URL` | `postgres://USER:PASSWORD@HOST:PORT/DATABASE` |
| `KEYCLOAK_URL` | `https://auth.example.com` |
| `KEYCLOAK_BACKEND_CLIENT_SECRET` | confidential client secret |
| `CORS_ORIGIN` | `https://app.example.com` (your public web origin, no trailing slash) |

Set `COOKIE_SECURE=true` when the site is HTTPS. Learners open the **web** domain; a public API domain is optional.

## License

- Application code: [MIT](./LICENSE)
- Lesson/word content under `backend/content/`: [CC BY 4.0](./LICENSE-CONTENT)
