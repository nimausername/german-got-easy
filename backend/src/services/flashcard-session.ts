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
const TOPIC_TOTALS_TTL_MS = 5 * 60 * 1000;

const promptWordSelect = {
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

type TopicTotalsCache = {
  at: number;
  totals: Map<WordTopic, number>;
};

let topicTotalsCache: TopicTotalsCache | null = null;

/**
 * Returns cached per-topic word counts (content is effectively static between seeds).
 */
const getTopicTotals = async (): Promise<Map<WordTopic, number>> => {
  if (topicTotalsCache && Date.now() - topicTotalsCache.at < TOPIC_TOTALS_TTL_MS) {
    return topicTotalsCache.totals;
  }

  const grouped = await prisma.word.groupBy({
    by: ["topic"],
    _count: { _all: true },
  });

  const totals = new Map<WordTopic, number>();
  for (const row of grouped) {
    totals.set(row.topic, row._count._all);
  }
  topicTotalsCache = { at: Date.now(), totals };
  return totals;
};

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
    select: {
      repetitions: true,
      word: { select: promptWordSelect },
    },
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

  const newWords = await prisma.word.findMany({
    where: {
      ...(topicFilter ?? {}),
      progress: { none: { userId: input.userId } },
    },
    select: promptWordSelect,
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
  const [totalByTopic, progress] = await Promise.all([
    getTopicTotals(),
    prisma.userWordProgress.findMany({
      where: { userId },
      select: {
        status: true,
        dueAt: true,
        word: { select: { topic: true } },
      },
    }),
  ]);

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
