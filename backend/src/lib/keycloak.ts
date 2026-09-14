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

type KeycloakAdminUser = {
  id?: string;
  username?: string;
  email?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  requiredActions?: string[];
  [key: string]: unknown;
};

const adminHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
  "User-Agent": KC_UA,
});

/**
 * Sets a permanent password and clears required actions so Direct Access Grants work.
 * Keycloak often attaches VERIFY_EMAIL / UPDATE_PASSWORD after create; that yields
 * "Account is not fully set up" on password grant until cleared.
 */
const finalizeKeycloakUserForLogin = async (
  accessToken: string,
  userId: string,
  password: string,
): Promise<void> => {
  const userUrl = `${adminUsersUrl}/${encodeURIComponent(userId)}`;

  const passwordResponse = await fetch(`${userUrl}/reset-password`, {
    method: "PUT",
    headers: adminHeaders(accessToken),
    body: JSON.stringify({
      type: "password",
      value: password,
      temporary: false,
    }),
  });
  if (!passwordResponse.ok) {
    const text = await passwordResponse.text();
    const error = new Error(text || "Failed to set Keycloak password") as Error & {
      statusCode?: number;
    };
    error.statusCode = passwordResponse.status === 400 ? 400 : 500;
    throw error;
  }

  const getResponse = await fetch(userUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": KC_UA,
    },
  });
  if (!getResponse.ok) {
    const text = await getResponse.text();
    const error = new Error(text || "Failed to load Keycloak user") as Error & {
      statusCode?: number;
    };
    error.statusCode = 500;
    throw error;
  }

  const existing = (await getResponse.json()) as KeycloakAdminUser;
  const updateResponse = await fetch(userUrl, {
    method: "PUT",
    headers: adminHeaders(accessToken),
    body: JSON.stringify({
      ...existing,
      enabled: true,
      emailVerified: true,
      requiredActions: [],
    }),
  });
  if (!updateResponse.ok) {
    const text = await updateResponse.text();
    const error = new Error(text || "Failed to clear Keycloak required actions") as Error & {
      statusCode?: number;
    };
    error.statusCode = 500;
    throw error;
  }
};

/**
 * Creates a realm user via the Admin API and prepares them for password grant login.
 */
export const createKeycloakUser = async (input: {
  username: string;
  email: string;
  password: string;
}): Promise<string> => {
  const admin = await clientCredentialsGrant();
  const createResponse = await fetch(adminUsersUrl, {
    method: "POST",
    headers: adminHeaders(admin.accessToken),
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      enabled: true,
      emailVerified: true,
      requiredActions: [],
    }),
  });

  if (createResponse.status === 409) {
    const error = new Error("User already exists") as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }

  if (createResponse.status !== 201) {
    const text = await createResponse.text();
    const error = new Error(text || "Failed to create user") as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const location = createResponse.headers.get("location");
  const userId = location?.split("/").pop();
  if (!userId) {
    const error = new Error("Keycloak created user but returned no Location header") as Error & {
      statusCode?: number;
    };
    error.statusCode = 500;
    throw error;
  }

  await finalizeKeycloakUserForLogin(admin.accessToken, userId, input.password);
  return userId;
};

/**
 * Deletes a Keycloak user by id. Used to roll back a partial registration.
 */
export const deleteKeycloakUser = async (userId: string): Promise<void> => {
  const admin = await clientCredentialsGrant();
  const response = await fetch(`${adminUsersUrl}/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${admin.accessToken}`,
      "User-Agent": KC_UA,
    },
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    const error = new Error(text || "Failed to delete Keycloak user") as Error & {
      statusCode?: number;
    };
    error.statusCode = response.status;
    throw error;
  }
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
