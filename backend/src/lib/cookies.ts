import type { FastifyReply } from "fastify";
import { env } from "./env.js";
import type { KeycloakTokenSet } from "./keycloak.js";

export const ACCESS_COOKIE = "gge_access";
export const REFRESH_COOKIE = "gge_refresh";

export const setAuthCookies = (reply: FastifyReply, tokens: KeycloakTokenSet) => {
  const secure = env.COOKIE_SECURE;
  reply.setCookie(ACCESS_COOKIE, tokens.accessToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: tokens.expiresIn,
  });

  if (tokens.refreshToken) {
    reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: tokens.refreshExpiresIn ?? 60 * 60 * 24 * 30,
    });
  }
};

export const clearAuthCookies = (reply: FastifyReply) => {
  reply.clearCookie(ACCESS_COOKIE, { path: "/" });
  reply.clearCookie(REFRESH_COOKIE, { path: "/" });
};
