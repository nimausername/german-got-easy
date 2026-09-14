# Deploy on Coolify

German Got Easy ships as a Docker Compose stack: PostgreSQL, the Fastify API, and the Next.js web app.

**Keycloak is not part of this stack.** Host it separately, then pass `KEYCLOAK_URL` and `KEYCLOAK_BACKEND_CLIENT_SECRET`. See [Keycloak](./keycloak.md).

## What Coolify should create

| Service | Internal port | Public | Notes |
| --- | --- | --- | --- |
| `postgres` | 5432 | No | Named volume `postgres-data`. Override with `DATABASE_URL` if you already have Postgres. |
| `backend` | 4000 | Yes | Runs `prisma migrate deploy`, content seed, then the API. |
| `frontend` | 3000 | Yes | Reads `API_URL` at container start and writes `/env.js` for the browser. |

Do not publish host `ports:`. Coolify Proxy routes HTTPS using each service's `SERVICE_URL_*` domain.

## Create the application

1. Deploy Keycloak on its own (Coolify service or anything else) and create the `german` realm + `german-backend` client described in [Keycloak](./keycloak.md).
2. In Coolify, open the project and environment, then **+ New**.
3. Connect this Git repository.
4. Set **Build Pack** to **Docker Compose**.
5. Set **Base Directory** to `/` and **Docker Compose Location** to `docker-compose.yml`.
6. Save, then set required environment variables:
   - `KEYCLOAK_URL` — public Keycloak origin, for example `https://auth.example.com`
   - `KEYCLOAK_BACKEND_CLIENT_SECRET` — confidential client secret
   - Optional: `KEYCLOAK_INTERNAL_URL` if the API cannot reach Keycloak via the public hostname
   - Optional: `DATABASE_URL` if you are not using the bundled Postgres
7. Confirm Coolify generated `SERVICE_USER_POSTGRES` / `SERVICE_PASSWORD_64_POSTGRES` (used when `DATABASE_URL` is unset).
8. Under each public service, set the domain **including the internal port**:
   - Frontend: `https://app.example.com:3000`
   - API: `https://api.example.com:4000`
9. Do **not** add your Keycloak hostname as a domain on this application.
10. Deploy. First boot runs migrations and word-bank seed before `/health` is ready.

Use subdomains of the same registrable domain (for example `app.example.com` and `api.example.com`) so `COOKIE_SAME_SITE=lax` works with credentialed API calls.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `KEYCLOAK_URL` | required | Public Keycloak origin (JWT issuer). |
| `KEYCLOAK_BACKEND_CLIENT_SECRET` | required | Confidential client secret. |
| `KEYCLOAK_INTERNAL_URL` | empty | In-network Keycloak origin for token/admin calls. |
| `KEYCLOAK_REALM` | `german` | Keycloak realm name. |
| `KEYCLOAK_BACKEND_CLIENT_ID` | `german-backend` | Confidential client ID. |
| `KEYCLOAK_BOOTSTRAP` | `false` | If `true`, create realm/client on an already running Keycloak (needs admin vars). |
| `DATABASE_URL` | bundled Postgres | Set this to use an existing database. |
| `CORS_ORIGIN` | frontend `SERVICE_URL` | Frontend origin, no trailing slash. |
| `COOKIE_SECURE` | `true` | Set `false` only if the site is served over HTTP. |
| `COOKIE_SAME_SITE` | `lax` | Set `none` only if the web app and API are on different sites. |
| `PRODUCT_NAME` | `German Got Easy` | Product label in API health and the web build. |
| `RUN_SEED` | `true` | Upserts lesson/word content after migrate. Safe to leave on. |

## After deploy

1. Open the frontend domain and register a user.
2. Confirm `GET https://api.example.com/health` returns `{ "data": { "status": "ok" } }`.
3. Back up the `postgres-data` volume unless you use an external database. Content seed is idempotent; learner progress is not.

## Same-server Keycloak

If Keycloak is another Coolify resource on the same machine:

1. Keep Keycloak on its own domain (for example `https://auth.example.com`).
2. Enable **Connect To Predefined Network** on both resources.
3. Set `KEYCLOAK_INTERNAL_URL` to `http://<keycloak-container-name>:8080`.
4. Keep `KEYCLOAK_URL` as the public origin so JWT `iss` verification succeeds.

## Local Compose smoke test

Coolify magic variables are empty on a laptop. Export throwaway values, then:

```bash
export SERVICE_USER_POSTGRES=german
export SERVICE_PASSWORD_64_POSTGRES=localpostgrespasswordlocalpostgrespassword
export SERVICE_URL_FRONTEND_3000=http://localhost:3000
export SERVICE_URL_BACKEND_4000=http://localhost:4000
export KEYCLOAK_URL=https://auth.example.com
export KEYCLOAK_BACKEND_CLIENT_SECRET=your-client-secret
export COOKIE_SECURE=false
docker compose up --build
```

Publish ports locally if you need them (`3000`, `4000`). Do not add `ports:` in the committed Compose file; Coolify would bypass its proxy.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Coolify blocks deploy until `KEYCLOAK_URL` is set | Expected. This stack does not ship Keycloak. |
| Domain shows **No Available Server** | Service is not healthy, or the domain is missing the internal port (`:3000`, `:4000`). |
| `Unexpected token authorized party` / issuer errors | `KEYCLOAK_URL` does not match the JWT `iss`. Use the public Keycloak URL and set `KEYCLOAK_INTERNAL_URL` for in-network calls. |
| Browser login works locally but cookies vanish on HTTPS | `COOKIE_SECURE` must be `true` behind TLS. Use `false` only on plain HTTP. |
| CORS / credentialed fetch fails | `CORS_ORIGIN` must be the frontend origin with no trailing slash. |
| API starts, auth 500s | Keycloak unreachable, wrong client secret, or missing direct-access / service-account roles. |
| Seed takes too long, healthcheck restarts the API | First deploy can exceed 2 minutes on a small VPS. Watch `backend` logs; increase the Compose `start_period` if needed. |
