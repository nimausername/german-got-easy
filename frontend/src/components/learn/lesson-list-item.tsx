"use client";

import Link from "next/link";
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
import { skillLabel } from "@/lib/learn";
import { cn } from "@/lib/utils";

type LessonListItemProps = {
  readonly href: string;
  readonly index: number;
  readonly title: string;
  readonly canDo: string;
  readonly summary: string | null;
  readonly skillTags: string[];
  readonly status: string;
  readonly score: number | null;
};

/**
 * Lesson card for a unit page — shared Card chrome with the rest of the app.
 */
export const LessonListItem = ({
  href,
  index,
  title,
  canDo,
  summary,
  skillTags,
  status,
  score,
}: LessonListItemProps) => {
  const done = status === "COMPLETED";
  const inProgress = status === "IN_PROGRESS";
  const cta = done ? "Review lesson" : inProgress ? "Continue" : "Start lesson";

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          Lesson {index}
          {done && score != null ? ` · ${Math.round(score * 100)}%` : ""}
          {inProgress ? " · In progress" : ""}
        </CardDescription>
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/90">{canDo}</p>
        {summary ? <p className="text-sm text-muted-foreground">{summary}</p> : null}
        {skillTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {skillTags.map((tag) => (
              <Badge key={tag} variant="outline">
                {skillLabel(tag)}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Link
          href={href}
          className={cn(
            buttonVariants({ variant: done ? "outline" : "default" }),
            "min-h-11 w-full touch-manipulation sm:w-auto",
          )}
        >
          {cta}
        </Link>
      </CardFooter>
    </Card>
  );
};
