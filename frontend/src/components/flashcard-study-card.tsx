"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FlashcardFlip, FLASHCARD_FACE_HEIGHT } from "@/components/flashcard-flip";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  articleGenderTextClass,
  splitGermanArticles,
} from "@/lib/vocabulary";
import { cn } from "@/lib/utils";

export type StudyPromptType = "recognize" | "produce" | "gender" | "cloze" | "plural";

export type StudyCardItem = {
  readonly wordId: string;
  readonly lemma: string;
  readonly article: string | null;
  readonly plural: string | null;
  readonly translation: string;
  readonly exampleDe: string;
  readonly exampleEn: string;
  readonly usageNote: string | null;
  readonly promptType: StudyPromptType;
  readonly prompt: string;
  readonly hint: string | null;
  readonly clozeSentence: string | null;
};

export type StudyFeedback = {
  readonly correct: boolean | null;
  readonly requeueInSession: boolean;
  readonly expected: {
    readonly article: string | null;
    readonly lemma: string;
    readonly plural: string | null;
    readonly translation: string;
    readonly exampleDe: string;
    readonly exampleEn: string;
  } | null;
};

type FlashcardStudyCardProps = {
  readonly card: StudyCardItem;
  readonly flipped: boolean;
  readonly onFlip: () => void;
  readonly phase: "prompt" | "grade" | "correct";
  readonly feedback: StudyFeedback | null;
  readonly typedAnswer: string;
  readonly onTypedAnswerChange: (value: string) => void;
  readonly onCheck: () => void;
  readonly onGender: (article: string) => void;
  readonly onContinueAfterFail: () => void;
  readonly busy: boolean;
};

const GENDER_OPTIONS = ["der", "die", "das"] as const;

