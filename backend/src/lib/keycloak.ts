import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env, keycloakApiBaseUrl, keycloakIssuer } from "./env.js";

const KC_UA = "GermanGotEasyBackend/1.0";
const realmBase = `${keycloakApiBaseUrl}/realms/${env.KEYCLOAK_REALM}`;
const tokenUrl = `${realmBase}/protocol/openid-connect/token`;
const adminUsersUrl = `${keycloakApiBaseUrl}/admin/realms/${env.KEYCLOAK_REALM}/users`;

const jwks = createRemoteJWKSet(new URL(`${realmBase}/protocol/openid-connect/certs`));

export type KeycloakTokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  refreshExpiresIn?: number;
  tokenType: string;
};

export type VerifiedAccessToken = JWTPayload & {
  sub: string;
  preferred_username?: string;
  email?: string;
  azp?: string;
};

const formBody = (data: Record<string, string>) => new URLSearchParams(data).toString();

const parseTokenResponse = async (response: Response): Promise<KeycloakTokenSet> => {
  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok || typeof data.access_token !== "string") {
    const description =
      typeof data.error_description === "string"
        ? data.error_description
        : typeof data.error === "string"
          ? data.error
          : "Keycloak token request failed";
    const error = new Error(description) as Error & { statusCode?: number };
    error.statusCode = response.status === 401 ? 401 : 400;
    throw error;
  }

  return {
    accessToken: data.access_token,
    refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : undefined,
    expiresIn: typeof data.expires_in === "number" ? data.expires_in : 300,
    refreshExpiresIn:
      typeof data.refresh_expires_in === "number" ? data.refresh_expires_in : undefined,
    tokenType: typeof data.token_type === "string" ? data.token_type : "Bearer",
  };
};

export const passwordGrant = async (
  username: string,
  password: string,
): Promise<KeycloakTokenSet> => {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": KC_UA,
    },
    body: formBody({
      grant_type: "password",
      client_id: env.KEYCLOAK_BACKEND_CLIENT_ID,
      client_secret: env.KEYCLOAK_BACKEND_CLIENT_SECRET,
      username,
      password,
    }),
  });
  return parseTokenResponse(response);
};

export const refreshGrant = async (refreshToken: string): Promise<KeycloakTokenSet> => {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": KC_UA,
    },
    body: formBody({
      grant_type: "refresh_token",
      client_id: env.KEYCLOAK_BACKEND_CLIENT_ID,
      client_secret: env.KEYCLOAK_BACKEND_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  return parseTokenResponse(response);
};

const logoutUrl = `${realmBase}/protocol/openid-connect/logout`;

/**
 * Revokes a refresh token / ends the Keycloak session when possible.
 * Failures are ignored by callers after local cookies are cleared.
 */
export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  const response = await fetch(logoutUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": KC_UA,
    },
    body: formBody({
      client_id: env.KEYCLOAK_BACKEND_CLIENT_ID,
      client_secret: env.KEYCLOAK_BACKEND_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    const error = new Error(text || "Keycloak logout failed") as Error & {
      statusCode?: number;
    };
    error.statusCode = response.status;
    throw error;
  }
};

export const clientCredentialsGrant = async (): Promise<KeycloakTokenSet> => {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": KC_UA,
    },
    body: formBody({
      grant_type: "client_credentials",
      client_id: env.KEYCLOAK_BACKEND_CLIENT_ID,
      client_secret: env.KEYCLOAK_BACKEND_CLIENT_SECRET,
    }),
  });
  return parseTokenResponse(response);
};

export const createKeycloakUser = async (input: {
  username: string;
  email: string;
  password: string;
}): Promise<string> => {
  const admin = await clientCredentialsGrant();
  const createResponse = await fetch(adminUsersUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${admin.accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": KC_UA,
    },
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      enabled: true,
      emailVerified: false,
      credentials: [
        {
          type: "password",
          value: input.password,
          temporary: false,
        },
      ],
    }),
  });

  if (createResponse.status === 201) {
    const location = createResponse.headers.get("location");
    if (location) {
      return location.split("/").pop() as string;
    }
  }

  if (createResponse.status === 409) {
    const error = new Error("User already exists") as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }

  const text = await createResponse.text();
  const error = new Error(text || "Failed to create user") as Error & { statusCode?: number };
  error.statusCode = 400;
  throw error;
};

export const verifyAccessToken = async (token: string): Promise<VerifiedAccessToken> => {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: keycloakIssuer,
  });

  if (!payload.sub) {
    const error = new Error("Token missing subject") as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  // Keycloak access tokens typically identify the client via `azp`.
  if (payload.azp !== env.KEYCLOAK_BACKEND_CLIENT_ID) {
    const error = new Error("Unexpected token authorized party") as Error & {
      statusCode?: number;
    };
    error.statusCode = 401;
    throw error;
  }

  return payload as VerifiedAccessToken;
};
