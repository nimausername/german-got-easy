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

const extractBearer = (request: FastifyRequest): string | undefined => {
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }
  const cookieToken = request.cookies?.[ACCESS_COOKIE];
  return cookieToken || undefined;
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
      path === "/v1/auth/logout";

    if (isPublic || request.method === "OPTIONS" || !path.startsWith("/v1/")) {
      return;
    }

    const token = extractBearer(request);
    if (!token) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    // Reject absurdly large tokens early (DoS / junk cookies).
    if (token.length > 8192) {
      return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
    }

    try {
      const payload = await verifyAccessToken(token);
      const user = await prisma.user.upsert({
        where: { keycloakSub: payload.sub },
        create: {
          keycloakSub: payload.sub,
          email: payload.email,
          username: payload.preferred_username,
          displayName: payload.preferred_username ?? payload.email ?? null,
        },
        update: {
          email: payload.email ?? undefined,
          username: payload.preferred_username ?? undefined,
        },
      });
      request.authToken = payload;
      request.currentUser = user;
    } catch {
      return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
    }
  });
};

export const authPlugin = fp(authPluginImpl, {
  name: "auth-plugin",
});
