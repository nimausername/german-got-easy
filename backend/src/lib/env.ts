import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

config({ path: resolve(process.cwd(), "../.env") });
config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  KEYCLOAK_URL: z.string().url(),
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
  PRODUCT_NAME: z.string().default("German Got Easy"),
});

export const env = envSchema.parse(process.env);

export const keycloakIssuer = `${env.KEYCLOAK_URL.replace(/\/$/, "")}/realms/${env.KEYCLOAK_REALM}`;
