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
      className="grid grid-cols-2 gap-1.5 sm:gap-2"
      role="navigation"
      aria-label="Lesson phases"
    >
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5",
          teachActive
            ? "border-primary/40 bg-primary/10 text-brand-ink"
            : teachDone
              ? "border-border/80 bg-muted/40 text-muted-foreground"
              : "border-border/60 bg-card text-muted-foreground",
        )}
      >
        <GraduationCap className="size-3.5 shrink-0 sm:size-4" aria-hidden />
        <div className="min-w-0 leading-tight">
          <p className="text-[10px] font-medium tracking-wide uppercase sm:text-xs">
            Teach
          </p>
          <p className="truncate text-xs sm:text-sm">
            {teachCount > 0 ? `${teachCount} steps` : "Skip"}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5",
          practiceActive
            ? "border-primary/40 bg-primary/10 text-brand-ink"
            : "border-border/60 bg-card text-muted-foreground",
        )}
      >
        <BookOpenCheck className="size-3.5 shrink-0 sm:size-4" aria-hidden />
        <div className="min-w-0 leading-tight">
          <p className="text-[10px] font-medium tracking-wide uppercase sm:text-xs">
            Practice
          </p>
          <p className="truncate text-xs sm:text-sm">{practiceCount} tasks</p>
        </div>
      </div>
    </div>
  );
};
