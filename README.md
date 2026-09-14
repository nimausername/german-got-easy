# German Got Easy

Open-source platform to learn German: CEFR lesson path, ~4000-word flashcards with example sentences, and spaced repetition.

Flashcards use spaced repetition plus German-specific prompts: recognition (DE→EN), production (EN→DE), article/gender, cloze, and plural. Learners pick a life topic (Food, Travel, Essentials…) to learn related words together, and can run a separate “review due” session across all topics so memory stays healthy. Failed cards requeue later in the same session.

## Stack

- **Frontend:** Next.js + TypeScript + Tailwind + shadcn/ReUI
- **Backend:** Fastify + Prisma + Zod
- **Database:** PostgreSQL you host yourself
- **Auth:** Keycloak you host yourself (in-app register/login forms via the API)

## Quick start

1. Copy `.env.example` to `.env` and fill values (or use your existing `.env`).
2. Install and migrate:

```bash
pnpm --dir backend install
pnpm --dir frontend install
pnpm --dir backend prisma:migrate
pnpm --dir backend prisma:seed
```

3. Run API and web:

```bash
pnpm --dir backend dev
pnpm --dir frontend dev
```

- API: `http://localhost:4000`
- Web: `http://localhost:3000`

### Coolify

Production deploy uses Docker Compose. See [Deploy on Coolify](./docs/coolify.md).

### Working local loop

1. Open `http://localhost:3000`
2. Register or log in with Keycloak-backed forms (test user `learner1` if seeded in Keycloak)
3. Dashboard → Continue lesson / Study flashcards / Placement


## Keycloak

This app does not start or bundle Keycloak. You host a realm and point the API at it.

See [Keycloak](./docs/keycloak.md) for the required `german-backend` client (confidential, direct access grants, service account with `manage-users` / `view-users` / `query-users`). Never put the client secret in the frontend.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Docs

- [Docs index](./docs/README.md)
- [Keycloak](./docs/keycloak.md) — external IdP setup (this app does not run Keycloak)
- [Future plans](./docs/future-plans.md) — categorized backlog of features to add next
- [Vocabulary book](./docs/vocabulary-book.md) — what Vocabulary Book v1 shipped
- [Image attribution](./docs/image-attribution.md) — free Commons images for concrete nouns

## License

- Application code: [MIT](./LICENSE)
- Lesson/word content under `backend/content/`: [CC BY 4.0](./LICENSE-CONTENT)
