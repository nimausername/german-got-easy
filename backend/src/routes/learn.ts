import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { gradeMatchAnswer, toClientExercisePayload } from "../lib/client-payload.js";
import { sendError } from "../lib/errors.js";
import { enrichTeachBlocksWithAudio } from "../lib/lesson-audio.js";
import {
  isScoredExerciseType,
  isUnscoredRequiredType,
  parseTeachBlocks,
} from "../lib/lesson-content.js";
import { prisma } from "../lib/prisma.js";

const PASS_SCORE = 0.7;

const cefrCodeSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

/**
 * Grades a learner answer for a scored exercise type.
 */
const isAnswerCorrect = (
  type: string,
  payload: Record<string, unknown>,
  answer: unknown,
): boolean => {
  if (type === "mcq" || type === "cloze" || type === "short_write" || type === "listen_mcq") {
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

/**
 * Returns true when a speak_prompt was marked complete by the learner.
 */
const isSpeakPromptComplete = (answer: unknown): boolean => {
  if (answer === true) return true;
  if (answer && typeof answer === "object" && !Array.isArray(answer)) {
    return (answer as { completed?: unknown }).completed === true;
  }
  return false;
};

const toClientLesson = (lesson: {
  id: string;
  title: string;
  slug: string;
  canDo: string;
  summary: string | null;
  skillTags: string[];
  teachBlocks: unknown;
  unit: { id: string; title: string; level: { code: string } };
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
  canDo: lesson.canDo,
  summary: lesson.summary,
  skillTags: lesson.skillTags,
  teachBlocks: enrichTeachBlocksWithAudio(parseTeachBlocks(lesson.teachBlocks)),
  unitId: lesson.unit.id,
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
  app.get("/v1/levels", async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    const levels = await prisma.level.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        units: {
          select: {
            id: true,
            _count: { select: { lessons: true } },
            progress: {
              where: { userId: user.id },
              select: { status: true },
              take: 1,
            },
          },
        },
        progress: {
          where: { userId: user.id },
          select: { status: true },
          take: 1,
        },
      },
    });

    return {
      data: {
        levels: levels.map((level) => {
          const unitCount = level.units.length;
          const lessonCount = level.units.reduce(
            (sum, unit) => sum + unit._count.lessons,
            0,
          );
          const unitsCompleted = level.units.filter(
            (unit) => unit.progress[0]?.status === "COMPLETED",
          ).length;
          return {
            id: level.id,
            code: level.code,
            title: level.title,
            sortOrder: level.sortOrder,
            unitCount,
            lessonCount,
            unitsCompleted,
            status: level.progress[0]?.status ?? "NOT_STARTED",
          };
        }),
      },
      meta: { requestId: request.id },
    };
  });

  app.get("/v1/levels/:code/units", async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    const { code } = request.params as { code: string };
    const parsedCode = cefrCodeSchema.safeParse(code.toUpperCase());
    if (!parsedCode.success) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Invalid level code.");
    }

    const level = await prisma.level.findUnique({
      where: { code: parsedCode.data },
      include: {
        units: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              select: {
                id: true,
                progress: {
                  where: { userId: user.id },
                  select: { status: true },
                  take: 1,
                },
              },
            },
            progress: {
              where: { userId: user.id },
              select: { status: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!level) {
      return sendError(reply, 404, "NOT_FOUND", "Level not found.");
    }

    return {
      data: {
        level: {
          id: level.id,
          code: level.code,
          title: level.title,
        },
        units: level.units.map((unit) => {
          const lessonsCompleted = unit.lessons.filter(
            (lesson) => lesson.progress[0]?.status === "COMPLETED",
          ).length;
          return {
            id: unit.id,
            slug: unit.slug,
            title: unit.title,
            description: unit.description,
            sortOrder: unit.sortOrder,
            lessonCount: unit.lessons.length,
            lessonsCompleted,
            status: unit.progress[0]?.status ?? "NOT_STARTED",
          };
        }),
      },
      meta: { requestId: request.id },
    };
  });

  app.get("/v1/units/:id", async (request, reply) => {
    const user = request.currentUser;
    if (!user) {
      return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");
    }

    const { id } = request.params as { id: string };
    const unit = await prisma.unit.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        level: { select: { code: true, title: true } },
        progress: {
          where: { userId: user.id },
          select: { status: true },
          take: 1,
        },
        lessons: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            slug: true,
            title: true,
            canDo: true,
            summary: true,
            skillTags: true,
            sortOrder: true,
            progress: {
              where: { userId: user.id },
              select: { status: true, score: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!unit) {
      return sendError(reply, 404, "NOT_FOUND", "Unit not found.");
    }

    return {
      data: {
        unit: {
          id: unit.id,
          slug: unit.slug,
          title: unit.title,
          description: unit.description,
          status: unit.progress[0]?.status ?? "NOT_STARTED",
          levelCode: unit.level.code,
          levelTitle: unit.level.title,
          lessons: unit.lessons.map((lesson) => ({
            id: lesson.id,
            slug: lesson.slug,
            title: lesson.title,
            canDo: lesson.canDo,
            summary: lesson.summary,
            skillTags: lesson.skillTags,
            sortOrder: lesson.sortOrder,
            status: lesson.progress[0]?.status ?? "NOT_STARTED",
            score: lesson.progress[0]?.score ?? null,
          })),
        },
      },
      meta: { requestId: request.id },
    };
  });

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

    const nextWhere = {
      OR: [
        { progress: { none: { userId: user.id } } },
        {
          progress: {
            some: { userId: user.id, status: { not: "COMPLETED" as const } },
          },
        },
      ],
    };
    const nextOrderBy = [
      { unit: { level: { sortOrder: "asc" as const } } },
      { unit: { sortOrder: "asc" as const } },
      { sortOrder: "asc" as const },
    ];

    if (includeExercises) {
      const next = await prisma.lesson.findFirst({
        where: nextWhere,
        include: {
          unit: { include: { level: true } },
          exercises: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: nextOrderBy,
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

      return {
        data: { lesson: toClientLesson(next) },
        meta: { requestId: request.id },
      };
    }

    const next = await prisma.lesson.findFirst({
      where: nextWhere,
      select: {
        id: true,
        title: true,
        slug: true,
        canDo: true,
        unit: {
          select: {
            id: true,
            title: true,
            level: { select: { code: true } },
          },
        },
      },
      orderBy: nextOrderBy,
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

    return {
      data: {
        lesson: {
          id: next.id,
          title: next.title,
          slug: next.slug,
          canDo: next.canDo,
          unitId: next.unit.id,
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
      include: { exercises: true, unit: { include: { level: true } } },
    });
    if (!lesson) {
      return sendError(reply, 404, "NOT_FOUND", "Lesson not found.");
    }

    const answerMap = new Map(parsed.data.answers.map((item) => [item.exerciseId, item.answer]));

    for (const exercise of lesson.exercises) {
      if (!isUnscoredRequiredType(exercise.type)) continue;
      if (!isSpeakPromptComplete(answerMap.get(exercise.id))) {
        return sendError(
          reply,
          400,
          "VALIDATION_ERROR",
          "Complete all speaking prompts before submitting.",
        );
      }
    }

    let correctCount = 0;
    let scoredTotal = 0;
    const failedWordHints: string[] = [];
    const results = lesson.exercises.map((exercise) => {
      const answer = answerMap.get(exercise.id);
      const payload = exercise.payload as Record<string, unknown>;

      if (isUnscoredRequiredType(exercise.type)) {
        return { exerciseId: exercise.id, correct: true, scored: false, wordId: exercise.wordId };
      }

      if (!isScoredExerciseType(exercise.type)) {
        return { exerciseId: exercise.id, correct: false, scored: false, wordId: exercise.wordId };
      }

      scoredTotal += 1;
      const correct = isAnswerCorrect(exercise.type, payload, answer);
      if (correct) correctCount += 1;
      else if (typeof payload.answer === "string") failedWordHints.push(payload.answer);
      return { exerciseId: exercise.id, correct, scored: true, wordId: exercise.wordId };
    });

    const score = scoredTotal ? correctCount / scoredTotal : 1;
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

        const levelUnits = await prisma.unit.findMany({
          where: { levelId: lesson.unit.levelId },
          select: {
            id: true,
            progress: {
              where: { userId: user.id },
              select: { status: true },
              take: 1,
            },
          },
        });
        const levelDone =
          levelUnits.length > 0 &&
          levelUnits.every((item) => item.progress[0]?.status === "COMPLETED");
        if (levelDone) {
          await prisma.userLevelProgress.upsert({
            where: { userId_levelId: { userId: user.id, levelId: lesson.unit.levelId } },
            create: {
              userId: user.id,
              levelId: lesson.unit.levelId,
              status: "COMPLETED",
              completedAt: now,
            },
            update: { status: "COMPLETED", completedAt: now },
          });
        }
      }
    }

    return {
      data: {
        score,
        correctCount,
        total: scoredTotal,
        passed,
        results,
      },
      meta: { requestId: request.id },
    };
  });
};
