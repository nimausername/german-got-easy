export const VOCAB_TOPICS = [
  { id: "ESSENTIALS", title: "Essentials" },
  { id: "PEOPLE", title: "People" },
  { id: "TIME", title: "Time" },
  { id: "FOOD_DRINK", title: "Food & drink" },
  { id: "HOME", title: "Home" },
  { id: "SCHOOL_WORK", title: "School & work" },
  { id: "TRAVEL", title: "Travel & places" },
  { id: "SHOPPING", title: "Shopping & money" },
  { id: "DESCRIPTIONS", title: "Descriptions" },
] as const;

export const VOCAB_CEFR_BANDS = ["A1", "A2", "B1"] as const;

export const VOCAB_STATUS_FILTERS = [
  { id: "unseen", label: "Not started" },
  { id: "new", label: "New" },
  { id: "learning", label: "Learning" },
  { id: "known", label: "Known" },
] as const;

export type VocabularyImage = {
  url: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

export type VocabularyWord = {
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
  progressStatus: "NEW" | "LEARNING" | "REVIEW" | "KNOWN" | null;
  image: VocabularyImage | null;
};

export type VocabularyWordDetail = VocabularyWord & {
  timesSeen: number;
  timesCorrect: number;
  dueAt: string | null;
  lastReviewedAt: string | null;
};

export type GermanArticle = "der" | "die" | "das";

/**
 * Formats a German headword with optional article.
 */
export const formatGermanLemma = (article: string | null, lemma: string) =>
  article ? `${article} ${lemma}` : lemma;

/**
 * Human label for a word topic id.
 */
export const topicTitle = (topicId: string) =>
  VOCAB_TOPICS.find((topic) => topic.id === topicId)?.title ?? topicId;

/**
 * Human label for learner progress on a vocabulary entry.
 */
export const progressLabel = (status: VocabularyWord["progressStatus"]) => {
  if (!status) return "Not started";
  if (status === "NEW") return "New";
  if (status === "LEARNING" || status === "REVIEW") return "Learning";
  return "Known";
};

/**
 * Normalizes a German article for gender-aware UI.
 */
export const normalizeGermanArticle = (
  article: string | null,
): GermanArticle | null => {
  if (!article) return null;
  const value = article.trim().toLowerCase();
  if (value === "der" || value === "die" || value === "das") return value;
  return null;
};

/**
 * Gender cue colors for der/die/das — a standard German learning convention.
 */
export const articleGenderClass = (article: string | null) => {
  const normalized = normalizeGermanArticle(article);
  if (normalized === "der") return "text-sky-700 bg-sky-100 border-sky-200";
  if (normalized === "die") return "text-rose-700 bg-rose-100 border-rose-200";
  if (normalized === "das") return "text-emerald-800 bg-emerald-100 border-emerald-200";
  return "text-foreground bg-muted border-border";
};

/**
 * Text-only gender color for inline articles in headwords.
 */
export const articleGenderTextClass = (article: string | null) => {
  const normalized = normalizeGermanArticle(article);
  if (normalized === "der") return "text-sky-700 dark:text-sky-300";
  if (normalized === "die") return "text-rose-700 dark:text-rose-300";
  if (normalized === "das") return "text-emerald-700 dark:text-emerald-300";
  return "text-brand-ink";
};

/**
 * Soft gender wash for the study hero atmosphere.
 */
export const articleGenderWashClass = (article: string | null) => {
  const normalized = normalizeGermanArticle(article);
  if (normalized === "der") {
    return "from-sky-50/90 via-card to-card dark:from-sky-950/40 dark:via-card dark:to-card";
  }
  if (normalized === "die") {
    return "from-rose-50/90 via-card to-card dark:from-rose-950/40 dark:via-card dark:to-card";
  }
  if (normalized === "das") {
    return "from-emerald-50/90 via-card to-card dark:from-emerald-950/40 dark:via-card dark:to-card";
  }
  return "from-accent/40 via-card to-card";
};

/**
 * Soft solid gender tint for the forms strip.
 */
export const articleGenderSoftSurfaceClass = (article: string | null) => {
  const normalized = normalizeGermanArticle(article);
  if (normalized === "der") {
    return "border-sky-100 bg-sky-50/90 dark:border-sky-900/60 dark:bg-sky-950/35";
  }
  if (normalized === "die") {
    return "border-rose-100 bg-rose-50/90 dark:border-rose-900/60 dark:bg-rose-950/35";
  }
  if (normalized === "das") {
    return "border-emerald-100 bg-emerald-50/90 dark:border-emerald-900/60 dark:bg-emerald-950/35";
  }
  return "border-border bg-muted/40";
};

/**
 * Readable part-of-speech label for learners.
 */
export const partOfSpeechLabel = (partOfSpeech: string) =>
  partOfSpeech.toLowerCase().replaceAll("_", " ");

/**
 * Rough mastery meter for the detail progress strip (0–100).
 */
export const vocabularyMasteryPercent = (word: VocabularyWordDetail) => {
  if (!word.progressStatus) return 0;
  if (word.progressStatus === "KNOWN") return 100;
  if (word.progressStatus === "NEW") return 20;
  if (word.timesSeen <= 0) return 40;
  const accuracy = word.timesCorrect / word.timesSeen;
  return Math.min(90, Math.round(40 + accuracy * 50));
};

/**
 * Short everyday-frequency cue for motivation without raw rank clutter.
 */
export const frequencyCue = (frequencyRank: number) => {
  if (frequencyRank <= 50) return "Core everyday word";
  if (frequencyRank <= 200) return "Common everyday word";
  if (frequencyRank <= 500) return "Useful everyday word";
  return "In the word bank";
};

/**
 * Whether returning learners should start with meaning hidden for self-check.
 */
export const shouldStartWithMeaningHidden = (
  progressStatus: VocabularyWord["progressStatus"],
) => progressStatus !== null;

/**
 * Compact relative label for due / last-reviewed timestamps.
 */
export const formatVocabularyWhen = (iso: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const absMinutes = Math.round(Math.abs(diffMs) / 60_000);
  const absHours = Math.round(Math.abs(diffMs) / 3_600_000);
  const absDays = Math.round(Math.abs(diffMs) / 86_400_000);
  const isPast = diffMs < 0;

  if (absMinutes < 1) return isPast ? "just now" : "now";
  if (absMinutes < 60) {
    return isPast ? `${absMinutes}m ago` : `in ${absMinutes}m`;
  }
  if (absHours < 48) {
    return isPast ? `${absHours}h ago` : `in ${absHours}h`;
  }
  if (absDays < 14) {
    return isPast ? `${absDays}d ago` : `in ${absDays}d`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};
