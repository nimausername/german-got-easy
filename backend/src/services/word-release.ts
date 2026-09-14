import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

/**
 * UTC calendar day key used for release idempotency (YYYY-MM-DD).
 */
export const utcDayKey = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Prisma filter: words visible to learners at `asOf`.
 */
export const releasedWordWhere = (asOf: Date = new Date()): Prisma.WordWhereInput => ({
  releasedAt: { lte: asOf },
});

export type ReleaseNextWordsResult = {
  releaseDate: string;
  alreadyReleasedToday: boolean;
  releasedCount: number;
  remainingQueued: number;
  wordIds: string[];
};

/**
 * Releases up to `limit` queued words for the UTC day of `asOf`.
 * Idempotent per calendar day via WordReleaseDay.
 */
export const releaseNextWords = async (input: {
  limit: number;
  asOf?: Date;
}): Promise<ReleaseNextWordsResult> => {
  const asOf = input.asOf ?? new Date();
  const limit = Math.max(0, Math.floor(input.limit));
  const releaseDate = utcDayKey(asOf);

  const existing = await prisma.wordReleaseDay.findUnique({
    where: { releaseDate },
  });

  const remainingQueued = await prisma.word.count({
    where: { releasedAt: null },
  });

  if (existing) {
    return {
      releaseDate,
      alreadyReleasedToday: true,
      releasedCount: 0,
      remainingQueued,
      wordIds: [],
    };
  }

  if (limit === 0) {
    await prisma.wordReleaseDay.create({
      data: { releaseDate, releasedCount: 0 },
    });
    return {
      releaseDate,
      alreadyReleasedToday: false,
      releasedCount: 0,
      remainingQueued,
      wordIds: [],
    };
  }

  const candidates = await prisma.word.findMany({
    where: { releasedAt: null },
    orderBy: [{ frequencyRank: "asc" }, { id: "asc" }],
    take: limit,
    select: { id: true },
  });

  if (candidates.length === 0) {
    await prisma.wordReleaseDay.create({
      data: { releaseDate, releasedCount: 0 },
    });
    return {
      releaseDate,
      alreadyReleasedToday: false,
      releasedCount: 0,
      remainingQueued: 0,
      wordIds: [],
    };
  }

  const wordIds = candidates.map((row) => row.id);

  await prisma.$transaction([
    prisma.word.updateMany({
      where: { id: { in: wordIds } },
      data: { releasedAt: asOf },
    }),
    prisma.wordReleaseDay.create({
      data: { releaseDate, releasedCount: wordIds.length },
    }),
  ]);

  return {
    releaseDate,
    alreadyReleasedToday: false,
    releasedCount: wordIds.length,
    remainingQueued: Math.max(0, remainingQueued - wordIds.length),
    wordIds,
  };
};
