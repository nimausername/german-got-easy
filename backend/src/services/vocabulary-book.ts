import type { CefrBand, Prisma, WordProgressStatus, WordTopic } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { isWordTopic, WORD_TOPICS } from "./flashcard-topics.js";

export const VOCAB_STATUS_FILTERS = ["unseen", "new", "learning", "known"] as const;
export type VocabStatusFilter = (typeof VOCAB_STATUS_FILTERS)[number];

export const CEFR_BANDS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 100;

export type VocabularyListQuery = {
  q?: string;
  topic?: WordTopic;
  cefrBand?: CefrBand;
  status?: VocabStatusFilter;
  cursor?: string;
  limit?: number;
};

export type VocabularyImage = {
  url: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

export type VocabularyWordSummary = {
  id: string;
  lemma: string;
  article: string | null;
  plural: string | null;
  translation: string;
  partOfSpeech: string;
  cefrBand: string;
  topic: string;
  exampleDe: string;
  exampleEn: string;
  examplePluralDe: string | null;
  examplePluralEn: string | null;
  usageNote: string | null;
  frequencyRank: number;
  progressStatus: WordProgressStatus | null;
  image: VocabularyImage | null;
};

export type VocabularyWordDetail = VocabularyWordSummary & {
  timesSeen: number;
  timesCorrect: number;
  dueAt: string | null;
  lastReviewedAt: string | null;
};

type WordCursor = {
  frequencyRank: number;
  id: string;
};

/**
 * Encodes a frequency/id cursor for vocabulary pagination.
 */
export const encodeVocabCursor = (cursor: WordCursor): string =>
  Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");

/**
 * Decodes a vocabulary list cursor. Returns null when the value is invalid.
 */
export const decodeVocabCursor = (value: string): WordCursor | null => {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as WordCursor).frequencyRank !== "number" ||
      typeof (parsed as WordCursor).id !== "string" ||
      !(parsed as WordCursor).id
    ) {
      return null;
    }
    return {
      frequencyRank: (parsed as WordCursor).frequencyRank,
      id: (parsed as WordCursor).id,
    };
  } catch {
    return null;
  }
};

/**
 * Returns true when the value is a supported vocabulary status filter.
 */
export const isVocabStatusFilter = (value: string): value is VocabStatusFilter =>
  (VOCAB_STATUS_FILTERS as readonly string[]).includes(value);

/**
 * Returns true when the value is a supported CEFR band.
 */
export const isCefrBand = (value: string): value is CefrBand =>
  (CEFR_BANDS as readonly string[]).includes(value);

/**
 * Builds the Prisma where clause for vocabulary list filters.
 */
