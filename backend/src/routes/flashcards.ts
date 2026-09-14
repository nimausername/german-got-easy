import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sendError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import {
  buildSessionCard,
  FLASHCARD_PROMPT_TYPES,
  gradeAnswer,
  type FlashcardPromptType,
  type PromptWord,
} from "../services/flashcard-prompts.js";
import { buildFlashcardSession, listTopicProgress } from "../services/flashcard-session.js";
import { scheduleFlashcard } from "../services/flashcard-scheduler.js";
import { WORD_TOPICS } from "../services/flashcard-topics.js";

const ratingSchema = z.enum(["again", "hard", "good", "easy"]);

const answerBodySchema = z.object({
  rating: ratingSchema.optional(),
  promptType: z.enum(FLASHCARD_PROMPT_TYPES).default("recognize"),
  answer: z.string().trim().min(1).max(120).optional(),
});

const sessionQuerySchema = z.object({
  mode: z.enum(["topic", "due"]).default("topic"),
  topic: z.enum(WORD_TOPICS).optional(),
});

const toPromptWord = (word: {
  id: string;
  lemma: string;
  article: string;
  plural: string | null;
  translation: string;
  partOfSpeech: PromptWord["partOfSpeech"];
  exampleDe: string;
  exampleEn: string;
  usageNote: string | null;
}): PromptWord => word;

export const flashcardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/v1/flashcards/topics", async (request, reply) => {
    const user = request.currentUser;
    if (!user) return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");

    const progress = await listTopicProgress(user.id);
    return {
      data: progress,
      meta: { requestId: request.id },
    };
  });

  app.get("/v1/flashcards/session", async (request, reply) => {
    const user = request.currentUser;
    if (!user) return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");

    const parsed = sessionQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Invalid session query.");
    }

    if (parsed.data.mode === "topic" && !parsed.data.topic) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Topic is required for topic mode.");
    }

    const session = await buildFlashcardSession({
      userId: user.id,
      mode: parsed.data.mode,
      topic: parsed.data.topic,
    });

    return {
      data: session,
      meta: { requestId: request.id },
    };
  });

  app.post("/v1/flashcards/:wordId/answer", async (request, reply) => {
    const user = request.currentUser;
    if (!user) return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");

    const { wordId } = request.params as { wordId: string };
    const parsed = answerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Invalid answer payload.");
    }

    const promptSelect = {
      id: true,
      lemma: true,
      article: true,
      plural: true,
      translation: true,
      partOfSpeech: true,
      exampleDe: true,
      exampleEn: true,
      usageNote: true,
    } as const;

    const [wordRow, existing] = await Promise.all([
      prisma.word.findUnique({ where: { id: wordId }, select: promptSelect }),
      prisma.userWordProgress.findUnique({
        where: { userId_wordId: { userId: user.id, wordId } },
      }),
    ]);
    if (!wordRow) return sendError(reply, 404, "NOT_FOUND", "Word not found.");

    const word = toPromptWord(wordRow);
    const promptType = parsed.data.promptType as FlashcardPromptType;
    const card = buildSessionCard(word, "review", promptType);

    let rating = parsed.data.rating;
    let answerCorrect: boolean | null = null;

    if (promptType !== "recognize") {
      if (!parsed.data.answer) {
        return sendError(reply, 400, "VALIDATION_ERROR", "Answer is required for this prompt.");
      }
      answerCorrect = gradeAnswer(parsed.data.answer, card.acceptedAnswers);
      if (!answerCorrect) {
        rating = "again";
      } else if (!rating) {
        return {
          data: {
            correct: true,
            rating: null,
            requeueInSession: false,
            expected: null,
            progress: null,
          },
          meta: { requestId: request.id },
        };
      }
    }

    if (!rating) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Rating is required.");
    }

    const next = scheduleFlashcard({
      rating,
      easeFactor: existing?.easeFactor ?? 2.5,
      intervalDays: existing?.intervalDays ?? 0,
      repetitions: existing?.repetitions ?? 0,
    });

    const progress = await prisma.userWordProgress.upsert({
      where: { userId_wordId: { userId: user.id, wordId } },
      create: {
        userId: user.id,
        wordId,
        status: next.status,
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        dueAt: next.dueAt,
        timesSeen: 1,
        timesCorrect: rating === "again" ? 0 : 1,
        lastReviewedAt: new Date(),
      },
      update: {
        status: next.status,
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        dueAt: next.dueAt,
        timesSeen: { increment: 1 },
        timesCorrect: rating === "again" ? undefined : { increment: 1 },
        lastReviewedAt: new Date(),
      },
    });

    return {
      data: {
        correct: answerCorrect,
        rating,
        requeueInSession: next.requeueInSession,
        expected:
          answerCorrect === false
            ? {
                article: word.article || null,
                lemma: word.lemma,
                plural: word.plural,
                translation: word.translation,
                exampleDe: word.exampleDe,
                exampleEn: word.exampleEn,
              }
            : null,
        progress: {
          wordId: progress.wordId,
          status: progress.status,
          dueAt: progress.dueAt,
          intervalDays: progress.intervalDays,
        },
      },
      meta: { requestId: request.id },
    };
  });
};
