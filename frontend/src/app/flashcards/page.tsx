"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";

type PromptType = "recognize" | "produce" | "gender" | "cloze" | "plural";

type Card = {
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

const insertRequeue = (cards: Card[], fromIndex: number, card: Card) => {
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
  const [cards, setCards] = useState<Card[]>([]);
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
      const response = await apiFetch<{ data: { cards: Card[] } }>(
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

  const resetCardState = () => {
    setFlipped(false);
    setTypedAnswer("");
    setPhase("prompt");
    setFeedback(null);
  };

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

  const advance = (requeue: boolean, sourceCard: Card) => {
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
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <p>{error}</p>
      </main>
    );
  }

  if (!study) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
        <Link href="/dashboard" className="text-sm font-medium text-brand">
          ← Dashboard
        </Link>
        <h1 className="mt-6 font-display text-4xl text-brand-ink">Flashcards</h1>
        <p className="mt-3 max-w-xl text-stone-600">
          Pick a life topic to learn related words together. Use review-due to keep older words
          from fading.
        </p>

        {loadingTopics ? <p className="mt-8 text-stone-500">Loading topics…</p> : null}

        {!loadingTopics && dueTotal > 0 ? (
          <button
            type="button"
            disabled={loadingSession}
            onClick={() =>
              void startSession({ mode: "due", title: "Review due words" })
            }
            className="mt-8 w-full rounded-xl border border-brand/30 bg-brand px-5 py-4 text-left text-white hover:bg-brand-ink disabled:opacity-60"
            aria-label={`Review ${dueTotal} due words`}
          >
            <p className="text-sm uppercase tracking-wide text-white/80">Recommended</p>
            <p className="mt-1 text-xl font-semibold">Review due words</p>
            <p className="mt-1 text-sm text-white/80">
              {dueTotal} card{dueTotal === 1 ? "" : "s"} waiting across all topics
            </p>
          </button>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              disabled={loadingSession || (topic.dueCount === 0 && topic.newCount === 0)}
              onClick={() =>
                void startSession({
                  mode: "topic",
                  topicId: topic.id,
                  title: topic.title,
                })
              }
              className="rounded-xl border border-stone-200 bg-white/90 p-5 text-left shadow-sm transition hover:border-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Study topic ${topic.title}`}
            >
              <p className="text-lg font-semibold text-brand-ink">{topic.title}</p>
              <p className="mt-1 text-sm text-stone-600">{topic.description}</p>
              <p className="mt-4 text-sm text-stone-500">
                {topic.dueCount > 0 ? `${topic.dueCount} due · ` : ""}
                {topic.newCount} new · {topic.learningCount + topic.knownCount} started
              </p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
        <h1 className="font-display text-3xl text-brand-ink">Session complete</h1>
        <p className="mt-3 text-stone-600">
          Nice work in {study.title}. Come back for due reviews so the words stick.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleBackToTopics}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Choose another topic
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold"
          >
            Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (loadingSession || !current) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <p>Loading flashcards…</p>
      </main>
    );
  }

  const showSelfRate =
    current.promptType === "recognize" ? flipped : phase === "correct";

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-6 py-12">
      <button
        type="button"
        onClick={handleBackToTopics}
        className="text-sm font-medium text-brand"
      >
        ← Topics
      </button>
      <p className="mt-6 text-sm uppercase tracking-wide text-stone-500">
        {study.title} · {current.mode === "new" ? "New word" : "Review"} ·{" "}
        {PROMPT_LABEL[current.promptType]} · {index + 1}/{cards.length}
      </p>
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-4 w-full rounded-xl border border-stone-200 bg-white/90 p-8 shadow-sm">
        <p className="text-sm text-stone-500">{current.prompt}</p>

        {current.promptType === "recognize" ? (
          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="mt-4 w-full text-left"
            aria-label={flipped ? "Hide translation" : "Reveal translation"}
          >
            <p className="font-display text-4xl text-brand-ink">
              {germanForm(current.article, current.lemma)}
            </p>
            {flipped ? (
              <div className="mt-6 space-y-3">
                <p className="text-xl font-semibold">{current.translation}</p>
                {current.plural ? (
                  <p className="text-sm font-medium text-stone-700">
                    Plural: die {current.plural}
                  </p>
                ) : null}
                <p className="text-stone-700">{current.exampleDe}</p>
                <p className="text-stone-500">{current.exampleEn}</p>
                {current.usageNote ? <p className="text-sm text-stone-500">{current.usageNote}</p> : null}
              </div>
            ) : (
              <p className="mt-6 text-sm text-stone-500">Tap to reveal translation and example</p>
            )}
          </button>
        ) : null}

        {current.promptType === "produce" && phase === "prompt" ? (
          <div className="mt-4 space-y-4">
            <p className="font-display text-4xl text-brand-ink">{current.translation}</p>
            {current.hint ? <p className="text-sm text-stone-500">{current.hint}</p> : null}
            <label className="block">
              <span className="sr-only">German answer</span>
              <input
                value={typedAnswer}
                onChange={(event) => setTypedAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleCheck();
                }}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-3 text-base"
                placeholder="e.g. das Haus"
                autoComplete="off"
                aria-label="Type the German word"
              />
            </label>
            <button
              type="button"
              disabled={busy || !typedAnswer.trim()}
              onClick={handleCheck}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Check
            </button>
          </div>
        ) : null}

        {current.promptType === "gender" && phase === "prompt" ? (
          <div className="mt-4 space-y-4">
            <p className="font-display text-4xl text-brand-ink">{current.lemma}</p>
            {current.hint ? <p className="text-sm text-stone-500">{current.hint}</p> : null}
            <div className="grid grid-cols-3 gap-2">
              {GENDER_OPTIONS.map((article) => (
                <button
                  key={article}
                  type="button"
                  disabled={busy}
                  onClick={() => handleGender(article)}
                  className="rounded-md border border-stone-300 bg-white px-3 py-3 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
                  aria-label={`Choose article ${article}`}
                >
                  {article}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {current.promptType === "cloze" && phase === "prompt" ? (
          <div className="mt-4 space-y-4">
            <p className="font-display text-2xl text-brand-ink">{current.clozeSentence}</p>
            {current.hint ? <p className="text-sm text-stone-500">Hint: {current.hint}</p> : null}
            <label className="block">
              <span className="sr-only">Missing word</span>
              <input
                value={typedAnswer}
                onChange={(event) => setTypedAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleCheck();
                }}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-3 text-base"
                placeholder="Type the missing word"
                autoComplete="off"
                aria-label="Type the missing German word"
              />
            </label>
            <button
              type="button"
              disabled={busy || !typedAnswer.trim()}
              onClick={handleCheck}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Check
            </button>
          </div>
        ) : null}

        {current.promptType === "plural" && phase === "prompt" ? (
          <div className="mt-4 space-y-4">
            <p className="font-display text-4xl text-brand-ink">
              {germanForm(current.article, current.lemma)}
            </p>
            {current.hint ? <p className="text-sm text-stone-500">{current.hint}</p> : null}
            <label className="block">
              <span className="sr-only">Plural form</span>
              <input
                value={typedAnswer}
                onChange={(event) => setTypedAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleCheck();
                }}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-3 text-base"
                placeholder="e.g. Häuser"
                autoComplete="off"
                aria-label="Type the plural form"
              />
            </label>
            <button
              type="button"
              disabled={busy || !typedAnswer.trim()}
              onClick={handleCheck}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Check
            </button>
          </div>
        ) : null}

        {phase === "grade" && feedback?.expected ? (
          <div className="mt-6 space-y-3 rounded-lg bg-stone-50 p-4">
            <p className="text-sm font-semibold text-red-700">Not quite</p>
            <p className="text-xl font-semibold text-brand-ink">
              {germanForm(feedback.expected.article, feedback.expected.lemma)}
              {feedback.expected.plural ? ` · die ${feedback.expected.plural}` : ""}
            </p>
            <p className="text-stone-700">{feedback.expected.translation}</p>
            <p className="text-stone-600">{feedback.expected.exampleDe}</p>
            <button
              type="button"
              onClick={handleContinueAfterFail}
              className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              Continue
            </button>
          </div>
        ) : null}

        {phase === "correct" ? (
          <div className="mt-6 space-y-2 rounded-lg bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Correct</p>
            <p className="text-xl font-semibold text-brand-ink">
              {germanForm(current.article, current.lemma)}
              {current.plural ? ` · die ${current.plural}` : ""}
            </p>
            <p className="text-stone-600">{current.exampleDe}</p>
          </div>
        ) : null}
      </section>

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
              <button
                key={value}
                type="button"
                disabled={busy}
                onClick={() => handleRate(value)}
                className="rounded-md border border-stone-300 bg-white px-3 py-3 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
              >
                {label}
              </button>
            ))}
        </div>
      ) : null}
    </main>
  );
}
