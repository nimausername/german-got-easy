"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Layers } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AppShell } from "@/components/app-shell";
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
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type MeResponse = {
  data: {
    user: {
      id: string;
      email: string | null;
      username: string | null;
      displayName: string | null;
      targetLevel: string;
    };
    progress: {
      lessonsCompleted: number;
      wordsDueToday: number;
      wordsLearning: number;
      wordsKnown: number;
      streakDays: number;
    };
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch<MeResponse>("/v1/me");
        setMe(response.data);
      } catch {
        setError("Please log in to continue.");
        router.replace("/login");
      }
    };
    void load();
  }, [router]);

  if (!me) {
    return (
      <>
        <AppHeader loading />
        <AppShell width="xl" showThemeToggle={false}>
          <div className="w-full space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-56" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </div>
            {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
          </div>
        </AppShell>
      </>
    );
  }

  return (
    <>
      <AppHeader user={me.user} />
      <AppShell width="xl" className="pt-8" showThemeToggle={false}>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome{me.user.displayName ? `, ${me.user.displayName}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">Your personal learning dashboard.</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Target {me.user.targetLevel}</Badge>
          <Badge variant="outline">{me.progress.streakDays}-day streak</Badge>
        </div>

        <section className="mt-8 grid items-stretch gap-4 sm:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardDescription>Continue learning</CardDescription>
              <CardTitle>Lessons completed</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="font-display text-4xl text-primary">{me.progress.lessonsCompleted}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Target level {me.user.targetLevel}
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/learn" className={cn(buttonVariants(), "w-full sm:w-auto")}>
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
              <p className="font-display text-4xl text-primary">{me.progress.wordsDueToday}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Learning {me.progress.wordsLearning} · Known {me.progress.wordsKnown}
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/flashcards" className={cn(buttonVariants(), "w-full sm:w-auto")}>
                <Layers data-icon="inline-start" />
                Study flashcards
              </Link>
            </CardFooter>
          </Card>
        </section>

        <Separator className="my-8" />

        <Link href="/placement" className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}>
          Take placement check
        </Link>
      </AppShell>
    </>
  );
}
