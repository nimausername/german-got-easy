"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Layers, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  articleGenderSoftSurfaceClass,
  articleGenderTextClass,
  articleGenderWashClass,
  formatGermanLemma,
  formatVocabularyWhen,
  frequencyCue,
  partOfSpeechLabel,
  progressLabel,
  shouldStartWithMeaningHidden,
  topicTitle,
  vocabularyMasteryPercent,
  type VocabularyWordDetail,
} from "@/lib/vocabulary";

type VocabularyWordStudyProps = {
  readonly word: VocabularyWordDetail;
};

type RevealStep = "hidden" | "translation" | "full";

/**
 * Learner-first vocabulary entry: encode German → self-check → forms → practice.
 */
export const VocabularyWordStudy = ({ word }: VocabularyWordStudyProps) => {
  const [revealStep, setRevealStep] = useState<RevealStep>(() =>
    shouldStartWithMeaningHidden(word.progressStatus) ? "hidden" : "full",
  );

  const practiceHref = `/flashcards?topic=${encodeURIComponent(word.topic)}`;
  const headword = formatGermanLemma(word.article, word.lemma);
  const imageAlt = `${headword} — ${word.translation}`;
  const mastery = vocabularyMasteryPercent(word);
  const hasArticle = Boolean(word.article);
  const washClass = articleGenderWashClass(word.article);
  const dueLabel = formatVocabularyWhen(word.dueAt);
  const lastReviewedLabel = formatVocabularyWhen(word.lastReviewedAt);
  const meaningHidden = revealStep === "hidden";
  const exampleEnVisible = revealStep === "full";
  const topicName = topicTitle(word.topic);

  const handleRevealMeaning = () => {
    setRevealStep("translation");
  };

  const handleRevealExampleEn = () => {
    setRevealStep("full");
  };

  const handleHideMeaning = () => {
    setRevealStep("hidden");
  };

  return (
    <article className="mt-6 space-y-8" aria-labelledby="vocab-headword">
      <section
        className={cn(
          "overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b shadow-sm",
          washClass,
        )}
      >
        {word.image ? (
          <figure className="m-0 overflow-hidden border-b border-border/60 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- Wikimedia hotlinks; avoid optimizer redirect failures */}
            <img
              src={word.image.url}
              alt={imageAlt}
              className="aspect-[4/3] h-auto max-h-56 w-full object-cover sm:aspect-[16/9] sm:max-h-52 md:aspect-[21/9]"
              loading="eager"
              referrerPolicy="no-referrer"
            />
            <figcaption className="px-3 py-2 text-[11px] leading-snug text-muted-foreground sm:px-6">
              Photo: {word.image.credit} · {word.image.license} ·{" "}
              <a
                href={word.image.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Commons
              </a>
            </figcaption>
          </figure>
        ) : null}

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-7 sm:py-8">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {frequencyCue(word.frequencyRank)}
            </p>
            <h1
              id="vocab-headword"
              className="font-display text-3xl leading-[1.1] break-words text-brand-ink sm:text-4xl md:text-5xl"
            >
              {hasArticle ? (
                <>
                  <span
                    className={cn(articleGenderTextClass(word.article))}
                    title="German grammatical gender"
                  >
                    {word.article}
                  </span>{" "}
                </>
              ) : null}
              {word.lemma}
            </h1>
          </div>

          <div className="space-y-3">
            <p className="font-display text-xl leading-snug break-words text-brand-ink sm:text-2xl sm:text-[1.75rem]">
              „{word.exampleDe}“
            </p>
            <p className="text-sm text-muted-foreground">
              Read the German first — then check yourself.
            </p>
          </div>

          <div className="space-y-3">
            {meaningHidden ? (
              <div className="rounded-xl border border-dashed border-border/90 bg-background/50 px-4 py-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Meaning hidden for self-check
                </p>
                <Button
                  type="button"
                  className="mt-3 min-h-11 w-full touch-manipulation sm:w-auto"
                  onClick={handleRevealMeaning}
                  aria-label="Reveal English meaning"
                >
                  <Eye data-icon="inline-start" />
                  Reveal meaning
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-lg break-words text-brand-ink sm:text-xl md:text-2xl">
                  {word.translation}
                </p>

                {exampleEnVisible ? (
                  <p className="text-base text-muted-foreground">{word.exampleEn}</p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-0 text-muted-foreground"
                    onClick={handleRevealExampleEn}
                    aria-label="Reveal English example sentence"
                  >
                    Show English sentence
                  </Button>
                )}

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleHideMeaning}
                    aria-pressed={false}
                    aria-label="Hide English meaning for self-check"
                  >
                    <EyeOff data-icon="inline-start" />
                    Hide again
                  </Button>
                </div>
              </div>
            )}
            {meaningHidden ? (
              <p className="sr-only">English meaning is hidden for self-check.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="vocab-forms-heading" className="space-y-3">
        <h2
          id="vocab-forms-heading"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          Forms
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              articleGenderSoftSurfaceClass(word.article),
            )}
          >
            <p className="text-xs text-muted-foreground">Singular</p>
            <p className="mt-1 font-medium text-brand-ink">
              {hasArticle ? (
                <>
                  <span className={articleGenderTextClass(word.article)}>{word.article}</span>{" "}
                  {word.lemma}
                </>
              ) : (
                word.lemma
              )}
            </p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 dark:border-rose-900/60 dark:bg-rose-950/35">
            <p className="text-xs text-muted-foreground">Plural</p>
            <p className="mt-1 font-medium text-brand-ink">
              {word.plural ? (
                <>
                  <span className="text-rose-700 dark:text-rose-300">die</span> {word.plural}
                </>
              ) : (
                <span className="text-muted-foreground">No plural listed</span>
              )}
            </p>
          </div>
        </div>

        {word.examplePluralDe ? (
          <div className="rounded-xl border border-rose-100/80 bg-rose-50/40 px-4 py-4 dark:border-rose-900/50 dark:bg-rose-950/20">
            <p className="text-xs font-semibold tracking-wide text-rose-700 uppercase dark:text-rose-300">
              Plural in context
            </p>
            <p className="mt-2 font-display text-lg leading-snug break-words text-brand-ink sm:text-xl">
              „{word.examplePluralDe}“
            </p>
            {word.examplePluralEn ? (
              meaningHidden ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  English hidden — reveal meaning above to check.
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{word.examplePluralEn}</p>
              )
            ) : null}
          </div>
        ) : null}
      </section>

      {word.usageNote ? (
        <aside className="flex gap-3 rounded-xl border border-brand/15 bg-accent/50 px-4 py-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">
              Tip
            </p>
            <p className="mt-1 text-sm text-foreground">{word.usageNote}</p>
          </div>
        </aside>
      ) : null}

      <section
        aria-labelledby="vocab-progress-heading"
        className="space-y-4 rounded-2xl border border-border/80 bg-card px-5 py-5 sm:px-6"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="vocab-progress-heading" className="text-sm font-semibold text-foreground">
              Your progress
            </h2>
            <p className="text-xs text-muted-foreground">
              {word.timesCorrect}/{word.timesSeen} correct
            </p>
          </div>
          <Progress value={mastery} className="w-full">
            <ProgressLabel>{progressLabel(word.progressStatus)}</ProgressLabel>
            <ProgressValue />
          </Progress>
          {(dueLabel || lastReviewedLabel) && (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {dueLabel ? (
                <div className="flex gap-1">
                  <dt>Next review</dt>
                  <dd className="font-medium text-foreground">{dueLabel}</dd>
                </div>
              ) : null}
              {lastReviewedLabel ? (
                <div className="flex gap-1">
                  <dt>Last seen</dt>
                  <dd className="font-medium text-foreground">{lastReviewedLabel}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>

        <Link
          href={practiceHref}
          className={cn(buttonVariants(), "min-h-11 w-full touch-manipulation")}
          aria-label={`Practice ${topicName} flashcards`}
        >
          <Layers data-icon="inline-start" />
          Practice {topicName}
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Spaced practice with other {topicName.toLowerCase()} cards.
        </p>
      </section>

      <footer className="flex flex-wrap gap-2 pb-2">
        <Badge variant="secondary">{word.cefrBand}</Badge>
        <Badge variant="outline">{topicName}</Badge>
        <Badge variant="outline">{partOfSpeechLabel(word.partOfSpeech)}</Badge>
      </footer>
    </article>
  );
};
