"use client";

import { Check, Mic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SpeakPracticePanelProps = {
  readonly modelText: string;
  readonly hint?: string;
  readonly audioUrl?: string | null;
  readonly canPlay: boolean;
  readonly completed: boolean;
  readonly onPlay: () => void;
  readonly onComplete: () => void;
};

/**
 * Compact speaking practice: hear model, say it, confirm — no nested scroll.
 */
export const SpeakPracticePanel = ({
  modelText,
  hint,
  canPlay,
  completed,
  onPlay,
  onComplete,
}: SpeakPracticePanelProps) => (
  <div className="space-y-3">
    {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}

    <div className="rounded-xl bg-muted/50 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Say this
          </p>
          <p className="mt-1 font-display text-xl leading-snug text-brand-ink sm:text-2xl">
            {modelText}
          </p>
        </div>
        {canPlay ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mt-0.5 size-11 shrink-0 touch-manipulation"
            aria-label="Hear speaking model"
            onClick={onPlay}
          >
            <Volume2 className="size-4" />
          </Button>
        ) : null}
      </div>
      {!canPlay ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Audio unavailable — read the line aloud yourself.
        </p>
      ) : null}
    </div>

    <Button
      type="button"
      variant={completed ? "outline" : "default"}
      size="lg"
      className={cn("min-h-11 w-full touch-manipulation", completed && "border-primary/40")}
      aria-pressed={completed}
      onClick={onComplete}
    >
      {completed ? (
        <>
          <Check data-icon="inline-start" />
          Said it
        </>
      ) : (
        <>
          <Mic data-icon="inline-start" />
          I said it
        </>
      )}
    </Button>

    <p className="text-center text-xs text-muted-foreground">
      {completed
        ? "Nice — continue with Next when you are ready."
        : "Listen, say it out loud, then confirm."}
    </p>
  </div>
);
