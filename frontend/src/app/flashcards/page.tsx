"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { BackLink } from "@/components/back-link";
import { ErrorAlert } from "@/components/error-alert";
import {
  FlashcardRatingBar,
  RATING_SHORTCUT_MAP,
  type FlashcardRating,
} from "@/components/flashcard-rating-bar";
import { FlashcardStudyCard } from "@/components/flashcard-study-card";
import { PageFrame } from "@/components/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  FlashcardsPageSuspenseSkeleton,
  FlashcardsSessionSkeleton,
  FlashcardsTopicsSkeleton,
} from "@/components/skeletons";
import { useShellUser } from "@/hooks/use-me";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { fetchFlashcardTopics } from "@/lib/api-queries";
import { APP_CONTENT_WIDTH, STUDY_CONTENT_CLASS } from "@/lib/layout";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type PromptType = "recognize" | "produce" | "gender" | "cloze" | "plural";

type CardItem = {
  wordId: string;
  lemma: string;
  article: string | null;
  plural: string | null;
  translation: string;
  exampleDe: string;
  exampleEn: string;
  usageNote: string | null;
  partOfSpeech: string;
  mode: "new" | "review";
  promptType: PromptType;
  prompt: string;
  hint: string | null;
  clozeSentence: string | null;
};

type Topic = {
  id: string;
  title: string;
  description: string;
  wordCount: number;
  dueCount: number;
  learningCount: number;
  knownCount: number;
  newCount: number;
};

type AnswerResponse = {
  data: {
    correct: boolean | null;
    rating: "again" | "hard" | "good" | "easy" | null;
    requeueInSession: boolean;
    expected: {
      article: string | null;
      lemma: string;
      plural: string | null;
      translation: string;
      exampleDe: string;
      exampleEn: string;
    } | null;
  };
};

const PROMPT_LABEL: Record<PromptType, string> = {
  recognize: "Recognize",
  produce: "Produce",
  gender: "Article",
  cloze: "Cloze",
  plural: "Plural",
};

const REQUEUE_OFFSET = 3;

const insertRequeue = (cards: CardItem[], fromIndex: number, card: CardItem) => {
  const next = [...cards];
  const target = Math.min(fromIndex + 1 + REQUEUE_OFFSET, next.length);
  next.splice(target, 0, { ...card });
  return next;
};

type StudyContext = {
  mode: "topic" | "due";
  topicId?: string;
  title: string;
};

