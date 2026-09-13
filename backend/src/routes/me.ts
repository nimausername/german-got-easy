import type { FastifyPluginAsync } from "fastify";
import { sendError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get("/v1/me", async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    const [lessonCompleted, dueWords, learningWords, knownWords] = await Promise.all([
      prisma.userLessonProgress.count({
        where: { userId: user.id, status: "COMPLETED" },
      }),
      prisma.userWordProgress.count({
        where: { userId: user.id, dueAt: { lte: new Date() }, status: { not: "NEW" } },
      }),
      prisma.userWordProgress.count({
        where: { userId: user.id, status: "LEARNING" },
      }),
      prisma.userWordProgress.count({
        where: { userId: user.id, status: "KNOWN" },
      }),
    ]);

    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          targetLevel: user.targetLevel,
        },
        progress: {
          lessonsCompleted: lessonCompleted,
          wordsDueToday: dueWords,
          wordsLearning: learningWords,
          wordsKnown: knownWords,
          streakDays: 0,
        },
      },
      meta: { requestId: request.id },
    };
  });
};
