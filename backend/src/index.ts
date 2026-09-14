import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { randomUUID } from "node:crypto";
import { env } from "./lib/env.js";
import { registerErrorHandler } from "./lib/errors.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";
import { learnRoutes } from "./routes/learn.js";
import { flashcardRoutes } from "./routes/flashcards.js";
import { placementRoutes } from "./routes/placement.js";
import { vocabularyRoutes } from "./routes/vocabulary.js";

const buildServer = async () => {
  const app = Fastify({
    logger: true,
    genReqId: () => randomUUID(),
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((v) => v.trim()),
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
  });

  registerErrorHandler(app);

  app.get("/health", async () => ({
    data: { status: "ok", product: env.PRODUCT_NAME },
    meta: {},
  }));

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
  await app.listen({ port: env.PORT, host: env.HOST });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