const FlashcardsPageContent = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const shellUser = useShellUser();
  const searchParams = useSearchParams();
  const topicFromQuery = searchParams.get("topic");
  const [study, setStudy] = useState<StudyContext | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [phase, setPhase] = useState<"prompt" | "grade" | "correct">("prompt");
  const [feedback, setFeedback] = useState<AnswerResponse["data"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const topicsQuery = useQuery({
    queryKey: queryKeys.flashcardTopics,
    queryFn: fetchFlashcardTopics,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!(topicsQuery.error instanceof ApiRequestError) || topicsQuery.error.status !== 401) {
      return;
    }
    router.replace("/login");
  }, [router, topicsQuery.error]);

  const topics = topicsQuery.data?.topics ?? [];
  const dueTotal = topicsQuery.data?.dueTotal ?? 0;
  const loadingTopics = topicsQuery.isLoading;
  const error =
    sessionError ??
    (topicsQuery.error instanceof ApiRequestError && topicsQuery.error.status === 401
      ? "Please log in to study flashcards."
      : topicsQuery.isError
        ? "Could not load flashcard topics. Try again."
        : null);

  const resetCardState = useCallback(() => {
    setFlipped(false);
    setTypedAnswer("");
    setPhase("prompt");
    setFeedback(null);
  }, []);

  const startSession = useCallback(
    async (context: StudyContext) => {
      setLoadingSession(true);
      setSessionError(null);
      setDone(false);
      setIndex(0);
      resetCardState();
      try {
        const query =
          context.mode === "due"
            ? "mode=due"
            : `mode=topic&topic=${encodeURIComponent(context.topicId ?? "")}`;
        const response = await apiFetch<{ data: { cards: CardItem[] } }>(
          `/v1/flashcards/session?${query}`,
        );
        setStudy(context);
        setCards(response.data.cards);
        if (response.data.cards.length === 0) setDone(true);
      } catch {
        setSessionError("Could not start a flashcard session.");
      } finally {
        setLoadingSession(false);
      }
    },
    [resetCardState],
  );

  const current = cards[index];
  const deepLinkTopic = topicFromQuery
    ? topics.find((topic) => topic.id === topicFromQuery)
    : undefined;

  const handleBackToTopics = () => {
    setStudy(null);
    setCards([]);
    setIndex(0);
    setDone(false);
    resetCardState();
    void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardTopics });
    void queryClient.invalidateQueries({ queryKey: queryKeys.me });
  };

  const advance = useCallback(
    (requeue: boolean, sourceCard: CardItem) => {
      const working = requeue ? insertRequeue(cards, index, sourceCard) : cards;
      const isLast = index >= working.length - 1;

      if (isLast && !requeue) {
        setDone(true);
        resetCardState();
        return;
      }

      setCards(working);
      setIndex((value) => value + 1);
      resetCardState();
    },
    [cards, index, resetCardState],
  );

  const submitAnswer = useCallback(
    async (payload: {
      rating?: "again" | "hard" | "good" | "easy";
      answer?: string;
    }) => {
      if (!current || busy) return;
      setBusy(true);
      try {
        const response = await apiFetch<AnswerResponse>(
          `/v1/flashcards/${current.wordId}/answer`,
          {
            method: "POST",
            body: JSON.stringify({
              promptType: current.promptType,
              ...payload,
            }),
          },
        );

        const result = response.data;
        if (current.promptType === "recognize") {
          advance(result.requeueInSession, current);
          return;
        }

        if (result.correct === false) {
          setFeedback(result);
          setPhase("grade");
          return;
        }

        if (payload.rating) {
          advance(false, current);
          return;
        }

        setFeedback(result);
        setPhase("correct");
      } catch {
        setSessionError("Could not save your answer. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [advance, busy, current],
  );

  const handleContinueAfterFail = () => {
    if (!current || !feedback) return;
    advance(feedback.requeueInSession, current);
  };

  const handleRate = useCallback(
    (rating: FlashcardRating) => {
      if (current?.promptType === "recognize") {
        void submitAnswer({ rating });
        return;
      }
      void submitAnswer({ rating, answer: typedAnswer });
    },
    [current, submitAnswer, typedAnswer],
  );

  const handleCheck = () => {
    if (!typedAnswer.trim()) return;
    void submitAnswer({ answer: typedAnswer });
  };

  const handleGender = (article: string) => {
    setTypedAnswer(article);
    void submitAnswer({ answer: article });
  };

  const handleFlip = useCallback(() => {
    setFlipped((value) => !value);
  }, []);

  const showSelfRate = Boolean(
    current &&
      (current.promptType === "recognize" ? flipped : phase === "correct"),
  );

  const keyboardRef = useRef({
    current,
    showSelfRate,
    busy,
    handleFlip,
    handleRate,
  });

  useEffect(() => {
    keyboardRef.current = {
      current,
      showSelfRate,
      busy,
      handleFlip,
      handleRate,
    };
  }, [current, showSelfRate, busy, handleFlip, handleRate]);

  useEffect(() => {
    if (!study || done) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) {
        return;
      }

      const state = keyboardRef.current;
      const card = state.current;
      if (!card) return;

      if (
        card.promptType === "recognize" &&
        (event.key === " " || event.key === "Enter") &&
        !target?.closest("button, a")
      ) {
        event.preventDefault();
        state.handleFlip();
        return;
      }

      if (!state.showSelfRate || state.busy) return;

      const rating = RATING_SHORTCUT_MAP[event.key];
      if (!rating) return;
      if (rating === "again" && card.promptType !== "recognize") return;

      event.preventDefault();
      state.handleRate(rating);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [study, done]);

  if (error && !study) {
    return (
      <AuthenticatedShell
        width={APP_CONTENT_WIDTH}
        centered
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <ErrorAlert message={error} />
        <BackLink href="/dashboard" label="Dashboard" className="mt-4" />
      </AuthenticatedShell>
    );
  }

  if (!study) {
    return (
      <AuthenticatedShell
        width={APP_CONTENT_WIDTH}
        className="pt-6 sm:pt-8"
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <PageFrame
          header={
            <>
              <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">Flashcards</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
                Pick a life topic to learn related words together. Use review-due to keep older
                words from fading.
              </p>
            </>
          }
          contentClassName="pb-2"
        >
          {loadingTopics ? <FlashcardsTopicsSkeleton /> : null}

          {!loadingTopics && deepLinkTopic ? (
            <Card className="border-primary/30">
              <CardHeader>
                <CardDescription>From vocabulary</CardDescription>
                <CardTitle>Practice {deepLinkTopic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{deepLinkTopic.description}</p>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  className="min-h-11 w-full touch-manipulation sm:w-auto"
                  disabled={
                    loadingSession ||
                    (deepLinkTopic.dueCount === 0 && deepLinkTopic.newCount === 0)
                  }
                  onClick={() =>
                    void startSession({
                      mode: "topic",
                      topicId: deepLinkTopic.id,
                      title: deepLinkTopic.title,
                    })
                  }
                  aria-label={`Start ${deepLinkTopic.title} flashcards`}
                >
                  Start topic
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          {!loadingTopics && dueTotal > 0 ? (
            <Card
              className={cn(
                "border-primary/30 bg-primary text-primary-foreground",
                deepLinkTopic ? "mt-4" : null,
              )}
            >
              <CardHeader>
                <CardDescription className="text-primary-foreground/80">
                  Recommended
                </CardDescription>
                <CardTitle className="text-primary-foreground">Review due words</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary-foreground/80">
                  {dueTotal} card{dueTotal === 1 ? "" : "s"} waiting across all topics
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11 w-full touch-manipulation sm:w-auto"
                  disabled={loadingSession}
                  onClick={() => void startSession({ mode: "due", title: "Review due words" })}
                  aria-label={`Review ${dueTotal} due words`}
                >
                  Start review
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          <div
            className={cn(
              "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
              !loadingTopics && (deepLinkTopic || dueTotal > 0) ? "mt-6" : null,
            )}
          >
            {topics.map((topic) => (
              <Card key={topic.id} size="sm" className="transition-colors hover:bg-accent/40">
                <CardHeader>
                  <CardTitle>{topic.title}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {topic.dueCount > 0 ? `${topic.dueCount} due · ` : ""}
                    {topic.newCount} new · {topic.learningCount + topic.knownCount} started
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full touch-manipulation"
                    disabled={loadingSession || (topic.dueCount === 0 && topic.newCount === 0)}
                    onClick={() =>
                      void startSession({
                        mode: "topic",
                        topicId: topic.id,
                        title: topic.title,
                      })
                    }
                    aria-label={`Study topic ${topic.title}`}
                  >
                    Study topic
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </PageFrame>
      </AuthenticatedShell>
    );
  }

  if (done) {
    return (
      <AuthenticatedShell
        width="md"
        centered
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl sm:text-3xl">Session complete</CardTitle>
            <CardDescription>
              Nice work in {study.title}. Come back for due reviews so the words stick.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              type="button"
              className="min-h-11 w-full touch-manipulation sm:w-auto"
              onClick={handleBackToTopics}
            >
              Choose another topic
            </Button>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-11 w-full touch-manipulation sm:w-auto",
              )}
            >
              Dashboard
            </Link>
          </CardFooter>
        </Card>
      </AuthenticatedShell>
    );
  }

  if (loadingSession || !current) {
    return (
      <AuthenticatedShell
        width={APP_CONTENT_WIDTH}
        className={cn(
          "py-0 pt-2 sm:pt-3",
          "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6",
        )}
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <FlashcardsSessionSkeleton />
      </AuthenticatedShell>
    );
  }

  const progressValue = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

  return (
    <AuthenticatedShell
      width={APP_CONTENT_WIDTH}
      className={cn(
        "py-0 pt-2 sm:pt-3",
        "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6",
      )}
      user={shellUser.user}
      loading={shellUser.loading}
    >
      <div className={cn(STUDY_CONTENT_CLASS, "flex shrink-0 items-start justify-between gap-3")}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 min-h-10 w-fit touch-manipulation text-muted-foreground"
          onClick={handleBackToTopics}
        >
          ← Topics
        </Button>
        <p className="pt-2 text-right text-xs text-muted-foreground sm:text-sm">
          <span className="hidden sm:inline">Space to flip · </span>
          {index + 1} of {cards.length}
        </p>
      </div>

      <div className={cn(STUDY_CONTENT_CLASS, "mt-2 shrink-0 space-y-2 sm:mt-3")}>
        <Progress value={progressValue} className="w-full gap-2">
          <ProgressLabel className="truncate text-xs sm:text-sm">{study.title}</ProgressLabel>
          <ProgressValue className="text-xs sm:text-sm">
            {() => `${index + 1}/${cards.length}`}
          </ProgressValue>
        </Progress>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{current.mode === "new" ? "New word" : "Review"}</Badge>
          <Badge variant="outline">{PROMPT_LABEL[current.promptType]}</Badge>
        </div>
      </div>

      {error ? (
        <div className={cn(STUDY_CONTENT_CLASS, "mt-2 shrink-0")}>
          <ErrorAlert message={error} />
        </div>
      ) : null}

      {/*
        Full-width stage with large horizontal padding so pulse-outside blur
        can bloom left/right without hitting overflow-hidden on the shell.
      */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden px-10 sm:px-16 md:px-24">
        <div
          key={`${current.wordId}-${current.promptType}-${index}`}
          className={cn(STUDY_CONTENT_CLASS, "animate-in fade-in-0 duration-300")}
        >
          <FlashcardStudyCard
            card={current}
            flipped={flipped}
            onFlip={handleFlip}
            phase={phase}
            feedback={feedback}
            typedAnswer={typedAnswer}
            onTypedAnswerChange={setTypedAnswer}
            onCheck={handleCheck}
            onGender={handleGender}
            onContinueAfterFail={handleContinueAfterFail}
            busy={busy}
          />
        </div>
      </div>

      <div
        className={cn(
          STUDY_CONTENT_CLASS,
          "shrink-0 px-1 md:px-0",
          "min-h-14 sm:min-h-12",
        )}
      >
        <div
          className={cn(!showSelfRate && "invisible pointer-events-none")}
          aria-hidden={!showSelfRate}
        >
          <FlashcardRatingBar
            busy={busy || !showSelfRate}
            includeAgain={current.promptType === "recognize"}
            onRate={handleRate}
          />
        </div>
      </div>
    </AuthenticatedShell>
  );
};

/**
 * Flashcard study page with Suspense for topic deep links.
 */
export default function FlashcardsPage() {
  return (
    <Suspense
      fallback={
        <AuthenticatedShell width={APP_CONTENT_WIDTH} user={null} loading className="pt-6 sm:pt-8">
          <FlashcardsPageSuspenseSkeleton />
        </AuthenticatedShell>
      }
    >
      <FlashcardsPageContent />
    </Suspense>
  );
}
