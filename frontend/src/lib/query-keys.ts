/**
 * Stable query key factory for authenticated product data.
 */
export const queryKeys = {
  me: ["me"] as const,
  levels: ["levels"] as const,
  levelUnits: (code: string) => ["levels", code, "units"] as const,
  pathNext: ["path", "next"] as const,
  unit: (id: string) => ["units", id] as const,
  lesson: (id: string) => ["lessons", id] as const,
  words: (filters: {
    readonly q: string;
    readonly topic: string;
    readonly cefrBand: string;
    readonly status: string;
  }) => ["words", "list", filters] as const,
  word: (id: string) => ["words", "detail", id] as const,
  flashcardTopics: ["flashcards", "topics"] as const,
  placement: ["placement"] as const,
} as const;
