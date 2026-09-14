# Frontend

Next.js web app for German Got Easy. Learners open this origin; the app proxies `/v1` to the Fastify API.

Setup, env vars, and deploy are in the repository root:

- [README](../README.md) — overview and local quick start
- [Docs index](../docs/README.md) — self-host, Keycloak, and product guides
- [Contributing](../CONTRIBUTING.md) — `pnpm` workflow

```bash
pnpm --dir frontend install
pnpm --dir frontend dev
```

The default proxy target is `http://localhost:4000`. Copy `.env.example` to `.env.local` only if the API uses another origin.
