import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../lib/cookies.js";
import { sendError } from "../lib/errors.js";
import {
  createKeycloakUser,
  passwordGrant,
  refreshGrant,
  revokeRefreshToken,
  verifyAccessToken,
} from "../lib/keycloak.js";
import { prisma } from "../lib/prisma.js";

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
  usernameOrEmail: z.string().min(1).max(254),
  password: z.string().min(1).max(128),
});

const authRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
} as const;

const userPublicFields = (user: {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
}) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/v1/auth/register", authRateLimit, async (request, reply) => {
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
          user: userPublicFields(user),
        },
        meta: { requestId: request.id },
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err.statusCode === 409) {
        return sendError(
          reply,
          409,
          "USER_EXISTS",
          "An account with this email or username already exists.",
        );
      }
      request.log.warn({ err: err.message, statusCode: err.statusCode }, "Registration failed");
      return sendError(reply, 400, "REGISTER_FAILED", "Registration failed.");
    }
  });

  app.post("/v1/auth/login", authRateLimit, async (request, reply) => {
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
          user: userPublicFields(user),
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

  app.post("/v1/auth/refresh", authRateLimit, async (request, reply) => {
    const refreshToken = request.cookies?.[REFRESH_COOKIE];
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
    const refreshToken = request.cookies?.[REFRESH_COOKIE];
    if (refreshToken) {
      try {
        await revokeRefreshToken(refreshToken);
      } catch (error) {
        request.log.warn({ err: error }, "Keycloak logout revoke failed");
      }
    }
    clearAuthCookies(reply);
    return { data: { ok: true }, meta: { requestId: request.id } };
  });
};
