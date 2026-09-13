"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type Exercise = {
  id: string;
  type: string;
  prompt: string;
  payload: Record<string, unknown>;
};

type LessonResponse = {
  data: {
    lesson: {
      id: string;
      title: string;
      skillTags: string[];
      unitTitle: string;
      levelCode: string;
      exercises: Exercise[];
    };
  };
};

type NextPathResponse = {
  data: {
    lesson: { id: string; title: string } | null;
  };
};

export default function LessonPlayerPage() {
  const router = useRouter();
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonResponse["data"]["lesson"] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const next = await apiFetch<NextPathResponse>("/v1/path/next");
        if (!next.data.lesson) {
          setError("No lessons available. Seed content first.");
          return;
        }
        setLessonId(next.data.lesson.id);
        const full = await apiFetch<LessonResponse>(`/v1/lessons/${next.data.lesson.id}`);
        setLesson(full.data.lesson);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lesson");
        router.replace("/login");
      }
    };
    void load();
  }, [router]);

  const current = useMemo(() => lesson?.exercises[index], [lesson, index]);

  const handleAnswer = (value: unknown) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const handleNext = async () => {
    if (!lesson || !current) return;
    if (index < lesson.exercises.length - 1) {
      setIndex((value) => value + 1);
      return;
    }

    try {
      const response = await apiFetch<{
        data: { score: number; correctCount: number; total: number };
      }>(`/v1/lessons/${lesson.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers: Object.entries(answers).map(([exerciseId, answer]) => ({
            exerciseId,
            answer,
          })),
        }),
      });
      setResult(
        `Score ${Math.round(response.data.score * 100)}% (${response.data.correctCount}/${response.data.total})`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    }
  };

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
        <p className="text-red-700">{error}</p>
      </main>
    );
  }

  if (!lesson || !current) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
        <p>Loading lesson…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-medium text-brand">
        ← Dashboard
      </Link>
      <p className="mt-6 text-sm uppercase tracking-wide text-stone-500">
        {lesson.levelCode} · {lesson.unitTitle}
      </p>
      <h1 className="mt-2 font-display text-3xl text-brand-ink">{lesson.title}</h1>
      <p className="mt-2 text-sm text-stone-600">
        Exercise {index + 1} of {lesson.exercises.length}
      </p>

      {result ? (
        <div className="mt-10 rounded-lg border border-stone-200 bg-white/80 p-6">
          <p className="text-xl font-semibold">{result}</p>
          <div className="mt-4 flex gap-3">
            <Link href="/dashboard" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
              Back to dashboard
            </Link>
            <button
              type="button"
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold"
              onClick={() => {
                setLessonId(null);
                setLesson(null);
                setIndex(0);
                setAnswers({});
                setResult(null);
                void (async () => {
                  const next = await apiFetch<NextPathResponse>("/v1/path/next");
                  if (!next.data.lesson) {
                    setError("All lessons completed for now.");
                    return;
                  }
                  setLessonId(next.data.lesson.id);
                  const full = await apiFetch<LessonResponse>(`/v1/lessons/${next.data.lesson.id}`);
                  setLesson(full.data.lesson);
                })();
              }}
            >
              Next lesson
            </button>
          </div>
        </div>
      ) : (
        <section className="mt-8 rounded-lg border border-stone-200 bg-white/80 p-6">
          <p className="text-lg font-medium">{current.prompt}</p>
          <div className="mt-6 space-y-3">
            {current.type === "mcq" &&
              Array.isArray(current.payload.options) &&
              (current.payload.options as string[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAnswer(option)}
                  className={`block w-full rounded-md border px-4 py-3 text-left text-sm ${
                    answers[current.id] === option
                      ? "border-brand bg-brand/10"
                      : "border-stone-300 bg-white hover:bg-stone-50"
                  }`}
                >
                  {option}
                </button>
              ))}

            {(current.type === "cloze" || current.type === "short_write") && (
              <input
                className="w-full rounded-md border border-stone-300 px-3 py-2"
                value={String(answers[current.id] ?? "")}
                onChange={(e) => handleAnswer(e.target.value)}
                aria-label="Your answer"
              />
            )}

            {current.type === "reorder" && Array.isArray(current.payload.tokens) && (
              <input
                className="w-full rounded-md border border-stone-300 px-3 py-2"
                placeholder={(current.payload.tokens as string[]).join(" / ")}
                value={String(answers[current.id] ?? "")}
                onChange={(e) => handleAnswer(e.target.value.split(/\s+/).filter(Boolean))}
                aria-label="Reorder words separated by spaces"
              />
            )}

            {current.type === "match" && (
              <p className="text-sm text-stone-600">
                Mark as reviewed for now (full match UI comes next).
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => handleAnswer(true)}
                >
                  Mark done
                </button>
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={answers[current.id] === undefined}
            onClick={() => void handleNext()}
            className="mt-8 inline-flex min-h-11 items-center rounded-md bg-brand px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {index < lesson.exercises.length - 1 ? "Next" : "Submit lesson"}
          </button>
          {lessonId ? null : null}
        </section>
      )}
    </main>
  );
}
