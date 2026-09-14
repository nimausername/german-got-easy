"use client";

import { Volume2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { ReorderWordsPanel } from "@/components/learn/reorder-words-panel";
import { SpeakPracticePanel } from "@/components/learn/speak-practice-panel";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { LessonExercise } from "@/lib/learn";
import { canPlayGerman, canSpeakGerman, playGerman } from "@/lib/tts";
import { cn } from "@/lib/utils";

type LessonExerciseViewProps = {
  readonly exercise: LessonExercise;
  readonly value: unknown;
  readonly onAnswer: (value: unknown) => void;
};

const subscribeNoop = () => () => undefined;

const isSpeakCompleted = (value: unknown): boolean =>
  value === true ||
  (typeof value === "object" &&
    value !== null &&
    (value as { completed?: boolean }).completed === true);

/**
 * Returns true when the current exercise answer is ready to advance.
 */
export const isExerciseAnswerReady = (
  exercise: LessonExercise,
  value: unknown,
): boolean => {
  if (exercise.type === "speak_prompt") {
    return isSpeakCompleted(value);
  }

  if (value === undefined || value === null || value === "") return false;

  if (exercise.type === "match") {
    const lefts = Array.isArray(exercise.payload.lefts)
      ? (exercise.payload.lefts as string[])
      : [];
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const map = value as Record<string, string>;
    return (
      Object.keys(map).length >= lefts.length &&
      lefts.every((left) => Boolean(map[left]))
    );
  }

  if (exercise.type === "reorder") {
    const tokens = Array.isArray(exercise.payload.tokens)
      ? (exercise.payload.tokens as string[])
      : [];
    return tokens.length > 0;
  }

  return true;
};

/**
 * Interactive practice control for one lesson exercise.
 */
export const LessonExerciseView = ({
  exercise,
  value,
  onAnswer,
}: LessonExerciseViewProps) => {
  const browserTts = useSyncExternalStore(
    subscribeNoop,
    canSpeakGerman,
    () => false,
  );

  const speakText =
    typeof exercise.payload.speakText === "string" ? exercise.payload.speakText : "";
  const modelText =
    typeof exercise.payload.modelText === "string" ? exercise.payload.modelText : "";
  const hint = typeof exercise.payload.hint === "string" ? exercise.payload.hint : "";
  const audioUrl =
    typeof exercise.payload.audioUrl === "string" ? exercise.payload.audioUrl : undefined;
  const canPlaySpeak = canPlayGerman(audioUrl) || browserTts;

  return (
    <div className="space-y-3">
      {(exercise.type === "mcq" || exercise.type === "listen_mcq") &&
        Array.isArray(exercise.payload.options) && (
          <>
            {exercise.type === "listen_mcq" ? (
              <div className="mb-2">
                {canPlaySpeak && speakText ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11 touch-manipulation"
                    aria-label="Play listening prompt"
                    onClick={() => playGerman(speakText, audioUrl)}
                  >
                    <Volume2 data-icon="inline-start" />
                    Play audio
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Audio unavailable. Spoken text: {speakText || "—"}
                  </p>
                )}
              </div>
            ) : null}
            {(exercise.payload.options as string[]).map((option) => (
              <Button
                key={option}
                type="button"
                variant={value === option ? "default" : "outline"}
                className={cn(
                  "h-auto min-h-12 w-full justify-start px-4 py-3.5 text-left touch-manipulation whitespace-normal text-base",
                  value === option && "ring-2 ring-ring/40",
                )}
                onClick={() => onAnswer(option)}
              >
                {option}
              </Button>
            ))}
          </>
        )}

      {(exercise.type === "cloze" || exercise.type === "short_write") && (
        <Field>
          <FieldLabel htmlFor={`lesson-answer-${exercise.id}`} className="sr-only">
            Your answer
          </FieldLabel>
          <Input
            id={`lesson-answer-${exercise.id}`}
            className="min-h-11 text-base"
            value={String(value ?? "")}
            onChange={(event) => onAnswer(event.target.value)}
            aria-label="Your answer"
          />
        </Field>
      )}

      {exercise.type === "reorder" && Array.isArray(exercise.payload.tokens) ? (
        <ReorderWordsPanel
          key={exercise.id}
          tokens={exercise.payload.tokens as string[]}
          value={value}
          onChange={onAnswer}
        />
      ) : null}

      {exercise.type === "match" &&
        Array.isArray(exercise.payload.lefts) &&
        Array.isArray(exercise.payload.rights) && (
          <div className="space-y-3">
            {(exercise.payload.lefts as string[]).map((left) => {
              const selected =
                value && typeof value === "object" && !Array.isArray(value)
                  ? String((value as Record<string, string>)[left] ?? "")
                  : "";
              return (
                <Field key={left}>
                  <FieldLabel htmlFor={`match-${exercise.id}-${left}`}>{left}</FieldLabel>
                  <select
                    id={`match-${exercise.id}-${left}`}
                    className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none"
                    value={selected}
                    aria-label={`Match for ${left}`}
                    onChange={(event) => {
                      const prev =
                        value && typeof value === "object" && !Array.isArray(value)
                          ? { ...(value as Record<string, string>) }
                          : {};
                      onAnswer({ ...prev, [left]: event.target.value });
                    }}
                  >
                    <option value="">Choose…</option>
                    {(exercise.payload.rights as string[]).map((right) => (
                      <option key={right} value={right}>
                        {right}
                      </option>
                    ))}
                  </select>
                </Field>
              );
            })}
          </div>
        )}

      {exercise.type === "speak_prompt" && modelText ? (
        <SpeakPracticePanel
          modelText={modelText}
          hint={hint || undefined}
          audioUrl={audioUrl}
          canPlay={canPlaySpeak}
          completed={isSpeakCompleted(value)}
          onPlay={() => playGerman(modelText, audioUrl)}
          onComplete={() => onAnswer({ completed: true })}
        />
      ) : null}
    </div>
  );
};
