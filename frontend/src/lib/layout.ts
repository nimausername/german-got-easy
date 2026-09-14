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

/**
 * Default authenticated page padding: tight top on phones, clears the mobile tab bar.
 * Pass as AuthenticatedShell `className` so it overrides AppShell `py-*`.
 */
export const APP_SHELL_CLASS =
  "py-0 pt-3 sm:pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8" as const;

/**
 * Active study session padding (flashcards in-session). Same tab clearance, tighter top.
 */
export const STUDY_SHELL_CLASS =
  "py-0 pt-2 sm:pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6" as const;

/**
 * Lesson player padding. Bottom tab bar is hidden on `/learn/lessons/*`.
 */
export const LESSON_SHELL_CLASS = "py-0 pt-2 pb-2 sm:pt-3 md:pb-6" as const;
