# Deploy on Coolify

German Got Easy ships as a Docker Compose stack for Coolify: PostgreSQL, Keycloak, the Fastify API, and the Next.js web app.

## What Coolify should create

| Service | Internal port | Public | Notes |
| --- | --- | --- | --- |
| `postgres` | 5432 | No | Named volume `postgres-data`. Creates `german` and `keycloak` databases. |
| `keycloak` | 8080 | Yes | Realm `german` and confidential client `german-backend` are bootstrapped on API start. |
| `backend` | 4000 | Yes | Runs `prisma migrate deploy`, content seed, then the API. |
| `frontend` | 3000 | Yes | Reads `API_URL` at container start and writes `/env.js` for the browser. |

Do not publish host `ports:`. Coolify Proxy routes HTTPS using each service's `SERVICE_URL_*` domain.

## Create the application

1. In Coolify, open the project and environment, then **+ New**.
2. Connect this Git repository (GitHub app, deploy key, or public HTTPS URL).
3. Set **Build Pack** to **Docker Compose**.
4. Set **Base Directory** to `/` and **Docker Compose Location** to `docker-compose.yml`.
5. Save, then open **Environment Variables** and confirm Coolify generated:
   - `SERVICE_USER_POSTGRES` / `SERVICE_PASSWORD_64_POSTGRES`
   - `SERVICE_USER_KEYCLOAK` / `SERVICE_PASSWORD_64_KEYCLOAK`
   - `SERVICE_PASSWORD_64_KC_CLIENT`
   - `SERVICE_URL_FRONTEND_3000`, `SERVICE_URL_BACKEND_4000`, `SERVICE_URL_KEYCLOAK_8080`
6. Under each public service, set the domain **including the internal port**:
   - Frontend: `https://app.example.com:3000`
   - API: `https://api.example.com:4000`
   - Keycloak: `https://auth.example.com:8080`
7. Deploy. First boot is slow: Keycloak, migrations, and word-bank seed all run before `/health` is ready.

Use subdomains of the same registrable domain (for example `app.example.com` and `api.example.com`) so `COOKIE_SAME_SITE=lax` works with credentialed API calls.

## Generated secrets

Leave the `SERVICE_*` passwords as generated values. The API uses `SERVICE_PASSWORD_64_KC_CLIENT` as the Keycloak confidential client secret and re-applies it on every start while `KEYCLOAK_BOOTSTRAP=true`.

Optional overrides Coolify will pick up from the Compose file:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PRODUCT_NAME` | `German Got Easy` | Product label in API health and the web build. |
| `KEYCLOAK_REALM` | `german` | Keycloak realm name. |
| `KEYCLOAK_BACKEND_CLIENT_ID` | `german-backend` | Confidential client used for password and admin grants. |
| `COOKIE_SAME_SITE` | `lax` | Set `none` only if the web app and API are on different sites (`COOKIE_SECURE` stays true). |
| `RUN_SEED` | `true` | Upserts lesson/word content after migrate. Safe to leave on. |

## After deploy

1. Open the frontend domain and register a user.
2. Confirm `GET https://api.example.com/health` returns `{ "data": { "status": "ok" } }`.
3. Confirm Keycloak admin at `https://auth.example.com` with `SERVICE_USER_KEYCLOAK` / `SERVICE_PASSWORD_64_KEYCLOAK`.
4. Back up the `postgres-data` volume. Content seed is idempotent; learner progress is not.

## Using an external database or Keycloak

Point the stack at existing services instead of the bundled ones:

1. Set `DATABASE_URL` on `backend` to the external Postgres URL (and stop using the Compose `postgres` service if you remove it).
2. Set `KEYCLOAK_URL` to the public Keycloak origin (JWT `iss`).
3. Set `KEYCLOAK_INTERNAL_URL` to an in-network origin if the API should not hairpin through the public hostname.
4. Create realm `german` (or your `KEYCLOAK_REALM`) with confidential client `german-backend`:
   - Direct access grants enabled
   - Service account enabled
   - Service account roles on `realm-management`: `manage-users`, `view-users`, `query-users`
5. Set `KEYCLOAK_BOOTSTRAP=false` so the API does not try to create that realm.

If the API and Keycloak are in different Coolify resources, enable **Connect To Predefined Network** on both and use the full Coolify container name as `KEYCLOAK_INTERNAL_URL`.

## Local Compose smoke test

Coolify magic variables are empty on a laptop. Export throwaway values, then:

```bash
export SERVICE_USER_POSTGRES=german
export SERVICE_PASSWORD_64_POSTGRES=localpostgrespasswordlocalpostgrespassword
export SERVICE_USER_KEYCLOAK=admin
export SERVICE_PASSWORD_64_KEYCLOAK=localkeycloakpasswordlocalkeycloakpassword
export SERVICE_PASSWORD_64_KC_CLIENT=localclientsecretlocalclientsecretlocalc
export SERVICE_URL_FRONTEND_3000=http://localhost:3000
export SERVICE_URL_BACKEND_4000=http://localhost:4000
export SERVICE_URL_KEYCLOAK_8080=http://localhost:8080
export SERVICE_FQDN_KEYCLOAK_8080=localhost
export COOKIE_SECURE=false
docker compose up --build
```

Publish ports locally if you need them (`3000`, `4000`, `8080`). Do not add `ports:` in the committed Compose file; Coolify would bypass its proxy.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Domain shows **No Available Server** | Service is not healthy, or the domain is missing the internal port (`:3000`, `:4000`, `:8080`). |
| `Unexpected token authorized party` / issuer errors | `KEYCLOAK_URL` does not match `KC_HOSTNAME` / the `iss` claim. Use the public Keycloak URL and `KEYCLOAK_INTERNAL_URL=http://keycloak:8080`. |
| Browser login works locally but cookies vanish on HTTPS | `COOKIE_SECURE` must be `true` behind Coolify TLS. |
| CORS / credentialed fetch fails | `CORS_ORIGIN` must be the frontend origin with no trailing slash (Compose already maps `SERVICE_URL_FRONTEND_3000`). |
| API starts, auth 500s | Keycloak bootstrap still running or admin password mismatch. Check `backend` logs for `[keycloak]`. |
| Seed takes too long, healthcheck restarts the API | First deploy can exceed 2 minutes on a small VPS. Watch `backend` logs; increase the Compose `start_period` if needed. |
