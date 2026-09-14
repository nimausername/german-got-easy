"use client";

import Link from "next/link";
import { BookOpen, BookText, Layers } from "lucide-react";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { PageFrame } from "@/components/page-frame";
import { DashboardPageSkeleton } from "@/components/skeletons";
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
import { useMe } from "@/hooks/use-me";
import { APP_CONTENT_WIDTH, APP_SHELL_CLASS } from "@/lib/layout";
import { cn } from "@/lib/utils";

/**
 * Home hub: streak/progress snapshot plus primary study destinations.
 * Mobile keeps chrome light so the action cards stay fully reachable.
 */
export default function DashboardPage() {
  const { me, loading, error } = useMe();

  if (loading || !me) {
    return (
      <AuthenticatedShell
        width={APP_CONTENT_WIDTH}
        className={APP_SHELL_CLASS}
        user={null}
        loading
      >
        <DashboardPageSkeleton />
        {error ? <p className="mt-4 text-sm text-muted-foreground">{error}</p> : null}
      </AuthenticatedShell>
    );
  }

  const firstName = me.user.displayName?.trim().split(/\s+/)[0] ?? null;

  return (
    <AuthenticatedShell
      width={APP_CONTENT_WIDTH}
      className={APP_SHELL_CLASS}
      user={me.user}
      loading={false}
    >
      <PageFrame
        header={
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
              <h1 className="min-w-0 text-xl font-semibold tracking-tight sm:text-3xl">
                Welcome{firstName ? `, ${firstName}` : ""}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge variant="secondary">Target {me.user.targetLevel}</Badge>
                <Badge variant="outline">{me.progress.streakDays}-day streak</Badge>
              </div>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block sm:text-base">
              Your personal learning dashboard.
            </p>
          </div>
        }
        contentClassName="pb-2"
      >
        <section className="grid items-stretch gap-2.5 sm:gap-4 sm:grid-cols-2">
          <Card className="h-full" size="sm">
            <CardHeader className="gap-0.5">
              <CardDescription>Continue learning</CardDescription>
              <CardTitle className="leading-snug">Lessons completed</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-1">
              <p className="font-display text-3xl leading-none text-primary sm:text-4xl">
                {me.progress.lessonsCompleted}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Target level {me.user.targetLevel}
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href="/learn"
                className={cn(buttonVariants(), "min-h-11 w-full touch-manipulation")}
              >
                <BookOpen data-icon="inline-start" />
                Continue lesson
              </Link>
            </CardFooter>
          </Card>

          <Card className="h-full" size="sm">
            <CardHeader className="gap-0.5">
              <CardDescription>Flashcards due</CardDescription>
              <CardTitle className="leading-snug">Words to review</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-1">
              <p className="font-display text-3xl leading-none text-primary sm:text-4xl">
                {me.progress.wordsDueToday}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Learning {me.progress.wordsLearning} · Known {me.progress.wordsKnown}
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href="/flashcards"
                className={cn(buttonVariants(), "min-h-11 w-full touch-manipulation")}
              >
                <Layers data-icon="inline-start" />
                Study flashcards
              </Link>
            </CardFooter>
          </Card>
        </section>

        <div className="mt-4 flex flex-col gap-1 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
          <Link
            href="/vocabulary"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-auto min-h-11 justify-start px-2 touch-manipulation sm:px-3",
            )}
          >
            <BookText data-icon="inline-start" />
            Browse vocabulary
          </Link>
          <Link
            href="/placement"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-auto min-h-11 justify-start px-2 touch-manipulation text-muted-foreground sm:px-3",
            )}
          >
            Take placement check
          </Link>
        </div>
      </PageFrame>
    </AuthenticatedShell>
  );
}
