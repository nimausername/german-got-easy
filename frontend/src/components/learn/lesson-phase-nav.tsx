"use client";

import { BookOpenCheck, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type LessonPhaseNavProps = {
  readonly phase: "teach" | "practice" | "result";
  readonly teachCount: number;
  readonly practiceCount: number;
};

/**
 * Compact Teach / Practice phase indicator for the lesson player.
 */
export const LessonPhaseNav = ({
  phase,
  teachCount,
  practiceCount,
}: LessonPhaseNavProps) => {
  const teachActive = phase === "teach";
  const practiceActive = phase === "practice" || phase === "result";
  const teachDone = phase === "practice" || phase === "result";

  return (
    <div
      className="grid grid-cols-2 gap-2"
      role="navigation"
      aria-label="Lesson phases"
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors",
          teachActive
            ? "border-primary/40 bg-primary/10 text-brand-ink"
            : teachDone
              ? "border-border/80 bg-muted/40 text-muted-foreground"
              : "border-border/60 bg-card text-muted-foreground",
        )}
      >
        <GraduationCap className="size-4 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide uppercase">Teach</p>
          <p className="truncate text-sm">
            {teachCount > 0 ? `${teachCount} steps` : "Skip"}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors",
          practiceActive
            ? "border-primary/40 bg-primary/10 text-brand-ink"
            : "border-border/60 bg-card text-muted-foreground",
        )}
      >
        <BookOpenCheck className="size-4 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide uppercase">Practice</p>
          <p className="truncate text-sm">{practiceCount} tasks</p>
        </div>
      </div>
    </div>
  );
};
