"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { BackLink } from "@/components/back-link";
import { ErrorAlert } from "@/components/error-alert";
import { LessonListItem } from "@/components/learn/lesson-list-item";
import { PageFrame } from "@/components/page-frame";
import { LearnUnitPageSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useShellUser } from "@/hooks/use-me";
import { ApiRequestError } from "@/lib/api";
import { fetchUnit } from "@/lib/api-queries";
import { APP_CONTENT_WIDTH, APP_SHELL_CLASS } from "@/lib/layout";
import { queryKeys } from "@/lib/query-keys";

/**
 * Unit detail with ordered lesson list and progress.
 */
export default function LearnUnitPage() {
  const router = useRouter();
  const shellUser = useShellUser();
  const params = useParams<{ unitId: string }>();
  const unitId = params.unitId;

  const unitQuery = useQuery({
    queryKey: queryKeys.unit(unitId ?? ""),
    queryFn: () => fetchUnit(unitId!),
    enabled: Boolean(unitId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!(unitQuery.error instanceof ApiRequestError) || unitQuery.error.status !== 401) {
      return;
    }
    router.replace("/login");
  }, [router, unitQuery.error]);

  const unit = unitQuery.data ?? null;
  const error =
    unitQuery.error instanceof Error
      ? unitQuery.error.message
      : unitQuery.isError
        ? "Failed to load unit"
        : null;

  const completedCount = useMemo(
    () => unit?.lessons.filter((lesson) => lesson.status === "COMPLETED").length ?? 0,
    [unit],
  );
  const unitPct = useMemo(() => {
    if (!unit || unit.lessons.length === 0) return 0;
    return Math.round((completedCount / unit.lessons.length) * 100);
  }, [completedCount, unit]);

  if (error && !unit) {
    return (
      <AuthenticatedShell
        width="md"
        centered
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <ErrorAlert title="Unit unavailable" message={error} />
        <BackLink href="/learn" label="Learn" className="mt-4" />
      </AuthenticatedShell>
    );
  }

  if (!unit) {
    return (
      <AuthenticatedShell
        width={APP_CONTENT_WIDTH}
        className={APP_SHELL_CLASS}
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <LearnUnitPageSkeleton />
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
            <BackLink href="/learn" label="Learn" />
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge variant="secondary">{unit.levelCode}</Badge>
              <Badge variant="outline" className="hidden sm:inline-flex">
                {unit.levelTitle}
              </Badge>
              {unit.status === "COMPLETED" ? <Badge>Completed</Badge> : null}
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">
                {unit.title}
              </h1>
              {unit.description ? (
                <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-muted-foreground sm:mt-2 sm:line-clamp-none sm:text-base">
                  {unit.description}
                </p>
              ) : null}
            </div>
            <div className="max-w-md">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground sm:mb-1.5">
                <span>
                  {completedCount}/{unit.lessons.length} lessons
                </span>
                <span className="tabular-nums">{unitPct}%</span>
              </div>
              <Progress value={unitPct} className="gap-0 [&_[data-slot=progress-track]]:h-2" />
            </div>
          </div>
        }
        contentClassName="pb-2"
      >
        <div className="space-y-2.5 sm:space-y-3">
          {unit.lessons.map((lesson, index) => (
            <LessonListItem
              key={lesson.id}
              href={`/learn/lessons/${lesson.id}`}
              index={index + 1}
              title={lesson.title}
              canDo={lesson.canDo}
              summary={lesson.summary}
              skillTags={lesson.skillTags}
              status={lesson.status}
              score={lesson.score}
            />
          ))}
        </div>
      </PageFrame>
    </AuthenticatedShell>
  );
}
