import { env } from "../lib/env.js";
import { releaseNextWords } from "./word-release.js";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Runs today's drip if not already done. Safe to call on every API boot.
 */
export const runWordReleaseCatchUp = async (log?: {
  info: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
}): Promise<void> => {
  try {
    const result = await releaseNextWords({
      limit: env.WORD_DAILY_RELEASE_LIMIT,
    });
    log?.info(
      {
        releaseDate: result.releaseDate,
        alreadyReleasedToday: result.alreadyReleasedToday,
        releasedCount: result.releasedCount,
        remainingQueued: result.remainingQueued,
      },
      "word_release_catch_up",
    );
  } catch (error) {
    log?.error({ err: error }, "word_release_catch_up_failed");
  }
};

/**
 * Polls hourly so a long-running API process unlocks the next UTC day without redeploy.
 */
export const startWordReleaseScheduler = (log?: {
  info: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
}): (() => void) => {
  if (!env.WORD_RELEASE_CRON_ENABLED) {
    return () => undefined;
  }

  void runWordReleaseCatchUp(log);

  const timer = setInterval(() => {
    void runWordReleaseCatchUp(log);
  }, HOUR_MS);
  timer.unref?.();

  return () => {
    clearInterval(timer);
  };
};
