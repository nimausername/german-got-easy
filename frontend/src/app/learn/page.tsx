"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { BackLink } from "@/components/back-link";
import { ErrorAlert } from "@/components/error-alert";
import { UnitPathRow } from "@/components/learn/unit-path-row";
import { PageFrame } from "@/components/page-frame";
import { LearnHubPageSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useShellUser } from "@/hooks/use-me";
import { ApiRequestError } from "@/lib/api";
import { fetchLevels, fetchLevelUnits, fetchPathNext } from "@/lib/api-queries";
import { APP_CONTENT_WIDTH, APP_SHELL_CLASS } from "@/lib/layout";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

/**
 * Learn hub: continue CTA and A1 unit cards.
 * Sticky chrome stays minimal so the unit list keeps most of the viewport.
 */
export default function LearnHubPage() {
  const router = useRouter();
  const shellUser = useShellUser();

  const [levelsQuery, unitsQuery, pathQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.levels,
        queryFn: fetchLevels,
        staleTime: 60_000,
      },
      {
        queryKey: queryKeys.levelUnits("A1"),
        queryFn: () => fetchLevelUnits("A1"),
        staleTime: 60_000,
      },
      {
        queryKey: queryKeys.pathNext,
        queryFn: fetchPathNext,
        staleTime: 15_000,
      },
    ],
  });

  const loading = levelsQuery.isLoading || unitsQuery.isLoading || pathQuery.isLoading;
  const firstError = levelsQuery.error ?? unitsQuery.error ?? pathQuery.error;

  useEffect(() => {
    if (!(firstError instanceof ApiRequestError) || firstError.status !== 401) return;
    router.replace("/login");
  }, [firstError, router]);

  const units = unitsQuery.data?.units ?? [];
  const a1 = levelsQuery.data?.levels.find((level) => level.code === "A1");
  const levelTitle = a1?.title ?? unitsQuery.data?.level.title ?? "A1 Beginner";
  const lessonCount = a1?.lessonCount ?? 0;
  const unitsCompleted = a1?.unitsCompleted ?? 0;
  const nextLesson = pathQuery.data?.lesson ?? null;
  const pathMessage = pathQuery.data?.message ?? null;

  const pathPct = useMemo(() => {
    if (units.length === 0) return 0;
    const doneLessons = units.reduce((sum, unit) => sum + unit.lessonsCompleted, 0);
    const totalLessons = units.reduce((sum, unit) => sum + unit.lessonCount, 0);
    if (totalLessons === 0) return 0;
    return Math.round((doneLessons / totalLessons) * 100);
  }, [units]);

  const errorMessage =
    firstError instanceof Error ? firstError.message : firstError ? "Failed to load Learn" : null;

  if (loading) {
    return (
      <AuthenticatedShell
        width={APP_CONTENT_WIDTH}
        className={APP_SHELL_CLASS}
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <LearnHubPageSkeleton />
      </AuthenticatedShell>
    );
  }

  if (errorMessage && !unitsQuery.data) {
    return (
      <AuthenticatedShell
        width="md"
        centered
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <ErrorAlert title="Learn unavailable" message={errorMessage} />
        <BackLink href="/dashboard" label="Dashboard" className="mt-4" />
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell
      width={APP_CONTENT_WIDTH}
      className={APP_SHELL_CLASS}
      user={shellUser.user}
      loading={shellUser.loading}
    >
      <PageFrame
        header={
          <div className="space-y-2.5 sm:space-y-4">
            <BackLink
              href="/dashboard"
              label="Dashboard"
              className="hidden sm:inline-flex"
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">
                Learn German
              </h1>
              <Badge variant="secondary">A1</Badge>
              <Badge variant="outline" className="hidden sm:inline-flex">
                {levelTitle}
              </Badge>
            </div>
            <p className="hidden max-w-2xl text-sm text-muted-foreground sm:block sm:text-base">
              Learn a little, then practice it. Short steps, clear goals — comfortable on phone,
              tablet, and desktop.
            </p>
            <div className="max-w-md">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground sm:mb-1.5">
                <span>
                  {unitsCompleted}/{units.length} units · {lessonCount} lessons
                </span>
                <span className="tabular-nums">{pathPct}%</span>
              </div>
              <Progress value={pathPct} className="gap-0 [&_[data-slot=progress-track]]:h-2" />
            </div>
          </div>
        }
        contentClassName="pb-2"
      >
        <div className="space-y-4 sm:space-y-5">
          <Card size="sm">
            <CardHeader className="gap-0.5">
              <CardDescription>Continue</CardDescription>
              <CardTitle className="text-base leading-snug sm:text-base">
                {nextLesson ? nextLesson.title : pathMessage ?? "A1 path complete"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {nextLesson ? (
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {nextLesson.levelCode ? `${nextLesson.levelCode} · ` : ""}
                  {nextLesson.unitTitle ?? "Pick up where you left off"}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Review any unit below, or keep words warm with flashcards.
                </p>
              )}
            </CardContent>
            {nextLesson ? (
              <CardFooter>
                <Link
                  href={`/learn/lessons/${nextLesson.id}`}
                  className={cn(
                    buttonVariants(),
                    "min-h-11 w-full touch-manipulation sm:w-auto",
                  )}
                >
                  <BookOpen data-icon="inline-start" />
                  Continue lesson
                </Link>
              </CardFooter>
            ) : null}
          </Card>

          <section>
            <h2 className="text-base font-semibold tracking-tight sm:text-xl">Your A1 path</h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
              Open a unit anytime. Finish in order for the smoothest path.
            </p>

            {units.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground sm:mt-4">
                No units yet. Seed lesson content on the API.
              </p>
            ) : (
              <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {units.map((unit, index) => (
                  <UnitPathRow
                    key={unit.id}
                    href={`/learn/units/${unit.id}`}
                    index={index + 1}
                    title={unit.title}
                    description={unit.description}
                    lessonsCompleted={unit.lessonsCompleted}
                    lessonCount={unit.lessonCount}
                    status={unit.status}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </PageFrame>
    </AuthenticatedShell>
  );
}
