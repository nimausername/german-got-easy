import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

config({ path: resolve(process.cwd(), "../.env") });
config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  KEYCLOAK_URL: z.string().url(),
  KEYCLOAK_INTERNAL_URL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional(),
  ),
  KEYCLOAK_REALM: z.string().min(1),
  KEYCLOAK_BACKEND_CLIENT_ID: z.string().min(1),
  KEYCLOAK_BACKEND_CLIENT_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  PRODUCT_NAME: z.string().default("German Got Easy"),
  WORD_DAILY_RELEASE_LIMIT: z.coerce.number().int().min(0).max(500).default(20),
  WORD_RELEASE_CRON_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
});

const parsed = envSchema.parse(process.env);

if (parsed.COOKIE_SAME_SITE === "none" && !parsed.COOKIE_SECURE) {
  throw new Error("COOKIE_SAME_SITE=none requires COOKIE_SECURE=true");
}

export const env = parsed;

const trimSlash = (url: string) => url.replace(/\/$/, "");

/** Public Keycloak origin used as the JWT `iss` value (browser / proxy hostname). */
export const keycloakPublicBaseUrl = trimSlash(env.KEYCLOAK_URL);

/**
 * Server-to-server Keycloak origin.
 * Prefer an in-network URL in Coolify so token and admin calls skip public hairpin NAT.
 */
export const keycloakApiBaseUrl = trimSlash(env.KEYCLOAK_INTERNAL_URL ?? env.KEYCLOAK_URL);

/** JWT issuer that access tokens must carry. */
export const keycloakIssuer = `${keycloakPublicBaseUrl}/realms/${env.KEYCLOAK_REALM}`;
