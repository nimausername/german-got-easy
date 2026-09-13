export type FlashcardRating = "again" | "hard" | "good" | "easy";
export type WordProgressStatus = "NEW" | "LEARNING" | "REVIEW" | "KNOWN";

export type ScheduleInput = {
  rating: FlashcardRating;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

export type ScheduleResult = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  status: Exclude<WordProgressStatus, "NEW">;
  requeueInSession: boolean;
};

/** Short retry delay after "again" (~10 minutes) for the next session load. */
const AGAIN_INTERVAL_DAYS = 10 / (24 * 60);

/**
 * SM-2-inspired spaced repetition scheduler tuned for vocabulary.
 */
export const scheduleFlashcard = (input: ScheduleInput): ScheduleResult => {
  let { easeFactor, intervalDays, repetitions } = input;
  const { rating } = input;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = AGAIN_INTERVAL_DAYS;
    easeFactor = Math.max(1.3, easeFactor - 0.2);

    return {
      easeFactor,
      intervalDays,
      repetitions,
      dueAt: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000),
      status: "LEARNING",
      requeueInSession: true,
    };
  }

  if (repetitions === 0) intervalDays = rating === "hard" ? 0.5 : 1;
  else if (repetitions === 1) intervalDays = rating === "hard" ? 1 : 3;
  else {
    const multiplier =
      rating === "hard" ? 1.2 : rating === "good" ? easeFactor : easeFactor + 0.15;
    intervalDays = Math.max(1, intervalDays * multiplier);
  }

  repetitions += 1;
  if (rating === "good") easeFactor += 0.05;
  if (rating === "easy") easeFactor += 0.15;
  if (rating === "hard") easeFactor = Math.max(1.3, easeFactor - 0.05);

  const status: ScheduleResult["status"] =
    repetitions >= 5 && intervalDays >= 21
      ? "KNOWN"
      : repetitions >= 2 && intervalDays >= 3
        ? "REVIEW"
        : "LEARNING";

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000),
    status,
    requeueInSession: false,
  };
};
