"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

type LessonStepNavProps = {
  readonly backLabel?: string;
  readonly nextLabel: string;
  readonly backDisabled?: boolean;
  readonly nextDisabled?: boolean;
  readonly onBack: () => void;
  readonly onNext: () => void;
};

/**
 * Balanced previous/next controls using ButtonGroup (ReUI pagination pattern).
 * Bottom clearance for the mobile tab bar lives on AppShell — keep this compact.
 */
export const LessonStepNav = ({
  backLabel = "Back",
  nextLabel,
  backDisabled = false,
  nextDisabled = false,
  onBack,
  onNext,
}: LessonStepNavProps) => (
  <div
    className="shrink-0 border-t border-border/60 bg-background pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pt-3 md:pb-2"
    role="navigation"
    aria-label="Lesson step navigation"
  >
    <ButtonGroup className="w-full max-w-lg [&>[data-slot=button]]:min-h-11 [&>[data-slot=button]]:flex-1">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="touch-manipulation"
        disabled={backDisabled}
        onClick={onBack}
        aria-label={backLabel}
      >
        <ChevronLeft data-icon="inline-start" />
        {backLabel}
      </Button>
      <Button
        type="button"
        size="lg"
        className="touch-manipulation"
        disabled={nextDisabled}
        onClick={onNext}
        aria-label={nextLabel}
      >
        {nextLabel}
        <ChevronRight data-icon="inline-end" />
      </Button>
    </ButtonGroup>
  </div>
);
