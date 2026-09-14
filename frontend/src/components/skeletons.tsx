import type { ReactNode } from "react";
import { FLASHCARD_FACE_HEIGHT } from "@/components/flashcard-flip";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STUDY_CONTENT_CLASS } from "@/lib/layout";
import { cn } from "@/lib/utils";

/**
 * Header chrome shared by most authenticated pages (title + supporting line).
 */
export const PageTitleSkeleton = ({
  className,
  titleClassName = "h-8 w-48 sm:h-9 sm:w-64",
  subtitleClassName = "h-4 w-64 max-w-full sm:h-5 sm:w-80",
}: {
  readonly className?: string;
  readonly titleClassName?: string;
  readonly subtitleClassName?: string;
}) => (
  <div className={cn("space-y-2", className)}>
    <Skeleton className={titleClassName} />
    <Skeleton className={subtitleClassName} />
  </div>
);

/**
 * Back-link placeholder used on detail / nested routes.
 */
export const BackLinkSkeleton = ({ className }: { readonly className?: string }) => (
  <Skeleton className={cn("h-8 w-28 max-w-full rounded-md", className)} />
);

/**
 * Badge row placeholder (level / status chips).
 */
export const BadgeRowSkeleton = ({
  count = 2,
  className,
}: {
  readonly count?: number;
  readonly className?: string;
}) => (
  <div className={cn("flex flex-wrap items-center gap-2", className)}>
    {Array.from({ length: count }, (_, index) => (
      <Skeleton
        key={index}
        className={cn("h-5 rounded-full", index === 0 ? "w-12" : "w-20")}
      />
    ))}
  </div>
);

/**
 * Thin progress track placeholder.
 */
export const ProgressBarSkeleton = ({ className }: { readonly className?: string }) => (
  <div className={cn("max-w-md space-y-1.5", className)}>
    <div className="flex justify-between gap-3">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-3 w-8" />
    </div>
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
);

type CardSkeletonProps = {
  readonly size?: "default" | "sm";
  readonly className?: string;
  readonly descriptionWidth?: string;
  readonly titleWidth?: string;
  readonly body?: ReactNode;
  readonly footer?: ReactNode;
};

/**
 * Card chrome that mirrors live Card layout (header / body / footer).
 */
export const CardSkeleton = ({
  size = "sm",
  className,
  descriptionWidth = "w-28",
  titleWidth = "w-40",
  body,
  footer,
}: CardSkeletonProps) => (
  <Card size={size} className={cn("h-full", className)} aria-hidden>
    <CardHeader>
      <Skeleton className={cn("h-3.5", descriptionWidth)} />
      <Skeleton className={cn("h-4", titleWidth)} />
    </CardHeader>
    {body ? <CardContent className="flex flex-1 flex-col gap-3">{body}</CardContent> : null}
    {footer ? <CardFooter>{footer}</CardFooter> : null}
  </Card>
);

/**
 * Dashboard: welcome header + two action cards.
 */
export const DashboardPageSkeleton = () => (
  <div className="w-full space-y-4" aria-busy="true" aria-label="Loading dashboard">
    <div className="space-y-3">
      <Skeleton className="h-8 w-56 max-w-full sm:h-9 sm:w-72" />
      <Skeleton className="h-4 w-48 sm:h-5 sm:w-56" />
      <BadgeRowSkeleton />
    </div>
    <section className="grid items-stretch gap-3 sm:gap-4 sm:grid-cols-2">
      <CardSkeleton
        descriptionWidth="w-32"
        titleWidth="w-36"
        body={
          <>
            <Skeleton className="h-9 w-14 sm:h-10" />
            <Skeleton className="h-4 w-28" />
          </>
        }
        footer={<Skeleton className="h-11 w-full rounded-md sm:w-40" />}
      />
      <CardSkeleton
        descriptionWidth="w-28"
        titleWidth="w-32"
        body={
          <>
            <Skeleton className="h-9 w-14 sm:h-10" />
            <Skeleton className="h-4 w-44 max-w-full" />
          </>
        }
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Skeleton className="h-11 w-full rounded-md sm:w-36" />
            <Skeleton className="h-11 w-full rounded-md sm:w-40" />
          </div>
        }
      />
    </section>
    <Skeleton className="my-5 h-px w-full sm:my-8" />
    <Skeleton className="h-5 w-40" />
  </div>
);

