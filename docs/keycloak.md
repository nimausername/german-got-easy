# Keycloak (external)

German Got Easy does **not** run Keycloak. The API calls a Keycloak server you host: register/login use the password grant, and registration uses the Admin API.

Deploy Keycloak first (Coolify, Docker, Kubernetes, or a managed realm). Then create the realm and client below, or set `KEYCLOAK_BOOTSTRAP=true` so the API creates them on an already running server.

## Minimum setup

1. Create a realm named `german` (or set `KEYCLOAK_REALM` to match).
2. Create confidential client `german-backend` with **Direct access grants** and a **service account**.
3. Give the service account `realm-management` roles `manage-users`, `view-users`, and `query-users`.
4. Copy the client secret into `KEYCLOAK_BACKEND_CLIENT_SECRET`.
5. Set `KEYCLOAK_URL` to the public Keycloak origin (no trailing slash), for example `https://auth.example.com`.

Never put the client secret in the frontend.

## Realm settings

| Setting | Value |
| --- | --- |
| User registration | Off (the app registers users through the API) |
| Login with email | On |
| Duplicate emails | Off |
| Verify email | Off (no email-verify UI; leaving this on causes `Account is not fully set up` on register) |

Also turn **off** “set as default action” for Verify Email, Update Password, Update Profile, Configure OTP, and Terms and Conditions under **Authentication → Required actions**. Default required actions block Direct Access Grants for new users.

Keycloak 24+ User Profile marks **First name** / **Last name** required by default. Missing names also yield `Account is not fully set up`. The register form collects both and the API stores them on the Keycloak user.

## Client `german-backend`

Create a **confidential** OpenID client:

| Setting | Value |
| --- | --- |
| Client ID | `german-backend` (or set `KEYCLOAK_BACKEND_CLIENT_ID`) |
| Client authentication | On (client secret) |
| Direct access grants | On (Resource Owner Password Credentials) |
| Standard flow | Off (no browser redirect login) |
| Service accounts | On |

Assign the service account these `realm-management` roles:

- `manage-users`
- `view-users`
- `query-users`

## App environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `KEYCLOAK_URL` | Yes | Public Keycloak origin. Must match the JWT `iss` hostname. |
| `KEYCLOAK_INTERNAL_URL` | No | In-network origin for token/admin calls when the API cannot hairpin through the public hostname. |
| `KEYCLOAK_REALM` | No | Defaults to `german`. |
| `KEYCLOAK_BACKEND_CLIENT_ID` | No | Defaults to `german-backend`. |
| `KEYCLOAK_BACKEND_CLIENT_SECRET` | Yes | Confidential client secret. |

Example:

```bash
KEYCLOAK_URL=https://auth.example.com
KEYCLOAK_INTERNAL_URL=http://keycloak:8080
KEYCLOAK_REALM=german
KEYCLOAK_BACKEND_CLIENT_ID=german-backend
KEYCLOAK_BACKEND_CLIENT_SECRET=your-client-secret
```

If Keycloak sits behind Cloudflare, allow User-Agent `GermanGotEasyBackend/1.0`. Empty agents are often blocked.

## Optional realm bootstrap

This app can create the realm and client on an **already running** Keycloak. It still does not start Keycloak.

Set `KEYCLOAK_BOOTSTRAP=true` plus Keycloak master-realm admin credentials (`KEYCLOAK_ADMIN_USERNAME`, `KEYCLOAK_ADMIN_PASSWORD`). Leave this off when you manage the realm yourself.

## Coolify on the same server

1. Deploy Keycloak as its **own** Coolify resource. Do not attach `auth.example.com` to the German Got Easy compose app.
2. Enable **Connect To Predefined Network** on both resources if the API must reach Keycloak by container name.
3. Set `KEYCLOAK_URL` to the public Keycloak URL and `KEYCLOAK_INTERNAL_URL` to `http://<keycloak-container>:8080`.

Production compose and domain notes are in [Self-host (Coolify / Docker Compose)](./coolify.md). Session cookies are documented in [Auth cookies and sessions](./auth-cookies.md).
