import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sendError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

const isAnswerCorrect = (
  type: string,
  payload: Record<string, unknown>,
  answer: unknown,
): boolean => {
  if (type === "mcq" || type === "cloze") {
    const expected = payload.answer;
    const accepted = Array.isArray(payload.accepted) ? payload.accepted : [expected];
    return accepted.map(String).some((value) => String(answer).trim() === value);
  }

  if (type === "reorder") {
    const expected = payload.answer;
    return JSON.stringify(answer) === JSON.stringify(expected);
  }

  if (type === "match") {
    return Boolean(answer);
  }

  return false;
};

export const learnRoutes: FastifyPluginAsync = async (app) => {
  app.get("/v1/path/next", async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    const lessons = await prisma.lesson.findMany({
      include: {
        unit: { include: { level: true } },
        progress: { where: { userId: user.id } },
      },
      orderBy: [
        { unit: { level: { sortOrder: "asc" } } },
        { unit: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    });

    const next = lessons.find((lesson) => lesson.progress[0]?.status !== "COMPLETED");
    if (!next) {
      const message =
        lessons.length === 0
          ? "No lessons available. Seed content first."
          : "All current lessons completed.";
      return {
        data: { lesson: null, message },
        meta: { requestId: request.id },
      };
    }

    return {
      data: {
        lesson: {
          id: next.id,
          title: next.title,
          slug: next.slug,
          unitTitle: next.unit.title,
          levelCode: next.unit.level.code,
        },
      },
      meta: { requestId: request.id },
    };
  });

  app.get("/v1/lessons/:id", async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    const { id } = request.params as { id: string };
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        unit: { include: { level: true } },
        exercises: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!lesson) {
      return sendError(reply, 404, "NOT_FOUND", "Lesson not found.");
    }

    return {
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          skillTags: lesson.skillTags,
          unitTitle: lesson.unit.title,
          levelCode: lesson.unit.level.code,
          exercises: lesson.exercises.map((exercise) => ({
            id: exercise.id,
            type: exercise.type,
            prompt: exercise.prompt,
            payload: exercise.payload,
          })),
        },
      },
      meta: { requestId: request.id },
    };
  });

  app.post("/v1/lessons/:id/submit", async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    const { id } = request.params as { id: string };
    const bodySchema = z.object({
      answers: z.array(
        z.object({
          exerciseId: z.string(),
          answer: z.unknown(),
        }),
      ),
    });
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Invalid submit payload.");
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { exercises: true, unit: true },
    });
    if (!lesson) {
      return sendError(reply, 404, "NOT_FOUND", "Lesson not found.");
    }

    const answerMap = new Map(parsed.data.answers.map((item) => [item.exerciseId, item.answer]));
    let correctCount = 0;
    const failedWordHints: string[] = [];
    const results = lesson.exercises.map((exercise) => {
      const answer = answerMap.get(exercise.id);
      const payload = exercise.payload as Record<string, unknown>;
      const correct = isAnswerCorrect(exercise.type, payload, answer);
      if (correct) correctCount += 1;
      else if (typeof payload.answer === "string") failedWordHints.push(payload.answer);
      return { exerciseId: exercise.id, correct, wordId: exercise.wordId };
    });

    const score = lesson.exercises.length
      ? correctCount / lesson.exercises.length
      : 0;

    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
      create: {
        userId: user.id,
        lessonId: lesson.id,
        status: "COMPLETED",
        score,
        completedAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        score,
        completedAt: new Date(),
      },
    });

    const linkedWordIds = lesson.exercises.map((item) => item.wordId).filter(Boolean) as string[];
    const hintWords = await prisma.word.findMany({
      where: {
        OR: [
          { id: { in: linkedWordIds } },
          { lemma: { in: failedWordHints, mode: "insensitive" } },
        ],
      },
      take: 20,
    });

    for (const word of hintWords) {
      await prisma.userWordProgress.upsert({
        where: { userId_wordId: { userId: user.id, wordId: word.id } },
        create: {
          userId: user.id,
          wordId: word.id,
          status: "LEARNING",
          dueAt: new Date(),
          timesSeen: 1,
        },
        update: {
          status: "LEARNING",
          dueAt: new Date(),
        },
      });
    }

    const unitLessons = await prisma.lesson.findMany({
      where: { unitId: lesson.unitId },
      include: { progress: { where: { userId: user.id } } },
    });
    const unitDone = unitLessons.every((item) => item.progress[0]?.status === "COMPLETED");
    if (unitDone) {
      await prisma.userUnitProgress.upsert({
        where: { userId_unitId: { userId: user.id, unitId: lesson.unitId } },
        create: {
          userId: user.id,
          unitId: lesson.unitId,
          status: "COMPLETED",
          completedAt: new Date(),
        },
        update: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    return {
      data: {
        score,
        correctCount,
        total: lesson.exercises.length,
        results,
      },
      meta: { requestId: request.id },
    };
  });
};
