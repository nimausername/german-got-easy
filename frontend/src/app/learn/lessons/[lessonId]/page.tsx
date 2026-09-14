"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PartyPopper } from "lucide-react";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { BackLink } from "@/components/back-link";
import { ErrorAlert } from "@/components/error-alert";
import {
  isExerciseAnswerReady,
  LessonExerciseView,
} from "@/components/learn/lesson-exercise-view";
import { LessonPhaseNav } from "@/components/learn/lesson-phase-nav";
import { LessonStepNav } from "@/components/learn/lesson-step-nav";
import { resolveReorderTokens } from "@/components/learn/reorder-words-panel";
import { TeachBlockView } from "@/components/learn/teach-block-view";
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
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { LessonPlayerPageSkeleton } from "@/components/skeletons";
import { useShellUser } from "@/hooks/use-me";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { fetchLesson, fetchPathNext } from "@/lib/api-queries";
import { fireLessonConfetti } from "@/lib/confetti";
import { APP_CONTENT_WIDTH, STUDY_CONTENT_CLASS } from "@/lib/layout";
import { skillLabel } from "@/lib/learn";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type Phase = "teach" | "practice" | "result";

/**
 * Comfort-first lesson player: teach → practice → celebrate.
 * Mobile chrome stays compact so the teach/practice card keeps usable height.
 * Bottom tab bar is hidden on this route; AppShell’s tab clearance is overridden.
 */
const LESSON_SHELL_CLASS = "py-0 pt-2 pb-2 sm:pt-3 md:pb-6";

