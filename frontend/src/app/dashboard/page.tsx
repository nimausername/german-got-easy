"use client";

import Link from "next/link";
import { BookOpen, BookText, Layers } from "lucide-react";
import { AuthenticatedShell } from "@/components/authenticated-shell";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { me, loading, error } = useMe();

  if (loading || !me) {
    return (
      <AuthenticatedShell width="2xl" user={null} loading>
        <div className="w-full space-y-4">
          <Skeleton className="h-9 w-48 max-w-full sm:h-10 sm:w-72" />
          <Skeleton className="h-5 w-40 sm:w-56" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
          {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
        </div>
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell width="2xl" user={me.user} loading={false}>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Welcome{me.user.displayName ? `, ${me.user.displayName}` : ""}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Your personal learning dashboard.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Target {me.user.targetLevel}</Badge>
        <Badge variant="outline">{me.progress.streakDays}-day streak</Badge>
      </div>

      <section className="mt-6 grid items-stretch gap-3 sm:mt-8 sm:gap-4 sm:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardDescription>Continue learning</CardDescription>
            <CardTitle>Lessons completed</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <p className="font-display text-3xl text-primary sm:text-4xl">
              {me.progress.lessonsCompleted}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Target level {me.user.targetLevel}
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/learn"
              className={cn(buttonVariants(), "min-h-11 w-full touch-manipulation sm:w-auto")}
            >
              <BookOpen data-icon="inline-start" />
              Continue lesson
            </Link>
          </CardFooter>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardDescription>Flashcards due</CardDescription>
            <CardTitle>Words to review</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <p className="font-display text-3xl text-primary sm:text-4xl">
              {me.progress.wordsDueToday}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Learning {me.progress.wordsLearning} · Known {me.progress.wordsKnown}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Link
              href="/flashcards"
              className={cn(buttonVariants(), "min-h-11 w-full touch-manipulation sm:w-auto")}
            >
              <Layers data-icon="inline-start" />
              Study flashcards
            </Link>
            <Link
              href="/vocabulary"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-11 w-full touch-manipulation sm:w-auto",
              )}
            >
              <BookText data-icon="inline-start" />
              Browse vocabulary
            </Link>
          </CardFooter>
        </Card>
      </section>

      <Separator className="my-6 sm:my-8" />

      <Link
        href="/placement"
        className={cn(buttonVariants({ variant: "link" }), "h-auto min-h-11 px-0")}
      >
        Take placement check
      </Link>
    </AuthenticatedShell>
  );
}
