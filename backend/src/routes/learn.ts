import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { gradeMatchAnswer, toClientExercisePayload } from "../lib/client-payload.js";
import { sendError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

const PASS_SCORE = 0.7;

const isAnswerCorrect = (
  type: string,
  payload: Record<string, unknown>,
  answer: unknown,
): boolean => {
  if (type === "mcq" || type === "cloze" || type === "short_write") {
    const expected = payload.answer;
    const accepted = Array.isArray(payload.accepted) ? payload.accepted : [expected];
    return accepted.map(String).some((value) => String(answer).trim() === value);
  }

  if (type === "reorder") {
    const expected = payload.answer;
    return JSON.stringify(answer) === JSON.stringify(expected);
  }

  if (type === "match") {
    return gradeMatchAnswer(payload, answer);
  }

  return false;
};

const toClientLesson = (lesson: {
  id: string;
  title: string;
  slug: string;
  skillTags: string[];
  unit: { title: string; level: { code: string } };
  exercises: Array<{
    id: string;
    type: string;
    prompt: string;
    payload: unknown;
  }>;
}) => ({
  id: lesson.id,
  title: lesson.title,
  slug: lesson.slug,
  skillTags: lesson.skillTags,
  unitTitle: lesson.unit.title,
  levelCode: lesson.unit.level.code,
  exercises: lesson.exercises.map((exercise) => ({
    id: exercise.id,
    type: exercise.type,
    prompt: exercise.prompt,
    payload: toClientExercisePayload(
      exercise.type,
      exercise.payload as Record<string, unknown>,
    ),
  })),
});

const nextPathQuerySchema = z.object({
  includeExercises: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

export const learnRoutes: FastifyPluginAsync = async (app) => {
  app.get("/v1/path/next", async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    const parsed = nextPathQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Invalid path query.");
    }
    const includeExercises = parsed.data.includeExercises ?? false;

    const next = await prisma.lesson.findFirst({
      where: {
        OR: [
          { progress: { none: { userId: user.id } } },
          {
            progress: {
              some: { userId: user.id, status: { not: "COMPLETED" } },
            },
          },
        ],
      },
      include: {
        unit: { include: { level: true } },
        ...(includeExercises
          ? { exercises: { orderBy: { sortOrder: "asc" as const } } }
          : {}),
      },
      orderBy: [
        { unit: { level: { sortOrder: "asc" } } },
        { unit: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    });

    if (!next) {
      const lessonCount = await prisma.lesson.count();
      const message =
        lessonCount === 0
          ? "No lessons available. Seed content first."
          : "All current lessons completed.";
      return {
        data: { lesson: null, message },
        meta: { requestId: request.id },
      };
    }

    if (includeExercises && "exercises" in next) {
      return {
        data: {
          lesson: toClientLesson(
            next as typeof next & {
              exercises: Array<{
                id: string;
                type: string;
                prompt: string;
                payload: unknown;
              }>;
            },
          ),
        },
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
      data: { lesson: toClientLesson(lesson) },
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
      answers: z
        .array(
          z.object({
            exerciseId: z.string().min(1).max(64),
            answer: z.unknown(),
          }),
        )
        .max(200),
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
    const passed = score >= PASS_SCORE;
    const progressStatus = passed ? "COMPLETED" : "IN_PROGRESS";

    const linkedWordIds = lesson.exercises.map((item) => item.wordId).filter(Boolean) as string[];
    const hintWords = await prisma.word.findMany({
      where: {
        OR: [
          { id: { in: linkedWordIds } },
          { lemma: { in: failedWordHints, mode: "insensitive" } },
        ],
      },
      select: { id: true },
      take: 20,
    });

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.userLessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        create: {
          userId: user.id,
          lessonId: lesson.id,
          status: progressStatus,
          score,
          completedAt: passed ? now : null,
        },
        update: {
          status: progressStatus,
          score,
          completedAt: passed ? now : null,
        },
      });

      await Promise.all(
        hintWords.map((word) =>
          tx.userWordProgress.upsert({
            where: { userId_wordId: { userId: user.id, wordId: word.id } },
            create: {
              userId: user.id,
              wordId: word.id,
              status: "LEARNING",
              dueAt: now,
              timesSeen: 1,
            },
            update: {
              status: "LEARNING",
              dueAt: now,
            },
          }),
        ),
      );
    });

    if (passed) {
      const unitLessons = await prisma.lesson.findMany({
        where: { unitId: lesson.unitId },
        select: {
          id: true,
          progress: {
            where: { userId: user.id },
            select: { status: true },
            take: 1,
          },
        },
      });
      const unitDone = unitLessons.every((item) => item.progress[0]?.status === "COMPLETED");
      if (unitDone) {
        await prisma.userUnitProgress.upsert({
          where: { userId_unitId: { userId: user.id, unitId: lesson.unitId } },
          create: {
            userId: user.id,
            unitId: lesson.unitId,
            status: "COMPLETED",
            completedAt: now,
          },
          update: { status: "COMPLETED", completedAt: now },
        });
      }
    }

    return {
      data: {
        score,
        correctCount,
        total: lesson.exercises.length,
        passed,
        results,
      },
      meta: { requestId: request.id },
    };
  });
};
