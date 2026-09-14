"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { BackLink } from "@/components/back-link";
import { ErrorAlert } from "@/components/error-alert";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiRequestError } from "@/lib/api";
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
const GENDER_OPTIONS = ["der", "die", "das"] as const;

const germanForm = (article: string | null, lemma: string) =>
  article ? `${article} ${lemma}` : lemma;

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
  const searchParams = useSearchParams();
  const topicFromQuery = searchParams.get("topic");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [dueTotal, setDueTotal] = useState(0);
  const [study, setStudy] = useState<StudyContext | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [phase, setPhase] = useState<"prompt" | "grade" | "correct">("prompt");
  const [feedback, setFeedback] = useState<AnswerResponse["data"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch<{
          data: { topics: Topic[]; dueTotal: number };
        }>("/v1/flashcards/topics");
        setTopics(response.data.topics);
        setDueTotal(response.data.dueTotal);
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) {
          setError("Please log in to study flashcards.");
          router.replace("/login");
          return;
        }
        setError("Could not load flashcard topics. Try again.");
      } finally {
        setLoadingTopics(false);
      }
    };
    void load();
  }, [router]);

  const resetCardState = useCallback(() => {
    setFlipped(false);
    setTypedAnswer("");
    setPhase("prompt");
    setFeedback(null);
  }, []);

  const startSession = useCallback(
    async (context: StudyContext) => {
      setLoadingSession(true);
      setError(null);
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
        setError("Could not start a flashcard session.");
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
    void (async () => {
      try {
        const response = await apiFetch<{
          data: { topics: Topic[]; dueTotal: number };
        }>("/v1/flashcards/topics");
        setTopics(response.data.topics);
        setDueTotal(response.data.dueTotal);
      } catch {
        // Keep existing topic list if refresh fails.
      }
    })();
  };

  const advance = (requeue: boolean, sourceCard: CardItem) => {
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
  };

  const submitAnswer = async (payload: {
    rating?: "again" | "hard" | "good" | "easy";
    answer?: string;
  }) => {
    if (!current || busy) return;
    setBusy(true);
    try {
      const response = await apiFetch<AnswerResponse>(`/v1/flashcards/${current.wordId}/answer`, {
        method: "POST",
        body: JSON.stringify({
          promptType: current.promptType,
          ...payload,
        }),
      });

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
      setError("Could not save your answer. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleContinueAfterFail = () => {
    if (!current || !feedback) return;
    advance(feedback.requeueInSession, current);
  };

  const handleRate = (rating: "again" | "hard" | "good" | "easy") => {
    if (current?.promptType === "recognize") {
      void submitAnswer({ rating });
      return;
    }
    void submitAnswer({ rating, answer: typedAnswer });
  };

  const handleCheck = () => {
    if (!typedAnswer.trim()) return;
    void submitAnswer({ answer: typedAnswer });
  };

  const handleGender = (article: string) => {
    setTypedAnswer(article);
    void submitAnswer({ answer: article });
  };

  if (error && !study) {
    return (
      <AuthenticatedShell width="xl" centered>
        <ErrorAlert message={error} />
        <BackLink href="/dashboard" label="Dashboard" className="mt-4" />
      </AuthenticatedShell>
    );
  }

  if (!study) {
    return (
      <AuthenticatedShell width="xl" className="pt-6 sm:pt-8">
        <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">Flashcards</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
          Pick a life topic to learn related words together. Use review-due to keep older words from
          fading.
        </p>

        {loadingTopics ? (
          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="hidden h-36 w-full lg:block" />
            <Skeleton className="hidden h-36 w-full lg:block" />
          </div>
        ) : null}

        {!loadingTopics && deepLinkTopic ? (
          <Card className="mt-8 border-primary/30">
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
                disabled={loadingSession || (deepLinkTopic.dueCount === 0 && deepLinkTopic.newCount === 0)}
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
          <Card className={cn("border-primary/30 bg-primary text-primary-foreground", deepLinkTopic ? "mt-4" : "mt-6 sm:mt-8")}>
            <CardHeader>
              <CardDescription className="text-primary-foreground/80">Recommended</CardDescription>
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

        <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
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
      </AuthenticatedShell>
    );
  }

  if (done) {
    return (
      <AuthenticatedShell width="md" centered>
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
      <AuthenticatedShell width="md" centered>
        <Skeleton className="h-8 w-40 max-w-full" />
        <Skeleton className="mt-6 h-64 w-full" />
      </AuthenticatedShell>
    );
  }

  const showSelfRate = current.promptType === "recognize" ? flipped : phase === "correct";

  return (
    <AuthenticatedShell width="md" className="pt-6 sm:pt-8">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 min-h-10 w-fit touch-manipulation text-muted-foreground"
        onClick={handleBackToTopics}
      >
        ← Topics
      </Button>

      <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6">
        <Badge variant="secondary">{study.title}</Badge>
        <Badge variant="outline">{current.mode === "new" ? "New word" : "Review"}</Badge>
        <Badge variant="outline">{PROMPT_LABEL[current.promptType]}</Badge>
        <span className="text-sm text-muted-foreground">
          {index + 1}/{cards.length}
        </span>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorAlert message={error} />
        </div>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardDescription>{current.prompt}</CardDescription>
        </CardHeader>
        <CardContent>
          {current.promptType === "recognize" ? (
            <button
              type="button"
              onClick={() => setFlipped((value) => !value)}
              className="w-full rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={flipped ? "Hide translation" : "Reveal translation"}
            >
              <p className="font-display text-3xl break-words text-brand-ink sm:text-4xl">
                {germanForm(current.article, current.lemma)}
              </p>
              {flipped ? (
                <div className="mt-6 space-y-3">
                  <p className="text-lg font-semibold break-words sm:text-xl">
                    {current.translation}
                  </p>
                  {current.plural ? (
                    <p className="text-sm font-medium">Plural: die {current.plural}</p>
                  ) : null}
                  <p>{current.exampleDe}</p>
                  <p className="text-muted-foreground">{current.exampleEn}</p>
                  {current.usageNote ? (
                    <p className="text-sm text-muted-foreground">{current.usageNote}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">
                  Tap to reveal translation and example
                </p>
              )}
            </button>
          ) : null}

          {current.promptType === "produce" && phase === "prompt" ? (
            <div className="space-y-4">
              <p className="font-display text-3xl break-words text-brand-ink sm:text-4xl">
                {current.translation}
              </p>
              {current.hint ? <p className="text-sm text-muted-foreground">{current.hint}</p> : null}
              <Field>
                <FieldLabel htmlFor="produce-answer" className="sr-only">
                  German answer
                </FieldLabel>
                <Input
                  id="produce-answer"
                  className="min-h-11 text-base"
                  value={typedAnswer}
                  onChange={(event) => setTypedAnswer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleCheck();
                  }}
                  placeholder="e.g. das Haus"
                  autoComplete="off"
                  aria-label="Type the German word"
                />
              </Field>
              <Button
                type="button"
                className="min-h-11 w-full touch-manipulation sm:w-auto"
                disabled={busy || !typedAnswer.trim()}
                onClick={handleCheck}
              >
                Check
              </Button>
            </div>
          ) : null}

          {current.promptType === "gender" && phase === "prompt" ? (
            <div className="space-y-4">
              <p className="font-display text-3xl break-words text-brand-ink sm:text-4xl">
                {current.lemma}
              </p>
              {current.hint ? <p className="text-sm text-muted-foreground">{current.hint}</p> : null}
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((article) => (
                  <Button
                    key={article}
                    type="button"
                    variant="outline"
                    className="min-h-12 touch-manipulation text-base"
                    disabled={busy}
                    onClick={() => handleGender(article)}
                    aria-label={`Choose article ${article}`}
                  >
                    {article}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {current.promptType === "cloze" && phase === "prompt" ? (
            <div className="space-y-4">
              <p className="font-display text-xl break-words text-brand-ink sm:text-2xl">
                {current.clozeSentence}
              </p>
              {current.hint ? (
                <p className="text-sm text-muted-foreground">Hint: {current.hint}</p>
              ) : null}
              <Field>
                <FieldLabel htmlFor="cloze-answer" className="sr-only">
                  Missing word
                </FieldLabel>
                <Input
                  id="cloze-answer"
                  className="min-h-11 text-base"
                  value={typedAnswer}
                  onChange={(event) => setTypedAnswer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleCheck();
                  }}
                  placeholder="Type the missing word"
                  autoComplete="off"
                  aria-label="Type the missing German word"
                />
              </Field>
              <Button
                type="button"
                className="min-h-11 w-full touch-manipulation sm:w-auto"
                disabled={busy || !typedAnswer.trim()}
                onClick={handleCheck}
              >
                Check
              </Button>
            </div>
          ) : null}

          {current.promptType === "plural" && phase === "prompt" ? (
            <div className="space-y-4">
              <p className="font-display text-3xl break-words text-brand-ink sm:text-4xl">
                {germanForm(current.article, current.lemma)}
              </p>
              {current.hint ? <p className="text-sm text-muted-foreground">{current.hint}</p> : null}
              <Field>
                <FieldLabel htmlFor="plural-answer" className="sr-only">
                  Plural form
                </FieldLabel>
                <Input
                  id="plural-answer"
                  className="min-h-11 text-base"
                  value={typedAnswer}
                  onChange={(event) => setTypedAnswer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleCheck();
                  }}
                  placeholder="e.g. Häuser"
                  autoComplete="off"
                  aria-label="Type the plural form"
                />
              </Field>
              <Button
                type="button"
                className="min-h-11 w-full touch-manipulation sm:w-auto"
                disabled={busy || !typedAnswer.trim()}
                onClick={handleCheck}
              >
                Check
              </Button>
            </div>
          ) : null}

          {phase === "grade" && feedback?.expected ? (
            <div className="mt-2 space-y-3 rounded-lg bg-destructive/5 p-4 ring-1 ring-destructive/20">
              <p className="text-sm font-semibold text-destructive">Not quite</p>
              <p className="text-lg font-semibold break-words text-brand-ink sm:text-xl">
                {germanForm(feedback.expected.article, feedback.expected.lemma)}
                {feedback.expected.plural ? ` · die ${feedback.expected.plural}` : ""}
              </p>
              <p>{feedback.expected.translation}</p>
              <p className="text-muted-foreground">{feedback.expected.exampleDe}</p>
              <Link
                href={`/vocabulary/${current.wordId}`}
                className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}
              >
                Open vocabulary entry
              </Link>
              <Button
                type="button"
                className="min-h-11 w-full touch-manipulation sm:w-auto"
                onClick={handleContinueAfterFail}
              >
                Continue
              </Button>
            </div>
          ) : null}

          {phase === "correct" ? (
            <div className="mt-2 space-y-2 rounded-lg bg-accent p-4 ring-1 ring-primary/15">
              <p className="text-sm font-semibold text-accent-foreground">Correct</p>
              <p className="text-lg font-semibold break-words text-brand-ink sm:text-xl">
                {germanForm(current.article, current.lemma)}
                {current.plural ? ` · die ${current.plural}` : ""}
              </p>
              <p className="text-muted-foreground">{current.exampleDe}</p>
              <Link
                href={`/vocabulary/${current.wordId}`}
                className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}
              >
                Open vocabulary entry
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {showSelfRate ? (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["again", "Again"],
              ["hard", "Hard"],
              ["good", "Good"],
              ["easy", "Easy"],
            ] as const
          )
            .filter(([value]) => current.promptType === "recognize" || value !== "again")
            .map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => handleRate(value)}
                className={cn(
                  "min-h-12 touch-manipulation",
                  value === "good" && "border-primary/40",
                )}
              >
                {label}
              </Button>
            ))}
        </div>
      ) : null}
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
        <AuthenticatedShell width="xl" user={null} loading>
          <Skeleton className="h-8 w-32 max-w-full" />
          <Skeleton className="mt-6 h-10 w-64 max-w-full" />
          <Skeleton className="mt-8 h-40 w-full" />
        </AuthenticatedShell>
      }
    >
      <FlashcardsPageContent />
    </Suspense>
  );
}
