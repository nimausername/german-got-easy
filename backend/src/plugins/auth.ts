import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { User } from "@prisma/client";
import { ACCESS_COOKIE } from "../lib/cookies.js";
import { sendError } from "../lib/errors.js";
import { verifyAccessToken, type VerifiedAccessToken } from "../lib/keycloak.js";
import { prisma } from "../lib/prisma.js";

declare module "fastify" {
  interface FastifyRequest {
    authToken?: VerifiedAccessToken;
    currentUser?: User;
  }
}

/**
 * Reads a bearer token from Authorization or the httpOnly access cookie.
 */
export const extractAccessToken = (request: FastifyRequest): string | undefined => {
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }
  const cookieToken = request.cookies?.[ACCESS_COOKIE];
  return cookieToken || undefined;
};

const USER_CACHE_TTL_MS = 60_000;
const MAX_USER_CACHE_ENTRIES = 2_000;

type CachedUser = {
  readonly user: User;
  readonly at: number;
};

const userBySubCache = new Map<string, CachedUser>();

/**
 * Clears the short-lived auth user cache (tests / logout-side invalidation).
 */
export const clearUserAuthCache = (): void => {
  userBySubCache.clear();
};

const rememberUser = (sub: string, user: User): User => {
  if (userBySubCache.size >= MAX_USER_CACHE_ENTRIES) {
    const oldest = userBySubCache.keys().next().value;
    if (oldest !== undefined) {
      userBySubCache.delete(oldest);
    }
  }
  userBySubCache.set(sub, { user, at: Date.now() });
  return user;
};

/**
 * Resolves the local user for a verified token without writing on every request.
 * Caches successful lookups briefly to avoid a DB round-trip on chatty UIs.
 */
export const resolveUserFromToken = async (
  payload: VerifiedAccessToken,
): Promise<User> => {
  const cached = userBySubCache.get(payload.sub);
  if (cached && Date.now() - cached.at < USER_CACHE_TTL_MS) {
    return cached.user;
  }

  const existing = await prisma.user.findUnique({
    where: { keycloakSub: payload.sub },
  });
  if (existing) {
    return rememberUser(payload.sub, existing);
  }

  const created = await prisma.user.create({
    data: {
      keycloakSub: payload.sub,
      email: payload.email,
      username: payload.preferred_username,
      displayName: payload.preferred_username ?? payload.email ?? null,
    },
  });
  return rememberUser(payload.sub, created);
};

const authPluginImpl: FastifyPluginAsync = async (app) => {
  app.decorateRequest("authToken", undefined);
  app.decorateRequest("currentUser", undefined);

  app.addHook("preHandler", async (request, reply) => {
    const path = request.url.split("?")[0] ?? request.url;
    const isPublic =
      path === "/health" ||
      path === "/v1/auth/login" ||
      path === "/v1/auth/register" ||
      path === "/v1/auth/refresh" ||
      path === "/v1/auth/logout" ||
      path === "/v1/auth/session" ||
      /^\/v1\/media\/audio\/[a-f0-9]{32}\.mp3$/.test(path);

    if (isPublic || request.method === "OPTIONS" || !path.startsWith("/v1/")) {
      return;
    }

    const token = extractAccessToken(request);
    if (!token) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    if (token.length > 8192) {
      return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
    }

    try {
      const payload = await verifyAccessToken(token);
      request.authToken = payload;
      request.currentUser = await resolveUserFromToken(payload);
    } catch {
      return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
    }
  });
};

export const authPlugin = fp(authPluginImpl, {
  name: "auth-plugin",
});