export default function LessonPlayerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const shellUser = useShellUser();
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;

  const lessonQuery = useQuery({
    queryKey: queryKeys.lesson(lessonId ?? ""),
    queryFn: () => fetchLesson(lessonId!),
    enabled: Boolean(lessonId),
    staleTime: 60_000,
  });

  const [phase, setPhase] = useState<Phase>("teach");
  const [teachIndex, setTeachIndex] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [scorePct, setScorePct] = useState(0);
  const [passed, setPassed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [sessionLessonId, setSessionLessonId] = useState<string | null>(null);

  const lesson = lessonQuery.data ?? null;

  useEffect(() => {
    if (!(lessonQuery.error instanceof ApiRequestError) || lessonQuery.error.status !== 401) {
      return;
    }
    router.replace("/login");
  }, [lessonQuery.error, router]);

  useEffect(() => {
    if (!lesson || lesson.id === sessionLessonId) return;
    setSessionLessonId(lesson.id);
    setPhase(lesson.teachBlocks.length > 0 ? "teach" : "practice");
    setTeachIndex(0);
    setPracticeIndex(0);
    setAnswers({});
    setScorePct(0);
    setPassed(false);
    setNextLessonId(null);
    setSubmitError(null);
  }, [lesson, sessionLessonId]);

  const currentTeach = useMemo(
    () => lesson?.teachBlocks[teachIndex],
    [lesson, teachIndex],
  );
  const currentExercise = useMemo(
    () => lesson?.exercises[practiceIndex],
    [lesson, practiceIndex],
  );

  const handleAnswer = (value: unknown) => {
    if (!currentExercise) return;
    setAnswers((prev) => ({ ...prev, [currentExercise.id]: value }));
  };

  const handleSubmitLesson = async () => {
    if (!lesson || submitting) return;
    setSubmitting(true);
    try {
      const response = await apiFetch<{
        data: { score: number; correctCount: number; total: number; passed: boolean };
      }>(`/v1/lessons/${lesson.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers: lesson.exercises.map((exercise) => {
            const stored = answers[exercise.id];
            if (exercise.type === "reorder") {
              const tokens = Array.isArray(exercise.payload.tokens)
                ? (exercise.payload.tokens as string[])
                : [];
              return {
                exerciseId: exercise.id,
                answer: resolveReorderTokens(stored, tokens),
              };
            }
            return { exerciseId: exercise.id, answer: stored };
          }),
        }),
      });
      const pct = Math.round(response.data.score * 100);
      setScorePct(pct);
      setPassed(response.data.passed);
      setPhase("result");

      if (response.data.passed) {
        fireLessonConfetti(response.data.score);
        void queryClient.invalidateQueries({ queryKey: queryKeys.me });
        void queryClient.invalidateQueries({ queryKey: queryKeys.levels });
        void queryClient.invalidateQueries({ queryKey: queryKeys.levelUnits("A1") });
        void queryClient.invalidateQueries({ queryKey: queryKeys.unit(lesson.unitId) });
        const next = await queryClient.fetchQuery({
          queryKey: queryKeys.pathNext,
          queryFn: fetchPathNext,
        });
        setNextLessonId(next.lesson?.id ?? null);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePracticeNext = () => {
    if (!lesson || !currentExercise) return;
    if (practiceIndex < lesson.exercises.length - 1) {
      setPracticeIndex((value) => value + 1);
      return;
    }
    void handleSubmitLesson();
  };

  const loadError =
    lessonQuery.error instanceof Error
      ? lessonQuery.error.message
      : lessonQuery.isError
        ? "Failed to load lesson"
        : null;
  const error = submitError ?? loadError;

  if (loadError && !lesson) {
    return (
      <AuthenticatedShell
        width="md"
        centered
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <ErrorAlert title="Lesson unavailable" message={loadError} />
        <BackLink href="/learn" label="Learn" className="mt-4" />
      </AuthenticatedShell>
    );
  }

  if (!lesson) {
    return (
      <AuthenticatedShell
        width={APP_CONTENT_WIDTH}
        className={LESSON_SHELL_CLASS}
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <LessonPlayerPageSkeleton />
      </AuthenticatedShell>
    );
  }

  const teachCount = lesson.teachBlocks.length;
  const practiceCount = lesson.exercises.length;
  const progressValue =
    phase === "teach"
      ? teachCount
        ? ((teachIndex + 1) / (teachCount + practiceCount)) * 100
        : 0
      : phase === "practice"
        ? ((teachCount + practiceIndex + 1) / (teachCount + practiceCount)) * 100
        : 100;

  const stepLabel =
    phase === "teach"
      ? `Teach ${Math.min(teachIndex + 1, Math.max(teachCount, 1))} of ${teachCount || 1}`
      : phase === "practice"
        ? `Practice ${Math.min(practiceIndex + 1, practiceCount)} of ${practiceCount}`
        : "Result";

  const stepFooter =
    phase === "teach" && currentTeach ? (
      <LessonStepNav
        backDisabled={teachIndex === 0}
        nextLabel={teachIndex < teachCount - 1 ? "Next" : "Start practice"}
        onBack={() => setTeachIndex((value) => Math.max(0, value - 1))}
        onNext={() => {
          if (teachIndex < teachCount - 1) {
            setTeachIndex((value) => value + 1);
            return;
          }
          setPhase("practice");
          setPracticeIndex(0);
        }}
      />
    ) : phase === "practice" && currentExercise ? (
      <LessonStepNav
        nextLabel={
          practiceIndex < practiceCount - 1
            ? "Next"
            : submitting
              ? "Checking…"
              : "Submit lesson"
        }
        nextDisabled={
          submitting ||
          !isExerciseAnswerReady(currentExercise, answers[currentExercise.id])
        }
        onBack={() => {
          if (practiceIndex === 0 && teachCount > 0) {
            setPhase("teach");
            setTeachIndex(teachCount - 1);
            return;
          }
          setPracticeIndex((value) => Math.max(0, value - 1));
        }}
        onNext={() => handlePracticeNext()}
      />
    ) : null;

  return (
    <AuthenticatedShell
      width={APP_CONTENT_WIDTH}
      className={LESSON_SHELL_CLASS}
      user={shellUser.user}
      loading={shellUser.loading}
    >
      <PageFrame
        className={STUDY_CONTENT_CLASS}
        header={
          <div className="space-y-2.5 sm:space-y-4">
            <BackLink href={`/learn/units/${lesson.unitId}`} label={lesson.unitTitle} />
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge variant="secondary">{lesson.levelCode}</Badge>
              <Badge variant="outline" className="hidden sm:inline-flex">
                {lesson.unitTitle}
              </Badge>
              {lesson.skillTags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="font-normal">
                  {skillLabel(tag)}
                </Badge>
              ))}
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight break-words sm:text-3xl">
                {lesson.title}
              </h1>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:mt-1.5 sm:line-clamp-none sm:text-sm">
                {lesson.canDo}
              </p>
            </div>
            <LessonPhaseNav
              phase={phase}
              teachCount={teachCount}
              practiceCount={practiceCount}
            />
            <Progress
              value={progressValue}
              className="gap-1.5 sm:gap-2 [&_[data-slot=progress-label]]:text-xs sm:[&_[data-slot=progress-label]]:text-sm [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-value]]:text-xs sm:[&_[data-slot=progress-value]]:text-sm"
            >
              <ProgressLabel>{stepLabel}</ProgressLabel>
              <ProgressValue />
            </Progress>
            {error ? <ErrorAlert message={error} /> : null}
          </div>
        }
        footer={stepFooter}
        headerClassName="pb-0.5"
        contentClassName="pb-2 sm:pb-4"
      >
        {phase === "result" ? (
          <Card className="animate-in fade-in-0 zoom-in-95 duration-300">
            <CardHeader className="text-center sm:text-left">
              {passed ? (
                <PartyPopper className="mx-auto size-8 text-primary sm:mx-0" aria-hidden />
              ) : null}
              <CardTitle className="font-display text-2xl sm:text-3xl">
                {passed ? "Well done!" : "Almost there"}
              </CardTitle>
              <CardDescription>
                {passed
                  ? `You scored ${scorePct}%. Lesson complete.`
                  : `You scored ${scorePct}%. You need 70% to finish — review the teach steps and try again.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Can-do: {lesson.canDo}</p>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href={`/learn/units/${lesson.unitId}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "min-h-11 w-full touch-manipulation sm:w-auto",
                )}
              >
                Back to unit
              </Link>
              {passed && nextLessonId ? (
                <Link
                  href={`/learn/lessons/${nextLessonId}`}
                  className={cn(
                    buttonVariants(),
                    "min-h-11 w-full touch-manipulation sm:w-auto",
                  )}
                >
                  Next lesson
                </Link>
              ) : null}
              {!passed ? (
                <Button
                  type="button"
                  className="min-h-11 w-full touch-manipulation sm:w-auto"
                  onClick={() => {
                    setPhase(teachCount > 0 ? "teach" : "practice");
                    setTeachIndex(0);
                    setPracticeIndex(0);
                    setAnswers({});
                    setSubmitError(null);
                  }}
                >
                  Try again
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        ) : null}

        {phase === "teach" && currentTeach ? (
          <Card key={`teach-${teachIndex}`} className="animate-in fade-in-0 duration-200">
            <CardHeader className="pb-0 sm:pb-0">
              <CardDescription>Teach · Step {teachIndex + 1}</CardDescription>
              <CardTitle className="sr-only">{currentTeach.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <TeachBlockView block={currentTeach} />
            </CardContent>
          </Card>
        ) : null}

        {phase === "practice" && currentExercise ? (
          <Card key={`practice-${practiceIndex}`} className="animate-in fade-in-0 duration-200">
            <CardHeader>
              <CardDescription>Practice · Task {practiceIndex + 1}</CardDescription>
              <CardTitle className="text-base leading-relaxed sm:text-lg">
                {currentExercise.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LessonExerciseView
                exercise={currentExercise}
                value={answers[currentExercise.id]}
                onAnswer={handleAnswer}
              />
            </CardContent>
          </Card>
        ) : null}
      </PageFrame>
    </AuthenticatedShell>
  );
}