/**
 * Learn hub: path header, continue card, unit grid.
 */
export const LearnHubPageSkeleton = () => (
  <div className="w-full" aria-busy="true" aria-label="Loading learn path">
    <div className="space-y-4">
      <BackLinkSkeleton />
      <BadgeRowSkeleton className="mt-4" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-8 w-44 sm:h-9 sm:w-56" />
        <Skeleton className="h-4 w-full max-w-xl sm:h-5" />
        <Skeleton className="h-4 w-full max-w-md sm:h-5" />
      </div>
      <ProgressBarSkeleton className="mt-5" />
      <CardSkeleton
        className="mt-5"
        descriptionWidth="w-20"
        titleWidth="w-48"
        body={<Skeleton className="h-4 w-56 max-w-full" />}
        footer={<Skeleton className="h-11 w-full rounded-md sm:w-40" />}
      />
    </div>
    <section className="mt-4 sm:mt-5">
      <Skeleton className="h-6 w-36 sm:h-7 sm:w-40" />
      <Skeleton className="mt-1 h-4 w-64 max-w-full" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <CardSkeleton
            key={index}
            descriptionWidth="w-20"
            titleWidth="w-36"
            body={
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-48 max-w-full" />
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </>
            }
            footer={<Skeleton className="h-11 w-full rounded-md" />}
          />
        ))}
      </div>
    </section>
  </div>
);

/**
 * Unit detail: header + lesson cards.
 */
export const LearnUnitPageSkeleton = () => (
  <div className="w-full" aria-busy="true" aria-label="Loading unit">
    <div className="space-y-4">
      <BackLinkSkeleton />
      <BadgeRowSkeleton className="mt-4" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-8 w-52 max-w-full sm:h-9 sm:w-72" />
        <Skeleton className="h-4 w-full max-w-xl sm:h-5" />
      </div>
      <ProgressBarSkeleton className="mt-6" />
    </div>
    <div className="mt-4 space-y-3 sm:mt-5">
      {Array.from({ length: 3 }, (_, index) => (
        <CardSkeleton
          key={index}
          size="default"
          descriptionWidth="w-24"
          titleWidth="w-48"
          body={
            <>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-52 max-w-full" />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </>
          }
          footer={<Skeleton className="h-11 w-full rounded-md sm:w-32" />}
        />
      ))}
    </div>
  </div>
);

/**
 * Lesson player: study header + content card + step nav.
 */
export const LessonPlayerPageSkeleton = () => (
  <div
    className={cn(STUDY_CONTENT_CLASS, "flex h-full min-h-0 flex-1 flex-col")}
    aria-busy="true"
    aria-label="Loading lesson"
  >
    <div className="shrink-0 space-y-4">
      <BackLinkSkeleton />
      <BadgeRowSkeleton count={3} />
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-full sm:h-9 sm:w-72" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
    <div className="mt-4 min-h-0 flex-1 sm:mt-5">
      <Card size="default" className="h-full min-h-56" aria-hidden>
        <CardHeader>
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-5 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-48 max-w-full" />
          <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
    <div className="mt-4 flex shrink-0 gap-2 sm:mt-5">
      <Skeleton className="h-11 w-24 rounded-md" />
      <Skeleton className="h-11 flex-1 rounded-md sm:flex-none sm:w-36" />
    </div>
  </div>
);

/**
 * Vocabulary list row matching the live word link layout.
 */
