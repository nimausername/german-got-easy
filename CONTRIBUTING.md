# Contributing to German Got Easy

Thanks for helping improve this open-source German learning platform.

## Development setup

1. Copy `.env.example` to `.env` and fill in PostgreSQL plus your **external** Keycloak values. This app does not run Keycloak.
2. Copy `frontend/.env.example` to `frontend/.env.local` if you only need public frontend vars.
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

## Guidelines

- Keep API contracts resource-oriented REST + JSON with camelCase fields.
- Do not commit secrets (`.env`, Keycloak client secrets, database URLs with passwords).
- Prefer small, focused PRs with a clear description of why the change exists.
- For backend logic, add or update focused tests when behavior is high risk (for example scheduling).
- Lesson/word content lives under `backend/content/` (CC BY 4.0). Application code is MIT.
- Product backlog and deferred features live in [`docs/future-plans.md`](./docs/future-plans.md). Update that doc when you ship or reprioritize work.

## Pull requests

1. Fork the repo (or use a branch if you have write access).
2. Make your change.
3. Open a PR describing the problem, the solution, and how you tested it.
