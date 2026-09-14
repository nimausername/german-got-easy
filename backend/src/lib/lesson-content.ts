import { z } from "zod";

/**
 * Whitelisted skill tags for Learn lessons.
 */
export const lessonSkillTagSchema = z.enum([
  "grammar",
  "phrases",
  "vocabulary",
  "reading",
  "writing",
  "listening",
  "speaking",
]);

export type LessonSkillTag = z.infer<typeof lessonSkillTagSchema>;

const examplePairSchema = z.object({
  de: z.string().min(1),
  en: z.string().min(1),
});

const phraseItemSchema = z.object({
  de: z.string().min(1),
  en: z.string().min(1),
});

const dialogueLineSchema = z.object({
  speaker: z.string().min(1),
  de: z.string().min(1),
  en: z.string().min(1),
});

/**
 * Ungraded teach blocks shown before practice.
 */
export const teachBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("explain"),
    title: z.string().min(1),
    body: z.string().min(1),
    examples: z.array(examplePairSchema).max(8).optional(),
  }),
  z.object({
    type: z.literal("phrases"),
    title: z.string().min(1),
    items: z.array(phraseItemSchema).min(1).max(12),
  }),
  z.object({
    type: z.literal("pattern"),
    title: z.string().min(1),
    template: z.string().min(1),
    meaning: z.string().min(1),
    examples: z.array(z.string().min(1)).max(8).optional(),
  }),
  z.object({
    type: z.literal("dialogue"),
    title: z.string().min(1),
    lines: z.array(dialogueLineSchema).min(2).max(12),
  }),
  z.object({
    type: z.literal("listen_model"),
    title: z.string().min(1),
    text: z.string().min(1),
    hint: z.string().optional(),
  }),
  z.object({
    type: z.literal("speak_model"),
    title: z.string().min(1),
    prompt: z.string().min(1),
    modelText: z.string().min(1),
    hint: z.string().optional(),
  }),
]);

export type TeachBlock = z.infer<typeof teachBlockSchema>;

/**
 * Parses and validates teachBlocks JSON from the database or seed files.
 */
export const parseTeachBlocks = (value: unknown): TeachBlock[] => {
  const parsed = z.array(teachBlockSchema).safeParse(value ?? []);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
};

/**
 * Exercise types that count toward the lesson score.
 */
export const SCORED_EXERCISE_TYPES = new Set([
  "mcq",
  "cloze",
  "short_write",
  "reorder",
  "match",
  "listen_mcq",
]);

/**
 * Exercise types that must be completed but are excluded from the score.
 */
export const UNSCORED_REQUIRED_TYPES = new Set(["speak_prompt"]);

/**
 * Returns true when the exercise type is graded for the pass score.
 */
export const isScoredExerciseType = (type: string): boolean =>
  SCORED_EXERCISE_TYPES.has(type);

/**
 * Returns true when the exercise must be completed but is not scored.
 */
export const isUnscoredRequiredType = (type: string): boolean =>
  UNSCORED_REQUIRED_TYPES.has(type);
