/**
 * Shared layout widths for authenticated app pages.
 * Keep primary nav destinations on the same content column so the chrome
 * does not jump when switching Learn / Flashcards / Vocabulary / Dashboard.
 */
export const APP_CONTENT_WIDTH = "2xl" as const;

/**
 * Narrow column for focused study (lesson player, flashcard card stage).
 */
export const STUDY_CONTENT_CLASS = "mx-auto w-full max-w-lg" as const;
