import type { FastifyReply } from "fastify";
import { env } from "./env.js";
import type { KeycloakTokenSet } from "./keycloak.js";

export const ACCESS_COOKIE = "gge_access";
export const REFRESH_COOKIE = "gge_refresh";

const ACCESS_PATH = "/";
/** Restrict refresh tokens to auth routes only. */
const REFRESH_PATH = "/v1/auth";

const cookieBase = () => ({
  httpOnly: true as const,
  sameSite: env.COOKIE_SAME_SITE,
  secure: env.COOKIE_SECURE,
});

/**
 * Sets httpOnly auth cookies. Access tokens are never returned to JS.
 */
export const setAuthCookies = (reply: FastifyReply, tokens: KeycloakTokenSet) => {
  reply.setCookie(ACCESS_COOKIE, tokens.accessToken, {
    ...cookieBase(),
    path: ACCESS_PATH,
    maxAge: tokens.expiresIn,
  });

  if (tokens.refreshToken) {
    reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...cookieBase(),
      path: REFRESH_PATH,
      maxAge: tokens.refreshExpiresIn ?? 60 * 60 * 24 * 30,
    });
  }
};

/**
 * Clears auth cookies using the same path/flags used when setting them.
 */
export const clearAuthCookies = (reply: FastifyReply) => {
  reply.clearCookie(ACCESS_COOKIE, { ...cookieBase(), path: ACCESS_PATH });
  reply.clearCookie(REFRESH_COOKIE, { ...cookieBase(), path: REFRESH_PATH });
};