export const buildVocabularyWhere = (input: {
  userId: string;
  q?: string;
  topic?: WordTopic;
  cefrBand?: CefrBand;
  status?: VocabStatusFilter;
  cursor?: WordCursor | null;
}): Prisma.WordWhereInput => {
  const and: Prisma.WordWhereInput[] = [];

  if (input.topic) {
    and.push({ topic: input.topic });
  }
  if (input.cefrBand) {
    and.push({ cefrBand: input.cefrBand });
  }

  const query = input.q?.trim();
  if (query) {
    and.push({
      OR: [
        { lemma: { contains: query, mode: "insensitive" } },
        { translation: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (input.status === "unseen") {
    and.push({ progress: { none: { userId: input.userId } } });
  } else if (input.status === "new") {
    and.push({
      progress: { some: { userId: input.userId, status: "NEW" } },
    });
  } else if (input.status === "learning") {
    and.push({
      progress: {
        some: {
          userId: input.userId,
          status: { in: ["LEARNING", "REVIEW"] },
        },
      },
    });
  } else if (input.status === "known") {
    and.push({
      progress: { some: { userId: input.userId, status: "KNOWN" } },
    });
  }

  if (input.cursor) {
    and.push({
      OR: [
        { frequencyRank: { gt: input.cursor.frequencyRank } },
        {
          AND: [
            { frequencyRank: input.cursor.frequencyRank },
            { id: { gt: input.cursor.id } },
          ],
        },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
};

const toArticle = (article: string): string | null => (article ? article : null);

const toImage = (word: {
  imageUrl: string | null;
  imageCredit: string | null;
  imageLicense: string | null;
  imageSourceUrl: string | null;
}): VocabularyImage | null => {
  if (!word.imageUrl) return null;
  return {
    url: word.imageUrl,
    credit: word.imageCredit?.trim() || "Unknown",
    license: word.imageLicense?.trim() || "Unknown",
    sourceUrl: word.imageSourceUrl?.trim() || word.imageUrl,
  };
};

const toSummary = (word: {
  id: string;
  lemma: string;
  article: string;
  plural: string | null;
  translation: string;
  partOfSpeech: string;
  cefrBand: string;
  topic: string;
  exampleDe: string;
  exampleEn: string;
  examplePluralDe: string | null;
  examplePluralEn: string | null;
  usageNote: string | null;
  frequencyRank: number;
  imageUrl: string | null;
  imageCredit: string | null;
  imageLicense: string | null;
  imageSourceUrl: string | null;
  progress: Array<{ status: WordProgressStatus }>;
}): VocabularyWordSummary => ({
  id: word.id,
  lemma: word.lemma,
  article: toArticle(word.article),
  plural: word.plural,
  translation: word.translation,
  partOfSpeech: word.partOfSpeech,
  cefrBand: word.cefrBand,
  topic: word.topic,
  exampleDe: word.exampleDe,
  exampleEn: word.exampleEn,
  examplePluralDe: word.examplePluralDe,
  examplePluralEn: word.examplePluralEn,
  usageNote: word.usageNote,
  frequencyRank: word.frequencyRank,
  progressStatus: word.progress[0]?.status ?? null,
  image: toImage(word),
});

/**
 * Lists vocabulary words with search, filters, progress, and cursor pagination.
 * `totalInBank` is the full curated word count; `matchedCount` applies current filters.
 */
export const listVocabularyWords = async (input: {
  userId: string;
  query: VocabularyListQuery;
}): Promise<{
  words: VocabularyWordSummary[];
  nextCursor: string | null;
  limit: number;
  totalInBank: number;
  matchedCount: number;
}> => {
  const limit = Math.min(Math.max(input.query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const cursor = input.query.cursor ? decodeVocabCursor(input.query.cursor) : null;
  if (input.query.cursor && !cursor) {
    throw Object.assign(new Error("Invalid cursor."), { statusCode: 400 });
  }

  const filterInput = {
    userId: input.userId,
    q: input.query.q,
    topic: input.query.topic,
    cefrBand: input.query.cefrBand,
    status: input.query.status,
  };
  const matchWhere = buildVocabularyWhere(filterInput);
  const pageWhere = buildVocabularyWhere({ ...filterInput, cursor });

  const [rows, matchedCount, totalInBank] = await Promise.all([
    prisma.word.findMany({
      where: pageWhere,
      orderBy: [{ frequencyRank: "asc" }, { id: "asc" }],
      take: limit + 1,
      include: {
        progress: {
          where: { userId: input.userId },
          select: { status: true },
          take: 1,
        },
      },
    }),
    prisma.word.count({ where: matchWhere }),
    prisma.word.count(),
  ]);

  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeVocabCursor({ frequencyRank: last.frequencyRank, id: last.id })
      : null;

  return {
    words: page.map(toSummary),
    nextCursor,
    limit,
    totalInBank,
    matchedCount,
  };
};

/**
 * Loads a single vocabulary word with the learner's progress details.
 */
export const getVocabularyWord = async (input: {
  userId: string;
  wordId: string;
}): Promise<VocabularyWordDetail | null> => {
  const word = await prisma.word.findUnique({
    where: { id: input.wordId },
    include: {
      progress: {
        where: { userId: input.userId },
        select: {
          status: true,
          timesSeen: true,
          timesCorrect: true,
          dueAt: true,
          lastReviewedAt: true,
        },
        take: 1,
      },
    },
  });

  if (!word) return null;

  const progress = word.progress[0];
  return {
    ...toSummary(word),
    timesSeen: progress?.timesSeen ?? 0,
    timesCorrect: progress?.timesCorrect ?? 0,
    dueAt: progress?.dueAt?.toISOString() ?? null,
    lastReviewedAt: progress?.lastReviewedAt?.toISOString() ?? null,
  };
};

/**
 * Parses and validates vocabulary list query parameters.
 */
export const parseVocabularyListQuery = (
  raw: Record<string, unknown>,
): { ok: true; data: VocabularyListQuery } | { ok: false; message: string } => {
  const q = typeof raw.q === "string" ? raw.q : undefined;
  const cursor = typeof raw.cursor === "string" ? raw.cursor : undefined;

  let topic: WordTopic | undefined;
  if (typeof raw.topic === "string" && raw.topic.length > 0) {
    if (!isWordTopic(raw.topic)) {
      return { ok: false, message: "Invalid topic filter." };
    }
    topic = raw.topic;
  }

  let cefrBand: CefrBand | undefined;
  const bandRaw = typeof raw.cefrBand === "string" ? raw.cefrBand : undefined;
  if (bandRaw) {
    if (!isCefrBand(bandRaw)) {
      return { ok: false, message: "Invalid cefrBand filter." };
    }
    cefrBand = bandRaw;
  }

  let status: VocabStatusFilter | undefined;
  if (typeof raw.status === "string" && raw.status.length > 0) {
    if (!isVocabStatusFilter(raw.status)) {
      return { ok: false, message: "Invalid status filter." };
    }
    status = raw.status;
  }

  let limit: number | undefined;
  if (raw.limit !== undefined && raw.limit !== "") {
    const parsed = Number(raw.limit);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return { ok: false, message: "Invalid limit." };
    }
    limit = parsed;
  }

  return {
    ok: true,
    data: { q, topic, cefrBand, status, cursor, limit },
  };
};

export { WORD_TOPICS };
