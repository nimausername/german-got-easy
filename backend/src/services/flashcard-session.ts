import type { WordTopic } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  buildSessionCard,
  selectPromptType,
  type PromptWord,
} from "./flashcard-prompts.js";
import { TOPIC_CATALOG, type WordTopicId } from "./flashcard-topics.js";

const SESSION_SIZE = 20;
const DUE_CAP = 15;

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

const publicCard = (card: ReturnType<typeof buildSessionCard>) => {
  const { acceptedAnswers: _acceptedAnswers, ...rest } = card;
  return rest;
};

export type SessionMode = "topic" | "due";

/**
 * Builds a study session: topic learning (due + new) or all-due review.
 */
export const buildFlashcardSession = async (input: {
  userId: string;
  mode: SessionMode;
  topic?: WordTopicId;
}) => {
  const topicFilter = input.mode === "topic" && input.topic ? { topic: input.topic } : undefined;

  const due = await prisma.userWordProgress.findMany({
    where: {
      userId: input.userId,
      dueAt: { lte: new Date() },
      status: { in: ["LEARNING", "REVIEW", "KNOWN"] },
      ...(topicFilter ? { word: topicFilter } : {}),
    },
    include: { word: true },
    orderBy: { dueAt: "asc" },
    take: DUE_CAP,
  });

  const dueCards = due.map((row) => {
    const word = toPromptWord(row.word);
    const promptType = selectPromptType(word, "review", row.repetitions);
    return publicCard(buildSessionCard(word, "review", promptType));
  });

  if (input.mode === "due") {
    return {
      cards: dueCards,
      mode: input.mode,
      topic: null,
      newLimit: 0,
    };
  }

  const existingIds = new Set(
    (
      await prisma.userWordProgress.findMany({
        where: { userId: input.userId },
        select: { wordId: true },
      })
    ).map((row) => row.wordId),
  );

  const newWords = await prisma.word.findMany({
    where: {
      ...(topicFilter ?? {}),
      id: { notIn: [...existingIds] },
    },
    orderBy: { frequencyRank: "asc" },
    take: Math.max(0, SESSION_SIZE - due.length),
  });

  const newCards = newWords.map((wordRow) => {
    const word = toPromptWord(wordRow);
    const promptType = selectPromptType(word, "new", 0);
    return publicCard(buildSessionCard(word, "new", promptType));
  });

  return {
    cards: [...dueCards, ...newCards],
    mode: input.mode,
    topic: input.topic ?? null,
    newLimit: SESSION_SIZE,
  };
};

/**
 * Returns topic cards with due / learning / known / remaining-new counts.
 */
export const listTopicProgress = async (userId: string) => {
  const now = new Date();
  const [wordRows, progress] = await Promise.all([
    prisma.word.findMany({
      select: { topic: true },
    }),
    prisma.userWordProgress.findMany({
      where: { userId },
      select: {
        status: true,
        dueAt: true,
        word: { select: { topic: true } },
      },
    }),
  ]);

  const totalByTopic = new Map<WordTopic, number>();
  for (const row of wordRows) {
    totalByTopic.set(row.topic, (totalByTopic.get(row.topic) ?? 0) + 1);
  }

  const stats = new Map<
    WordTopic,
    { due: number; learning: number; known: number; started: number }
  >();

  for (const topic of TOPIC_CATALOG) {
    stats.set(topic.id, { due: 0, learning: 0, known: 0, started: 0 });
  }

  for (const row of progress) {
    const topic = row.word.topic;
    const current = stats.get(topic) ?? { due: 0, learning: 0, known: 0, started: 0 };
    current.started += 1;
    if (row.status === "LEARNING" || row.status === "REVIEW") current.learning += 1;
    if (row.status === "KNOWN") current.known += 1;
    if (row.dueAt <= now && row.status !== "NEW") current.due += 1;
    stats.set(topic, current);
  }

  const topics = TOPIC_CATALOG.map((meta) => {
    const total = totalByTopic.get(meta.id) ?? 0;
    const current = stats.get(meta.id) ?? { due: 0, learning: 0, known: 0, started: 0 };
    return {
      id: meta.id,
      title: meta.title,
      description: meta.description,
      sortOrder: meta.sortOrder,
      wordCount: total,
      dueCount: current.due,
      learningCount: current.learning,
      knownCount: current.known,
      newCount: Math.max(0, total - current.started),
    };
  }).filter((topic) => topic.wordCount > 0);

  const dueTotal = topics.reduce((sum, topic) => sum + topic.dueCount, 0);

  return { topics, dueTotal };
};
