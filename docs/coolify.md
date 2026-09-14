# Deploy on Coolify

German Got Easy ships as a Docker Compose stack: the Fastify API and the Next.js web app.

**Postgres and Keycloak are not part of this stack.** Create them as separate Coolify resources (or use servers you already have), then pass connection settings into this app.

## What Coolify should create

| Service | Internal port | Public | Notes |
| --- | --- | --- | --- |
| `backend` | 4000 | Yes | Runs `prisma migrate deploy`, content seed, then the API. First seed can take several minutes. |
| `frontend` | 3000 | Yes | Reads `API_URL` at container start and writes `/env.js` for the browser. |

Do not publish host `ports:`. Coolify Proxy routes using each service's domain.

## Create the application

1. Have Postgres and Keycloak running. Keycloak realm/client setup is in [Keycloak](./keycloak.md).
2. In Coolify, open the project and environment, then **+ New**.
3. Connect this Git repository.
4. Set **Build Pack** to **Docker Compose**.
5. Set **Base Directory** to `/` and **Docker Compose Location** to `docker-compose.yml`.
6. Save, then set **required** environment variables (Coolify will highlight empty ones):

   | Variable | Example |
   | --- | --- |
   | `DATABASE_URL` | `postgres://USER:PASSWORD@HOST:PORT/DATABASE` |
   | `KEYCLOAK_URL` | `https://auth.example.com` |
   | `KEYCLOAK_BACKEND_CLIENT_SECRET` | confidential client secret |
   | `CORS_ORIGIN` | `https://app.example.com` (no trailing slash) |
   | `API_URL` | `https://api.example.com` (public API origin the browser calls) |

7. Optional:
   - `KEYCLOAK_INTERNAL_URL` if the API cannot reach Keycloak via the public hostname
   - `COOKIE_SECURE=false` if the site is still plain HTTP
8. Under each public service, set the domain **including the internal port**:
   - Frontend: `https://app.example.com:3000`
   - API: `https://api.example.com:4000`
9. Do **not** add Keycloak or Postgres hostnames as domains on this application.
10. If Postgres or Keycloak are other Coolify resources on the same server, enable **Connect To Predefined Network** on **this application** (Configuration → Advanced) so `DATABASE_URL` / `KEYCLOAK_INTERNAL_URL` can resolve Coolify’s internal hostnames. Compose apps do not join that network by default.
11. Deploy. Watch **backend logs** for migrate + seed; `/health` stays down until seed finishes.

Use subdomains of the same registrable domain (for example `app.example.com` and `api.example.com`) so `COOKIE_SAME_SITE=lax` works with credentialed API calls.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | required | Postgres connection string. |
| `KEYCLOAK_URL` | required | Public Keycloak origin (JWT issuer). |
| `KEYCLOAK_BACKEND_CLIENT_SECRET` | required | Confidential client secret. |
| `CORS_ORIGIN` | required | Frontend origin, no trailing slash. |
| `API_URL` | required | Public API origin used by the browser. |
| `KEYCLOAK_INTERNAL_URL` | empty | In-network Keycloak origin for token/admin calls. |
| `KEYCLOAK_REALM` | `german` | Keycloak realm name. |
| `KEYCLOAK_BACKEND_CLIENT_ID` | `german-backend` | Confidential client ID. |
| `KEYCLOAK_BOOTSTRAP` | `false` | If `true`, create realm/client on an already running Keycloak (needs admin vars). |
| `COOKIE_SECURE` | `true` | Set `false` only if the site is served over HTTP. |
| `COOKIE_SAME_SITE` | `lax` | Set `none` only if the web app and API are on different sites. |
| `PRODUCT_NAME` | `German Got Easy` | Product label in API health and the web build. |
| `RUN_SEED` | `true` | Upserts lesson/word content after migrate. Safe to leave on. |

## After deploy

1. Open the frontend domain and register a user.
2. Confirm `GET https://api.example.com/health` returns `{ "data": { "status": "ok" } }`.
3. Back up your Postgres. Content seed is idempotent; learner progress is not.

## Same-server Keycloak

If Keycloak is another Coolify resource on the same machine:

1. Keep Keycloak on its own domain (for example `https://auth.example.com`).
2. Enable **Connect To Predefined Network** on both resources.
3. Set `KEYCLOAK_INTERNAL_URL` to `http://<keycloak-container-name>:8080`.
4. Keep `KEYCLOAK_URL` as the public origin so JWT `iss` verification succeeds.

## Optional bundled Postgres (not used by Coolify)

For a laptop without a database:

```bash
export SERVICE_PASSWORD_64_POSTGRES=localpostgrespasswordlocalpostgrespassword
export DATABASE_URL=postgres://german:${SERVICE_PASSWORD_64_POSTGRES}@postgres:5432/german
export KEYCLOAK_URL=https://auth.example.com
export KEYCLOAK_BACKEND_CLIENT_SECRET=your-client-secret
export CORS_ORIGIN=http://localhost:3000
export API_URL=http://localhost:4000
export COOKIE_SECURE=false
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up --build
```

Do not add `ports:` in the committed Compose files; Coolify would bypass its proxy.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Coolify blocks deploy until `DATABASE_URL` / `KEYCLOAK_URL` / `API_URL` / `CORS_ORIGIN` are set | Expected. This stack does not ship Postgres or Keycloak. |
| Deploy sits on `backend ... Waiting` | Seed is still running. Check backend logs; first seed can take several minutes. |
| Domain shows **No Available Server** | Service is not healthy, or the domain is missing the internal port (`:3000`, `:4000`). |
| `Unexpected token authorized party` / issuer errors | `KEYCLOAK_URL` does not match the JWT `iss`. Use the public Keycloak URL and set `KEYCLOAK_INTERNAL_URL` for in-network calls. |
| Browser login works locally but cookies vanish on HTTPS | `COOKIE_SECURE` must be `true` behind TLS. Use `false` only on plain HTTP. |
| CORS / credentialed fetch fails | `CORS_ORIGIN` must be the frontend origin with no trailing slash. `API_URL` must be the public API origin. |
| API starts, auth 500s | Keycloak unreachable, wrong client secret, or missing direct-access / service-account roles. |
| Cannot connect to Coolify Postgres by service name | Enable **Connect To Predefined Network** on this app and use the **internal** Postgres URL. |
| `prisma engines` / `right permissions` | Image built without OpenSSL 3. Redeploy from a commit that installs OpenSSL in the backend Docker **deps** stage. |
