"use client";

import type { LucideIcon } from "lucide-react";
import { Check, Meh, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FlashcardRating = "again" | "hard" | "good" | "easy";

type RatingOption = {
  readonly value: FlashcardRating;
  readonly label: string;
  readonly hint: string;
  readonly shortcut: string;
  readonly icon: LucideIcon;
  readonly className: string;
};

const RATING_OPTIONS: readonly RatingOption[] = [
  {
    value: "again",
    label: "Again",
    hint: "Forgot",
    shortcut: "1",
    icon: RotateCcw,
    className:
      "text-destructive hover:bg-destructive/10 hover:text-destructive",
  },
  {
    value: "hard",
    label: "Hard",
    hint: "Struggled",
    shortcut: "2",
    icon: Meh,
    className:
      "text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200",
  },
  {
    value: "good",
    label: "Good",
    hint: "Knew it",
    shortcut: "3",
    icon: Check,
    className: "text-primary hover:bg-primary/10 hover:text-primary",
  },
  {
    value: "easy",
    label: "Easy",
    hint: "Instant",
    shortcut: "4",
    icon: Zap,
    className:
      "text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
  },
] as const;

type FlashcardRatingBarProps = {
  readonly busy: boolean;
  readonly includeAgain: boolean;
  readonly onRate: (rating: FlashcardRating) => void;
  readonly className?: string;
};

/**
 * Minimal spaced-repetition ratings: icon + label with soft color cues.
 */
export const FlashcardRatingBar = ({
  busy,
  includeAgain,
  onRate,
  className,
}: FlashcardRatingBarProps) => {
  const options = includeAgain
    ? RATING_OPTIONS
    : RATING_OPTIONS.filter((option) => option.value !== "again");

  return (
    <div
      className={cn("w-full", className)}
      role="group"
      aria-label="How well did you know this?"
    >
      <div
        className={cn(
          "grid gap-1.5",
          includeAgain ? "grid-cols-4" : "grid-cols-3",
        )}
      >
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => onRate(option.value)}
              className={cn(
                "min-h-12 touch-manipulation flex-col gap-1 rounded-xl px-1 py-2 sm:min-h-11 sm:flex-row sm:gap-1.5 sm:px-2",
                option.className,
              )}
              aria-keyshortcuts={option.shortcut}
              aria-label={`${option.label}: ${option.hint}`}
              title={`${option.label} (${option.shortcut})`}
            >
              <Icon className="size-4 opacity-90 sm:size-3.5" aria-hidden />
              <span className="text-xs font-medium sm:text-sm">{option.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export const RATING_SHORTCUT_MAP: Record<string, FlashcardRating> = {
  "1": "again",
  "2": "hard",
  "3": "good",
  "4": "easy",
};
