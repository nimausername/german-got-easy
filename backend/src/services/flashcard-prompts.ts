import type { PartOfSpeech } from "@prisma/client";

export const FLASHCARD_PROMPT_TYPES = [
  "recognize",
  "produce",
  "gender",
  "cloze",
  "plural",
] as const;

export type FlashcardPromptType = (typeof FLASHCARD_PROMPT_TYPES)[number];

export type PromptWord = {
  id: string;
  lemma: string;
  article: string;
  plural: string | null;
  translation: string;
  partOfSpeech: PartOfSpeech;
  exampleDe: string;
  exampleEn: string;
  usageNote: string | null;
};

export type SessionCard = {
  wordId: string;
  lemma: string;
  article: string | null;
  plural: string | null;
  translation: string;
  exampleDe: string;
  exampleEn: string;
  usageNote: string | null;
  partOfSpeech: PartOfSpeech;
  mode: "new" | "review";
  promptType: FlashcardPromptType;
  prompt: string;
  hint: string | null;
  clozeSentence: string | null;
  acceptedAnswers: string[];
};

const normalizeAnswer = (value: string) =>
  value
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+$/g, "");

const germanForm = (article: string, lemma: string) =>
  article ? `${article} ${lemma}` : lemma;

/**
 * Builds cloze text by blanking the lemma (case-insensitive) in the example.
 */
export const buildClozeSentence = (exampleDe: string, lemma: string) => {
  const escaped = lemma.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");
  if (!pattern.test(exampleDe)) return null;
  return exampleDe.replace(pattern, "____");
};

/**
 * Returns prompt types available for a word.
 */
export const availablePromptTypes = (word: PromptWord): FlashcardPromptType[] => {
  const types: FlashcardPromptType[] = ["recognize", "produce"];

  if (word.partOfSpeech === "NOUN" && word.article) {
    types.push("gender");
  }

  if (buildClozeSentence(word.exampleDe, word.lemma)) {
    types.push("cloze");
  }

  if (word.partOfSpeech === "NOUN" && word.plural) {
    types.push("plural");
  }

  return types;
};

/**
 * Picks a prompt type from progress stage so new words start with recognition.
 */
export const selectPromptType = (
  word: PromptWord,
  mode: "new" | "review",
  repetitions: number,
): FlashcardPromptType => {
  const available = availablePromptTypes(word);

  if (mode === "new" || repetitions === 0) {
    return "recognize";
  }

  if (repetitions === 1) {
    if (available.includes("gender")) return "gender";
    if (available.includes("cloze")) return "cloze";
    return "produce";
  }

  const reviewPool = available.filter((type) => type !== "recognize");
  const pool = reviewPool.length > 0 ? reviewPool : available;
  const index = repetitions % pool.length;
  return pool[index] ?? "recognize";
};

const acceptedForPrompt = (
  word: PromptWord,
  promptType: FlashcardPromptType,
): string[] => {
  switch (promptType) {
    case "recognize":
      return [normalizeAnswer(word.translation)];
    case "produce":
      return [
        normalizeAnswer(germanForm(word.article, word.lemma)),
        normalizeAnswer(word.lemma),
      ];
    case "gender":
      return [normalizeAnswer(word.article)];
    case "cloze":
      return [normalizeAnswer(word.lemma)];
    case "plural":
      return word.plural ? [normalizeAnswer(word.plural)] : [];
    default:
      return [];
  }
};

/**
 * Builds a session card payload for one word + prompt type.
 */
export const buildSessionCard = (
  word: PromptWord,
  mode: "new" | "review",
  promptType: FlashcardPromptType,
): SessionCard => {
  const article = word.article || null;
  const form = germanForm(word.article, word.lemma);

  switch (promptType) {
    case "produce":
      return {
        wordId: word.id,
        lemma: word.lemma,
        article,
        plural: word.plural,
        translation: word.translation,
        exampleDe: word.exampleDe,
        exampleEn: word.exampleEn,
        usageNote: word.usageNote,
        partOfSpeech: word.partOfSpeech,
        mode,
        promptType,
        prompt: `How do you say “${word.translation}” in German?`,
        hint: article ? "Include the article if it is a noun." : "Type the German word.",
        clozeSentence: null,
        acceptedAnswers: acceptedForPrompt(word, promptType),
      };
    case "gender":
      return {
        wordId: word.id,
        lemma: word.lemma,
        article,
        plural: word.plural,
        translation: word.translation,
        exampleDe: word.exampleDe,
        exampleEn: word.exampleEn,
        usageNote: word.usageNote,
        partOfSpeech: word.partOfSpeech,
        mode,
        promptType,
        prompt: `Which article goes with “${word.lemma}”?`,
        hint: word.translation,
        clozeSentence: null,
        acceptedAnswers: acceptedForPrompt(word, promptType),
      };
    case "cloze":
      return {
        wordId: word.id,
        lemma: word.lemma,
        article,
        plural: word.plural,
        translation: word.translation,
        exampleDe: word.exampleDe,
        exampleEn: word.exampleEn,
        usageNote: word.usageNote,
        partOfSpeech: word.partOfSpeech,
        mode,
        promptType,
        prompt: "Fill in the missing German word.",
        hint: word.translation,
        clozeSentence: buildClozeSentence(word.exampleDe, word.lemma),
        acceptedAnswers: acceptedForPrompt(word, promptType),
      };
    case "plural":
      return {
        wordId: word.id,
        lemma: word.lemma,
        article,
        plural: word.plural,
        translation: word.translation,
        exampleDe: word.exampleDe,
        exampleEn: word.exampleEn,
        usageNote: word.usageNote,
        partOfSpeech: word.partOfSpeech,
        mode,
        promptType,
        prompt: `What is the plural of “${form}”?`,
        hint: word.translation,
        clozeSentence: null,
        acceptedAnswers: acceptedForPrompt(word, promptType),
      };
    case "recognize":
    default:
      return {
        wordId: word.id,
        lemma: word.lemma,
        article,
        plural: word.plural,
        translation: word.translation,
        exampleDe: word.exampleDe,
        exampleEn: word.exampleEn,
        usageNote: word.usageNote,
        partOfSpeech: word.partOfSpeech,
        mode,
        promptType: "recognize",
        prompt: "What does this mean?",
        hint: null,
        clozeSentence: null,
        acceptedAnswers: acceptedForPrompt(word, "recognize"),
      };
  }
};

/**
 * Grades a typed or multiple-choice answer against accepted forms.
 */
export const gradeAnswer = (
  answer: string,
  acceptedAnswers: string[],
): boolean => {
  const normalized = normalizeAnswer(answer);
  return acceptedAnswers.some((accepted) => accepted === normalized);
};

export { normalizeAnswer };
