import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { clearAuthCookies, setAuthCookies } from "../lib/cookies.js";
import { sendError } from "../lib/errors.js";
import {
  createKeycloakUser,
  passwordGrant,
  refreshGrant,
} from "../lib/keycloak.js";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/keycloak.js";

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/v1/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Invalid registration payload.", [
        { reason: parsed.error.issues[0]?.message ?? "Invalid input" },
      ]);
    }

    const { email, password } = parsed.data;
    const username = parsed.data.username ?? email.split("@")[0]!;

    try {
      await createKeycloakUser({ username, email, password });
      const tokens = await passwordGrant(username, password);
      const payload = await verifyAccessToken(tokens.accessToken);
      const user = await prisma.user.upsert({
        where: { keycloakSub: payload.sub },
        create: {
          keycloakSub: payload.sub,
          email,
          username,
          displayName: username,
        },
        update: { email, username },
      });
      setAuthCookies(reply, tokens);
      return reply.status(201).send({
        data: {
          accessToken: tokens.accessToken,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
          },
        },
        meta: { requestId: request.id },
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err.statusCode === 409) {
        return sendError(reply, 409, "USER_EXISTS", "An account with this email or username already exists.");
      }
      return sendError(reply, err.statusCode ?? 400, "REGISTER_FAILED", err.message || "Registration failed.");
    }
  });

  app.post("/v1/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Invalid login payload.");
    }

    const usernameOrEmail = parsed.data.usernameOrEmail.trim();
    const password = parsed.data.password;

    try {
      const tokens = await passwordGrant(usernameOrEmail, password);
      let payload;
      try {
        payload = await verifyAccessToken(tokens.accessToken);
      } catch (error) {
        request.log.error({ err: error }, "Login token verification failed");
        return sendError(reply, 401, "TOKEN_INVALID", "Could not verify login token.");
      }

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
      setAuthCookies(reply, tokens);
      return {
        data: {
          accessToken: tokens.accessToken,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
          },
        },
        meta: { requestId: request.id },
      };
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      request.log.warn(
        { err: err.message, statusCode: err.statusCode },
        "Login password grant failed",
      );
      return sendError(reply, 401, "INVALID_CREDENTIALS", "Invalid username/email or password.");
    }
  });

  app.post("/v1/auth/refresh", async (request, reply) => {
    const refreshToken = request.cookies?.gge_refresh;
    if (!refreshToken) {
      return sendError(reply, 401, "UNAUTHORIZED", "Missing refresh token.");
    }

    try {
      const tokens = await refreshGrant(refreshToken);
      setAuthCookies(reply, tokens);
      return { data: { ok: true }, meta: { requestId: request.id } };
    } catch {
      clearAuthCookies(reply);
      return sendError(reply, 401, "UNAUTHORIZED", "Refresh failed.");
    }
  });

  app.post("/v1/auth/logout", async (request, reply) => {
    clearAuthCookies(reply);
    return { data: { ok: true }, meta: { requestId: request.id } };
  });
};
