"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

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
    message?: string;
  };
};

export default function LessonPlayerPage() {
  const router = useRouter();
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
          setError(next.data.message ?? "All current lessons completed.");
          return;
        }
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
        data: { score: number; correctCount: number; total: number; passed: boolean };
      }>(`/v1/lessons/${lesson.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers: Object.entries(answers).map(([exerciseId, answer]) => ({
            exerciseId,
            answer,
          })),
        }),
      });
      const pct = Math.round(response.data.score * 100);
      setResult(
        response.data.passed
          ? `Score ${pct}% — lesson complete.`
          : `Score ${pct}% — need 70% to complete. Review and try again.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    }
  };

  const handleNextLesson = async () => {
    setLesson(null);
    setIndex(0);
    setAnswers({});
    setResult(null);
    const next = await apiFetch<NextPathResponse>("/v1/path/next");
    if (!next.data.lesson) {
      setError(next.data.message ?? "All current lessons completed.");
      return;
    }
    const full = await apiFetch<LessonResponse>(`/v1/lessons/${next.data.lesson.id}`);
    setLesson(full.data.lesson);
  };

  if (error && !lesson) {
    const isCompleted = error.toLowerCase().includes("completed");
    return (
      <AuthenticatedShell width="md" centered>
        <ErrorAlert
          title={isCompleted ? "Path complete" : "Lesson unavailable"}
          message={error}
        />
        <BackLink href="/dashboard" label="Dashboard" className="mt-4" />
      </AuthenticatedShell>
    );
  }

  if (!lesson || !current) {
    return (
      <AuthenticatedShell width="md" className="pt-6 sm:pt-8">
        <Skeleton className="h-8 w-32 max-w-full" />
        <Skeleton className="mt-6 h-6 w-48 max-w-full" />
        <Skeleton className="mt-2 h-10 w-72 max-w-full" />
        <Skeleton className="mt-8 h-56 w-full" />
      </AuthenticatedShell>
    );
  }

  const progressValue = ((index + (result ? 1 : 0)) / lesson.exercises.length) * 100;

  return (
    <AuthenticatedShell width="md" className="pt-6 sm:pt-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{lesson.levelCode}</Badge>
        <Badge variant="outline">{lesson.unitTitle}</Badge>
      </div>
      <h1 className="mt-3 font-display text-2xl break-words text-brand-ink sm:text-3xl">
        {lesson.title}
      </h1>

      <Progress value={progressValue} className="mt-6">
        <ProgressLabel>
          Exercise {Math.min(index + 1, lesson.exercises.length)} of {lesson.exercises.length}
        </ProgressLabel>
        <ProgressValue />
      </Progress>

      {error ? (
        <div className="mt-4">
          <ErrorAlert message={error} />
        </div>
      ) : null}

      {result ? (
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle>Lesson complete</CardTitle>
            <CardDescription>{result}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Link
              href="/dashboard"
              className={cn(buttonVariants(), "min-h-11 w-full touch-manipulation sm:w-auto")}
            >
              Back to dashboard
            </Link>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full touch-manipulation sm:w-auto"
              onClick={() => void handleNextLesson()}
            >
              Next lesson
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="text-base leading-relaxed sm:text-lg">
              {current.prompt}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {current.type === "mcq" &&
              Array.isArray(current.payload.options) &&
              (current.payload.options as string[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={answers[current.id] === option ? "default" : "outline"}
                  className="h-auto min-h-11 w-full justify-start px-4 py-3 touch-manipulation whitespace-normal"
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </Button>
              ))}

            {(current.type === "cloze" || current.type === "short_write") && (
              <Field>
                <FieldLabel htmlFor="lesson-answer" className="sr-only">
                  Your answer
                </FieldLabel>
                <Input
                  id="lesson-answer"
                  className="min-h-11 text-base"
                  value={String(answers[current.id] ?? "")}
                  onChange={(e) => handleAnswer(e.target.value)}
                  aria-label="Your answer"
                />
              </Field>
            )}

            {current.type === "reorder" && Array.isArray(current.payload.tokens) && (
              <Field>
                <FieldLabel htmlFor="reorder-answer" className="sr-only">
                  Reorder words
                </FieldLabel>
                <Input
                  id="reorder-answer"
                  className="min-h-11 text-base"
                  placeholder={(current.payload.tokens as string[]).join(" / ")}
                  value={String(answers[current.id] ?? "")}
                  onChange={(e) => handleAnswer(e.target.value.split(/\s+/).filter(Boolean))}
                  aria-label="Reorder words separated by spaces"
                />
              </Field>
            )}

            {current.type === "match" &&
              Array.isArray(current.payload.lefts) &&
              Array.isArray(current.payload.rights) && (
                <div className="space-y-3">
                  {(current.payload.lefts as string[]).map((left) => {
                    const selected =
                      answers[current.id] &&
                      typeof answers[current.id] === "object" &&
                      !Array.isArray(answers[current.id])
                        ? String(
                            (answers[current.id] as Record<string, string>)[left] ?? "",
                          )
                        : "";
                    return (
                      <Field key={left}>
                        <FieldLabel htmlFor={`match-${current.id}-${left}`}>
                          {left}
                        </FieldLabel>
                        <select
                          id={`match-${current.id}-${left}`}
                          className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none"
                          value={selected}
                          aria-label={`Match for ${left}`}
                          onChange={(e) => {
                            const prev =
                              answers[current.id] &&
                              typeof answers[current.id] === "object" &&
                              !Array.isArray(answers[current.id])
                                ? {
                                    ...(answers[current.id] as Record<string, string>),
                                  }
                                : {};
                            handleAnswer({ ...prev, [left]: e.target.value });
                          }}
                        >
                          <option value="">Choose…</option>
                          {(current.payload.rights as string[]).map((right) => (
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
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              size="lg"
              className="min-h-11 w-full touch-manipulation sm:w-auto"
              disabled={
                answers[current.id] === undefined ||
                (current.type === "match" &&
                  Array.isArray(current.payload.lefts) &&
                  (!(answers[current.id] && typeof answers[current.id] === "object") ||
                    Object.keys(answers[current.id] as object).length <
                      (current.payload.lefts as string[]).length ||
                    Object.values(answers[current.id] as Record<string, string>).some(
                      (value) => !value,
                    )))
              }
              onClick={() => void handleNext()}
            >
              {index < lesson.exercises.length - 1 ? "Next" : "Submit lesson"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </AuthenticatedShell>
  );
}
