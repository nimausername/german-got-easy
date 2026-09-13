"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
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

export default function FlashcardsPage() {
  const router = useRouter();
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

  const resetCardState = () => {
    setFlipped(false);
    setTypedAnswer("");
    setPhase("prompt");
    setFeedback(null);
  };

  const startSession = async (context: StudyContext) => {
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
  };

  const current = cards[index];

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
      <AppShell width="md" centered>
        <ErrorAlert message={error} />
        <BackLink href="/dashboard" label="Dashboard" className="mt-4" />
      </AppShell>
    );
  }

  if (!study) {
    return (
      <AppShell width="md">
        <BackLink href="/dashboard" label="Dashboard" />
        <h1 className="mt-6 font-display text-4xl text-brand-ink">Flashcards</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Pick a life topic to learn related words together. Use review-due to keep older words from
          fading.
        </p>

        {loadingTopics ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : null}

        {!loadingTopics && dueTotal > 0 ? (
          <Card className="mt-8 border-primary/30 bg-primary text-primary-foreground">
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
                disabled={loadingSession}
                onClick={() => void startSession({ mode: "due", title: "Review due words" })}
                aria-label={`Review ${dueTotal} due words`}
              >
                Start review
              </Button>
            </CardFooter>
          </Card>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
                  className="w-full"
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
      </AppShell>
    );
  }

  if (done) {
    return (
      <AppShell width="md" centered>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-3xl">Session complete</CardTitle>
            <CardDescription>
              Nice work in {study.title}. Come back for due reviews so the words stick.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-3">
            <Button type="button" onClick={handleBackToTopics}>
              Choose another topic
            </Button>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Dashboard
            </Link>
          </CardFooter>
        </Card>
      </AppShell>
    );
  }

  if (loadingSession || !current) {
    return (
      <AppShell width="md" centered>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-64 w-full" />
      </AppShell>
    );
  }

  const showSelfRate = current.promptType === "recognize" ? flipped : phase === "correct";

  return (
    <AppShell width="md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
        onClick={handleBackToTopics}
      >
        ← Topics
      </Button>

      <div className="mt-6 flex flex-wrap items-center gap-2">
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
              <p className="font-display text-4xl text-brand-ink">
                {germanForm(current.article, current.lemma)}
              </p>
              {flipped ? (
                <div className="mt-6 space-y-3">
                  <p className="text-xl font-semibold">{current.translation}</p>
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
              <p className="font-display text-4xl text-brand-ink">{current.translation}</p>
              {current.hint ? <p className="text-sm text-muted-foreground">{current.hint}</p> : null}
              <Field>
                <FieldLabel htmlFor="produce-answer" className="sr-only">
                  German answer
                </FieldLabel>
                <Input
                  id="produce-answer"
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
              <Button type="button" disabled={busy || !typedAnswer.trim()} onClick={handleCheck}>
                Check
              </Button>
            </div>
          ) : null}

          {current.promptType === "gender" && phase === "prompt" ? (
            <div className="space-y-4">
              <p className="font-display text-4xl text-brand-ink">{current.lemma}</p>
              {current.hint ? <p className="text-sm text-muted-foreground">{current.hint}</p> : null}
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((article) => (
                  <Button
                    key={article}
                    type="button"
                    variant="outline"
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
              <p className="font-display text-2xl text-brand-ink">{current.clozeSentence}</p>
              {current.hint ? (
                <p className="text-sm text-muted-foreground">Hint: {current.hint}</p>
              ) : null}
              <Field>
                <FieldLabel htmlFor="cloze-answer" className="sr-only">
                  Missing word
                </FieldLabel>
                <Input
                  id="cloze-answer"
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
              <Button type="button" disabled={busy || !typedAnswer.trim()} onClick={handleCheck}>
                Check
              </Button>
            </div>
          ) : null}

          {current.promptType === "plural" && phase === "prompt" ? (
            <div className="space-y-4">
              <p className="font-display text-4xl text-brand-ink">
                {germanForm(current.article, current.lemma)}
              </p>
              {current.hint ? <p className="text-sm text-muted-foreground">{current.hint}</p> : null}
              <Field>
                <FieldLabel htmlFor="plural-answer" className="sr-only">
                  Plural form
                </FieldLabel>
                <Input
                  id="plural-answer"
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
              <Button type="button" disabled={busy || !typedAnswer.trim()} onClick={handleCheck}>
                Check
              </Button>
            </div>
          ) : null}

          {phase === "grade" && feedback?.expected ? (
            <div className="mt-2 space-y-3 rounded-lg bg-destructive/5 p-4 ring-1 ring-destructive/20">
              <p className="text-sm font-semibold text-destructive">Not quite</p>
              <p className="text-xl font-semibold text-brand-ink">
                {germanForm(feedback.expected.article, feedback.expected.lemma)}
                {feedback.expected.plural ? ` · die ${feedback.expected.plural}` : ""}
              </p>
              <p>{feedback.expected.translation}</p>
              <p className="text-muted-foreground">{feedback.expected.exampleDe}</p>
              <Button type="button" onClick={handleContinueAfterFail}>
                Continue
              </Button>
            </div>
          ) : null}

          {phase === "correct" ? (
            <div className="mt-2 space-y-2 rounded-lg bg-accent p-4 ring-1 ring-primary/15">
              <p className="text-sm font-semibold text-accent-foreground">Correct</p>
              <p className="text-xl font-semibold text-brand-ink">
                {germanForm(current.article, current.lemma)}
                {current.plural ? ` · die ${current.plural}` : ""}
              </p>
              <p className="text-muted-foreground">{current.exampleDe}</p>
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
                className={cn(value === "good" && "border-primary/40")}
              >
                {label}
              </Button>
            ))}
        </div>
      ) : null}
    </AppShell>
  );
}
