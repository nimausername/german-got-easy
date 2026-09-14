# Self-host (Coolify / Docker Compose)

German Got Easy ships as Docker Compose: a Fastify API and a Next.js web app.

**PostgreSQL and Keycloak are not in this stack.** Create them as separate services (Coolify resources, or servers you already have), then pass connection settings into this app. Keycloak realm setup is in [Keycloak](./keycloak.md).

Learners open **only the web domain**. The web container proxies `/v1` to `http://backend:4000` on the Compose network. Login does not need a public API hostname.

## What the compose file starts

| Service | Internal port | Publish a domain? | Role |
| --- | --- | --- | --- |
| `frontend` | 3000 | Required | Web UI. Users open this origin. |
| `backend` | 4000 | Optional | API, migrations, and content seed. First seed can take several minutes. |

Do not add host `ports:` to `docker-compose.yml`. Coolify Proxy routes by domain. The optional [`docker-compose.postgres.yml`](../docker-compose.postgres.yml) overlay publishes `3000`/`4000` for a laptop only.

## Coolify (first deploy)

1. Have Postgres and Keycloak running. Complete [Keycloak](./keycloak.md).
2. In Coolify, open the project and environment, then **+ New**.
3. Connect this Git repository.
4. Set **Build Pack** to **Docker Compose**.
5. Set **Base Directory** to `/` and **Docker Compose Location** to `docker-compose.yml`.
6. Save, then set these **required** variables (Coolify highlights empty ones):

   | Variable | Example |
   | --- | --- |
   | `DATABASE_URL` | `postgres://USER:PASSWORD@HOST:PORT/DATABASE` |
   | `KEYCLOAK_URL` | `https://auth.example.com` |
   | `KEYCLOAK_BACKEND_CLIENT_SECRET` | confidential client secret from the Keycloak client |
   | `CORS_ORIGIN` | `https://app.example.com` (web origin, no trailing slash) |

7. Optional:
   - `KEYCLOAK_INTERNAL_URL` (`http://<keycloak-container>:8080`) if the API cannot reach Keycloak through the public hostname
   - `COOKIE_SECURE=true` when the web app is HTTPS (`false` only on plain HTTP)
8. Set the **frontend** domain **including the internal port**: `https://app.example.com:3000`.
9. You may also attach an API domain as `https://api.example.com:4000`. Users do not need it to log in. Do **not** attach Keycloak or Postgres hostnames to this application.
10. If Postgres or Keycloak are other Coolify resources on the same server, enable **Connect To Predefined Network** on **this application** (Configuration → Advanced). Compose apps do not join that network by default. Then `DATABASE_URL` / `KEYCLOAK_INTERNAL_URL` can use Coolify internal hostnames. If DNS for those hostnames fails, use the database’s public URL instead.
11. Deploy. Watch **backend logs** for migrate + seed. `/health` stays down until seed finishes.

After deploy, open the **web** domain and register a user. `GET /health` on the API (internal or public) returns `{ "data": { "status": "ok", ... } }`. Back up Postgres: content seed is idempotent; learner progress is not.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | required | Postgres connection string. |
| `KEYCLOAK_URL` | required | Public Keycloak origin (JWT issuer). |
| `KEYCLOAK_BACKEND_CLIENT_SECRET` | required | Confidential client secret. |
| `CORS_ORIGIN` | required | Public web origin, no trailing slash. `http` / `https` and `www` variants are also allowed. |
| `KEYCLOAK_INTERNAL_URL` | empty | In-network Keycloak origin for token and admin calls. |
| `KEYCLOAK_REALM` | `german` | Keycloak realm name. |
| `KEYCLOAK_BACKEND_CLIENT_ID` | `german-backend` | Confidential client ID. |
| `KEYCLOAK_BOOTSTRAP` | `false` | If `true`, create realm/client on an already running Keycloak (needs admin vars). |
| `COOKIE_SECURE` | `true` | Set `false` only if the site is served over HTTP. |
| `COOKIE_SAME_SITE` | `lax` | Leave `lax` for the default same-origin web app. |
| `PRODUCT_NAME` | `German Got Easy` | Product label in API health and the web build. |
| `RUN_SEED` | `true` | Upserts lesson/word content after migrate. Safe to leave on. |

You do **not** set `API_URL`. The web container always proxies to `http://backend:4000`. If Coolify still lists `API_URL` from an older revision, delete that variable.

## Same-server Keycloak

If Keycloak is another Coolify resource on the same machine:

1. Keep Keycloak on its own domain (for example `https://auth.example.com`).
2. Enable **Connect To Predefined Network** on both resources.
3. Set `KEYCLOAK_INTERNAL_URL` to `http://<keycloak-container-name>:8080`.
4. Keep `KEYCLOAK_URL` as the public origin so JWT `iss` verification succeeds.

## Laptop Docker (optional Postgres)

Use this only on a machine where you want Compose to start Postgres and publish ports. Do not add this overlay on Coolify.

```bash
export SERVICE_PASSWORD_64_POSTGRES=choose-a-long-password
export KEYCLOAK_URL=https://auth.example.com
export KEYCLOAK_BACKEND_CLIENT_SECRET=your-client-secret
export CORS_ORIGIN=http://localhost:3000
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up --build
```

Then open http://localhost:3000. Keycloak is still external.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Coolify blocks deploy until `DATABASE_URL` / `KEYCLOAK_URL` / `KEYCLOAK_BACKEND_CLIENT_SECRET` / `CORS_ORIGIN` are set | Expected. This stack does not ship Postgres or Keycloak. |
| Deploy sits on `backend ... Waiting` | Seed is still running. Check backend logs; first seed can take several minutes. |
| Domain shows **No Available Server** | Service is not healthy, or the domain is missing the internal port (`:3000` on the web service). |
| `Unexpected token authorized party` / issuer errors | `KEYCLOAK_URL` does not match the JWT `iss`. Use the public Keycloak URL and set `KEYCLOAK_INTERNAL_URL` for in-network calls. |
| Browser login works locally but cookies vanish on HTTPS | `COOKIE_SECURE` must be `true` behind TLS. Use `false` only on plain HTTP. |
| Login shows **The API is unavailable** | Frontend cannot reach `http://backend:4000`. Keep frontend and backend in the same Compose app. |
| Login in DevTools goes to a second API hostname | You are on an old image. This revision calls `https://your-web-domain/v1/...` only. |
| API starts, auth 500s | Keycloak unreachable, wrong client secret, or missing direct-access / service-account roles. |
| Cannot connect to Coolify Postgres by service name | Enable **Connect To Predefined Network** and use the **internal** Postgres URL, or switch to the public DB URL. |
| `prisma engines` / `right permissions` | Image built without OpenSSL 3. Redeploy from a commit that installs OpenSSL in the backend Docker **deps** stage. |
