# Contributing to German Got Easy

Thanks for helping improve this open-source German learning platform.

Project overview and self-hosting are in the root [README](./README.md). Operator and product guides live in [`docs/`](./docs/README.md).

## Development setup

1. Copy `.env.example` to `.env` and set **external** PostgreSQL and Keycloak values (`DATABASE_URL`, `KEYCLOAK_URL`, `KEYCLOAK_BACKEND_CLIENT_SECRET`, `CORS_ORIGIN=http://localhost:3000`). This app does not run those services. See [Keycloak](./docs/keycloak.md).
2. You do not need `frontend/.env.local` when the API is `http://localhost:4000`.
3. Install and migrate:

```bash
pnpm --dir backend install
pnpm --dir frontend install
pnpm --dir backend prisma:migrate
pnpm --dir backend prisma:seed
```

4. Run:

```bash
pnpm --dir backend dev
pnpm --dir frontend dev
```

Web: http://localhost:3000. The Next.js app proxies `/v1` to the API.

## Guidelines

- Keep API contracts resource-oriented REST + JSON with camelCase fields.
- Do not commit secrets (`.env`, Keycloak client secrets, database URLs with passwords).
- Prefer small, focused PRs with a clear description of why the change exists.
- For backend logic, add or update focused tests when behavior is high risk (for example scheduling).
- Lesson/word content lives under `backend/content/` (CC BY 4.0). Application code is MIT.
- Product backlog lives in [`docs/future-plans.md`](./docs/future-plans.md). Update that doc when you ship or reprioritize work.

## Pull requests

1. Fork the repo (or use a branch if you have write access).
2. Make your change.
3. Open a PR describing the problem, the solution, and how you tested it.
