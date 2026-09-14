"use client";

import Link from "next/link";
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
import { cn } from "@/lib/utils";

type UnitPathRowProps = {
  readonly href: string;
  readonly index: number;
  readonly title: string;
  readonly description: string | null;
  readonly lessonsCompleted: number;
  readonly lessonCount: number;
  readonly status: string;
};

/**
 * Unit card for the Learn hub — matches dashboard/flashcards Card styling.
 */
export const UnitPathRow = ({
  href,
  index,
  title,
  description,
  lessonsCompleted,
  lessonCount,
  status,
}: UnitPathRowProps) => {
  const pct = lessonCount > 0 ? Math.round((lessonsCompleted / lessonCount) * 100) : 0;
  const done = status === "COMPLETED";
  const inProgress = !done && lessonsCompleted > 0;

  return (
    <Card size="sm" className="h-full transition-colors hover:bg-accent/40">
      <CardHeader>
        <CardDescription>
          Unit {index}
          {done ? " · Done" : inProgress ? " · In progress" : ""}
        </CardDescription>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {description ?? "Theme unit with teach and practice lessons."}
        </p>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {lessonsCompleted}/{lessonCount} lessons
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <Progress value={pct} className="gap-0 [&_[data-slot=progress-track]]:h-1.5" />
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={href}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "min-h-11 w-full touch-manipulation",
          )}
          aria-label={`Open unit ${index}: ${title}`}
        >
          Open unit
        </Link>
      </CardFooter>
    </Card>
  );
};