const CardFace = ({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) => (
  <div
    className={cn(
      "flex h-full flex-col justify-between gap-4 overflow-y-auto overscroll-contain p-5 sm:gap-6 sm:p-7 md:p-8",
      className,
    )}
  >
    {children}
  </div>
);

const PromptEyebrow = ({ children }: { readonly children: ReactNode }) => (
  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase sm:text-sm">
    {children}
  </p>
);

const Headword = ({
  article,
  lemma,
  trailing,
}: {
  readonly article?: string | null;
  readonly lemma: string;
  readonly trailing?: ReactNode;
}) => (
  <p className="font-display text-5xl leading-[1.05] break-words text-brand-ink sm:text-6xl md:text-7xl">
    {article ? (
      <>
        <span className={articleGenderTextClass(article)} title="German grammatical gender">
          {article}
        </span>{" "}
      </>
    ) : null}
    {lemma}
    {trailing}
  </p>
);

const GermanExample = ({
  text,
  className,
}: {
  readonly text: string;
  readonly className?: string;
}) => (
  <p className={cn("leading-relaxed break-words", className)}>
    {splitGermanArticles(text).map((part, index) =>
      part.article ? (
        <span
          key={`${part.value}-${index}`}
          className={cn("font-medium", articleGenderTextClass(part.article))}
        >
          {part.value}
        </span>
      ) : (
        <span key={`${part.value}-${index}`}>{part.value}</span>
      ),
    )}
  </p>
);

const PluralLine = ({ plural }: { readonly plural: string }) => (
  <p className="text-sm font-medium text-foreground/90">
    Plural:{" "}
    <span className={articleGenderTextClass("die")} title="Plural article">
      die
    </span>{" "}
    {plural}
  </p>
);

const StaticStudyShell = ({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) => (
  <div
    className={cn(
      "flex w-full flex-col overflow-hidden rounded-2xl bg-card",
      FLASHCARD_FACE_HEIGHT,
      "ring-1 ring-foreground/10",
      "shadow-[0_18px_50px_-28px_oklch(0.35_0.04_220/0.55)]",
      "dark:shadow-[0_18px_50px_-24px_oklch(0_0_0/0.55)]",
      className,
    )}
  >
    {children}
  </div>
);

/**
 * Study surface for one flashcard: flip reveal for recognize, typed prompts otherwise.
 */
export const FlashcardStudyCard = ({
  card,
  flipped,
  onFlip,
  phase,
  feedback,
  typedAnswer,
  onTypedAnswerChange,
  onCheck,
  onGender,
  onContinueAfterFail,
  busy,
}: FlashcardStudyCardProps) => {
  if (card.promptType === "recognize") {
    return (
      <FlashcardFlip
        flipped={flipped}
        onFlip={onFlip}
        frontLabel="Reveal translation and example"
        backLabel="Hide translation"
        backClassName="bg-gradient-to-b from-card to-accent/40 dark:to-accent/25"
        front={
          <CardFace>
            <div className="space-y-4">
              <PromptEyebrow>{card.prompt}</PromptEyebrow>
              <Headword article={card.article} lemma={card.lemma} />
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Tap to reveal — try to recall first
            </p>
          </CardFace>
        }
        back={
          <CardFace>
            <div className="space-y-3 sm:space-y-4">
              <PromptEyebrow>Meaning</PromptEyebrow>
              <p className="font-display text-3xl leading-snug break-words text-brand-ink sm:text-4xl">
                {card.translation}
              </p>
              {card.plural ? <PluralLine plural={card.plural} /> : null}
              <div className="space-y-1.5 border-t border-border/70 pt-3 sm:pt-4">
                <GermanExample text={card.exampleDe} className="text-base sm:text-lg" />
                <p className="text-sm leading-relaxed text-muted-foreground break-words">
                  {card.exampleEn}
                </p>
              </div>
              {card.usageNote ? (
                <p className="text-sm text-muted-foreground">{card.usageNote}</p>
              ) : null}
            </div>
          </CardFace>
        }
      />
    );
  }

  if (phase === "grade" && feedback?.expected) {
    return (
      <StaticStudyShell className="bg-gradient-to-b from-destructive/5 to-card">
        <CardFace>
          <div className="space-y-3">
            <PromptEyebrow>
              <span className="text-destructive">Not quite</span>
            </PromptEyebrow>
            <Headword
              article={feedback.expected.article}
              lemma={feedback.expected.lemma}
              trailing={
                feedback.expected.plural ? (
                  <>
                    {" · "}
                    <span className={articleGenderTextClass("die")}>die</span>{" "}
                    {feedback.expected.plural}
                  </>
                ) : null
              }
            />
            <p className="text-lg font-medium break-words">{feedback.expected.translation}</p>
            <GermanExample
              text={feedback.expected.exampleDe}
              className="text-muted-foreground"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              className="min-h-12 w-full touch-manipulation sm:w-auto"
              onClick={onContinueAfterFail}
            >
              Continue — see it again soon
            </Button>
            <Link
              href={`/vocabulary/${card.wordId}`}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "min-h-11 w-full touch-manipulation sm:w-auto",
              )}
            >
              Open vocabulary
            </Link>
          </div>
        </CardFace>
      </StaticStudyShell>
    );
  }

  if (phase === "correct") {
    return (
      <StaticStudyShell className="bg-gradient-to-b from-accent/50 to-card dark:from-accent/30">
        <CardFace>
          <div className="space-y-3">
            <PromptEyebrow>
              <span className="text-accent-foreground">Correct</span>
            </PromptEyebrow>
            <Headword
              article={card.article}
              lemma={card.lemma}
              trailing={
                card.plural ? (
                  <>
                    {" · "}
                    <span className={articleGenderTextClass("die")}>die</span> {card.plural}
                  </>
                ) : null
              }
            />
            <GermanExample text={card.exampleDe} className="text-muted-foreground" />
            <Link
              href={`/vocabulary/${card.wordId}`}
              className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}
            >
              Open vocabulary entry
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            How hard was that? Rate it to schedule the next review.
          </p>
        </CardFace>
      </StaticStudyShell>
    );
  }

  return (
    <StaticStudyShell>
      <CardFace>
        <div className="space-y-4">
          <PromptEyebrow>{card.prompt}</PromptEyebrow>

          {card.promptType === "produce" ? (
            <>
              <Headword lemma={card.translation} />
              {card.hint ? (
                <p className="text-sm text-muted-foreground">{card.hint}</p>
              ) : null}
              <Field>
                <FieldLabel htmlFor="produce-answer" className="sr-only">
                  German answer
                </FieldLabel>
                <Input
                  id="produce-answer"
                  className="min-h-12 text-base"
                  value={typedAnswer}
                  onChange={(event) => onTypedAnswerChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onCheck();
                  }}
                  placeholder="e.g. das Haus"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Type the German word"
                />
              </Field>
            </>
          ) : null}

          {card.promptType === "gender" ? (
            <>
              <Headword lemma={card.lemma} />
              {card.hint ? (
                <p className="text-sm text-muted-foreground">{card.hint}</p>
              ) : null}
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((article) => (
                  <Button
                    key={article}
                    type="button"
                    variant="outline"
                    className={cn(
                      "min-h-14 touch-manipulation text-base font-semibold",
                      articleGenderTextClass(article),
                    )}
                    disabled={busy}
                    onClick={() => onGender(article)}
                    aria-label={`Choose article ${article}`}
                  >
                    {article}
                  </Button>
                ))}
              </div>
            </>
          ) : null}

          {card.promptType === "cloze" ? (
            <>
              <GermanExample
                text={card.clozeSentence ?? ""}
                className="font-display text-2xl text-brand-ink sm:text-3xl"
              />
              {card.hint ? (
                <p className="text-sm text-muted-foreground">Hint: {card.hint}</p>
              ) : null}
              <Field>
                <FieldLabel htmlFor="cloze-answer" className="sr-only">
                  Missing word
                </FieldLabel>
                <Input
                  id="cloze-answer"
                  className="min-h-12 text-base"
                  value={typedAnswer}
                  onChange={(event) => onTypedAnswerChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onCheck();
                  }}
                  placeholder="Type the missing word"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Type the missing German word"
                />
              </Field>
            </>
          ) : null}

          {card.promptType === "plural" ? (
            <>
              <Headword article={card.article} lemma={card.lemma} />
              {card.hint ? (
                <p className="text-sm text-muted-foreground">{card.hint}</p>
              ) : null}
              <Field>
                <FieldLabel htmlFor="plural-answer" className="sr-only">
                  Plural form
                </FieldLabel>
                <Input
                  id="plural-answer"
                  className="min-h-12 text-base"
                  value={typedAnswer}
                  onChange={(event) => onTypedAnswerChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onCheck();
                  }}
                  placeholder="e.g. Häuser"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Type the plural form"
                />
              </Field>
            </>
          ) : null}
        </div>

        {card.promptType !== "gender" ? (
          <Button
            type="button"
            className="min-h-12 w-full touch-manipulation"
            disabled={busy || !typedAnswer.trim()}
            onClick={onCheck}
          >
            Check answer
          </Button>
        ) : null}
      </CardFace>
    </StaticStudyShell>
  );
};
