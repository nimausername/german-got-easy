import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { randomUUID } from "node:crypto";
import { expandCorsOrigins } from "./lib/cors-origins.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { registerErrorHandler } from "./lib/errors.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";
import { learnRoutes } from "./routes/learn.js";
import { flashcardRoutes } from "./routes/flashcards.js";
import { placementRoutes } from "./routes/placement.js";
import { vocabularyRoutes } from "./routes/vocabulary.js";
import { startWordReleaseScheduler } from "./services/word-release-scheduler.js";

const buildServer = async () => {
  const app = Fastify({
    logger: true,
    trustProxy: true,
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
    bodyLimit: 100_000,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  await app.register(cors, {
    origin: expandCorsOrigins(env.CORS_ORIGIN),
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
  });

  app.addHook("onSend", async (request, reply) => {
    void reply.header("x-request-id", request.id);
  });

  registerErrorHandler(app);

  app.get("/", async () => ({
    data: { service: "api", health: "/health", product: env.PRODUCT_NAME },
    meta: {},
  }));

  app.get("/health", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        data: { status: "ok", product: env.PRODUCT_NAME },
        meta: {},
      };
    } catch {
      return reply.status(503).send({
        error: { code: "NOT_READY", message: "Database unavailable." },
        meta: { requestId: reply.request.id },
      });
    }
  });

  await app.register(authRoutes);
  await app.register(authPlugin);
  await app.register(meRoutes);
  await app.register(learnRoutes);
  await app.register(flashcardRoutes);
  await app.register(vocabularyRoutes);
  await app.register(placementRoutes);

  return app;
};

const start = async () => {
  const app = await buildServer();
  const stopWordRelease = startWordReleaseScheduler(app.log);

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "shutting_down");
    stopWordRelease();
    try {
      await app.close();
      await prisma.$disconnect();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  await app.listen({ port: env.PORT, host: env.HOST });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