export const VocabularyWordRowSkeleton = () => (
  <div
    className="rounded-xl border border-border/80 bg-card px-3 py-3 sm:px-4"
    aria-hidden
  >
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <Skeleton className="h-5 w-36 max-w-full" />
        <Skeleton className="h-4 w-28 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-1.5 sm:justify-end">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

/**
 * Vocabulary results list while filters stay visible.
 */
export const VocabularyListSkeleton = ({ count = 6 }: { readonly count?: number }) => (
  <div className="space-y-2 sm:space-y-3" aria-busy="true" aria-label="Loading vocabulary">
    {Array.from({ length: count }, (_, index) => (
      <VocabularyWordRowSkeleton key={index} />
    ))}
  </div>
);

/**
 * Vocabulary detail matching VocabularyWordStudy sections.
 */
export const VocabularyDetailPageSkeleton = () => (
  <div className="w-full" aria-busy="true" aria-label="Loading word">
    <BackLinkSkeleton />
    <article className="mt-4 space-y-8 sm:mt-5">
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-7 sm:py-8">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-48 max-w-full sm:h-12 sm:w-72" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-7 w-full max-w-lg" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <div className="rounded-xl border border-dashed border-border/90 bg-background/50 px-4 py-5">
            <Skeleton className="mx-auto h-4 w-44" />
            <Skeleton className="mx-auto mt-3 h-11 w-full max-w-xs rounded-md sm:w-40" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-3 w-14" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border px-4 py-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-5 w-28" />
          </div>
          <div className="rounded-xl border px-4 py-3">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="mt-2 h-5 w-32" />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/80 bg-card px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="mx-auto h-3 w-48" />
      </section>

      <div className="flex flex-wrap gap-2 pb-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </article>
  </div>
);

/**
 * Flashcards topic picker grid.
 */
export const FlashcardsTopicsSkeleton = () => (
  <div
    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    aria-busy="true"
    aria-label="Loading flashcard topics"
  >
    {Array.from({ length: 6 }, (_, index) => (
      <CardSkeleton
        key={index}
        descriptionWidth="w-40 max-w-full"
        titleWidth="w-32"
        body={<Skeleton className="h-4 w-40 max-w-full" />}
        footer={<Skeleton className="h-11 w-full rounded-md" />}
        className={index >= 4 ? "hidden lg:flex" : undefined}
      />
    ))}
  </div>
);

/**
 * Flashcards page Suspense fallback (header + topics).
 */
export const FlashcardsPageSuspenseSkeleton = () => (
  <div className="w-full" aria-busy="true" aria-label="Loading flashcards">
    <PageTitleSkeleton
      titleClassName="h-9 w-40 font-display sm:h-10 sm:w-48"
      subtitleClassName="h-4 w-full max-w-xl sm:h-5"
    />
    <div className="mt-4 sm:mt-5">
      <FlashcardsTopicsSkeleton />
    </div>
  </div>
);

/**
 * Active flashcard session loading state.
 */
export const FlashcardsSessionSkeleton = () => (
  <div
    className="flex h-full min-h-0 flex-1 flex-col"
    aria-busy="true"
    aria-label="Loading flashcard session"
  >
    <div className={cn(STUDY_CONTENT_CLASS, "flex shrink-0 items-start justify-between gap-3")}>
      <Skeleton className="h-10 w-24 rounded-md" />
      <Skeleton className="mt-2 h-4 w-20" />
    </div>
    <div className={cn(STUDY_CONTENT_CLASS, "mt-2 shrink-0 space-y-2 sm:mt-3")}>
      <div className="space-y-2">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <BadgeRowSkeleton />
    </div>
    <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden px-10 sm:px-16 md:px-24">
      <div className={STUDY_CONTENT_CLASS}>
        <Skeleton
          className={cn(
            FLASHCARD_FACE_HEIGHT,
            "w-full rounded-2xl ring-1 ring-foreground/10",
          )}
        />
      </div>
    </div>
    <div className={cn(STUDY_CONTENT_CLASS, "min-h-14 shrink-0 sm:min-h-12")}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="hidden h-11 w-full rounded-md sm:block" />
        <Skeleton className="hidden h-11 w-full rounded-md sm:block" />
      </div>
    </div>
  </div>
);

/**
 * Placement check: title + quiz card with fields.
 */
export const PlacementPageSkeleton = () => (
  <div className="w-full" aria-busy="true" aria-label="Loading placement">
    <PageTitleSkeleton
      titleClassName="h-8 w-36 sm:h-9 sm:w-44"
      subtitleClassName="h-4 w-64 max-w-full sm:h-5 sm:w-80"
    />
    <div className="mt-4 sm:mt-5">
      <Card size="default" aria-hidden>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Skeleton className="h-11 w-full rounded-md sm:w-36" />
        </CardFooter>
      </Card>
    </div>
  </div>
);
