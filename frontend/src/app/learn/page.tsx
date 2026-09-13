"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
    message?: string;
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
          setError(next.data.message ?? "All current lessons completed.");
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

  const handleNextLesson = async () => {
    setLessonId(null);
    setLesson(null);
    setIndex(0);
    setAnswers({});
    setResult(null);
    const next = await apiFetch<NextPathResponse>("/v1/path/next");
    if (!next.data.lesson) {
      setError(next.data.message ?? "All current lessons completed.");
      return;
    }
    setLessonId(next.data.lesson.id);
    const full = await apiFetch<LessonResponse>(`/v1/lessons/${next.data.lesson.id}`);
    setLesson(full.data.lesson);
  };

  if (error && !lesson) {
    const isCompleted = error.toLowerCase().includes("completed");
    return (
      <AppShell width="md" centered>
        <ErrorAlert
          title={isCompleted ? "Path complete" : "Lesson unavailable"}
          message={error}
        />
        <BackLink href="/dashboard" label="Dashboard" className="mt-4" />
      </AppShell>
    );
  }

  if (!lesson || !current) {
    return (
      <AppShell width="md">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-6 h-6 w-48" />
        <Skeleton className="mt-2 h-10 w-72" />
        <Skeleton className="mt-8 h-56 w-full" />
      </AppShell>
    );
  }

  const progressValue = ((index + (result ? 1 : 0)) / lesson.exercises.length) * 100;

  return (
    <AppShell width="md">
      <BackLink href="/dashboard" label="Dashboard" />
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{lesson.levelCode}</Badge>
        <Badge variant="outline">{lesson.unitTitle}</Badge>
      </div>
      <h1 className="mt-3 font-display text-3xl text-brand-ink">{lesson.title}</h1>

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
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Lesson complete</CardTitle>
            <CardDescription>{result}</CardDescription>
          </CardHeader>
          <CardFooter className="gap-3">
            <Link href="/dashboard" className={buttonVariants()}>
              Back to dashboard
            </Link>
            <Button type="button" variant="outline" onClick={() => void handleNextLesson()}>
              Next lesson
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">{current.prompt}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {current.type === "mcq" &&
              Array.isArray(current.payload.options) &&
              (current.payload.options as string[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={answers[current.id] === option ? "default" : "outline"}
                  className="h-auto w-full justify-start px-4 py-3 whitespace-normal"
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
                  placeholder={(current.payload.tokens as string[]).join(" / ")}
                  value={String(answers[current.id] ?? "")}
                  onChange={(e) => handleAnswer(e.target.value.split(/\s+/).filter(Boolean))}
                  aria-label="Reorder words separated by spaces"
                />
              </Field>
            )}

            {current.type === "match" && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Mark as reviewed for now (full match UI comes next).</span>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0"
                  onClick={() => handleAnswer(true)}
                >
                  Mark done
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              size="lg"
              disabled={answers[current.id] === undefined}
              onClick={() => void handleNext()}
            >
              {index < lesson.exercises.length - 1 ? "Next" : "Submit lesson"}
            </Button>
            {lessonId ? null : null}
          </CardFooter>
        </Card>
      )}
    </AppShell>
  );
}
