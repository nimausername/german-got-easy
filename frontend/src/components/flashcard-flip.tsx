"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  useEffect,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const BorderBeam = dynamic(
  () => import("border-beam").then((mod) => mod.BorderBeam),
  { ssr: false },
);

type FlashcardFlipProps = {
  readonly flipped: boolean;
  readonly onFlip: () => void;
  readonly front: ReactNode;
  readonly back: ReactNode;
  readonly className?: string;
  readonly frontClassName?: string;
  readonly backClassName?: string;
  readonly disabled?: boolean;
  readonly frontLabel?: string;
  readonly backLabel?: string;
};

/** Matches the card rotate transition so the pulse starts when the meaning face lands. */
const FLIP_MS = 500;

/** Fixed face height — sized to leave room for ratings inside the viewport. */
export const FLASHCARD_FACE_HEIGHT =
  "h-[min(34svh,16rem)] sm:h-[min(40svh,20rem)] md:h-[min(42svh,22rem)]";

const faceShellClass = cn(
  "col-start-1 row-start-1 flex h-full flex-col overflow-hidden",
  "rounded-2xl bg-card ring-1 ring-foreground/10",
  "shadow-[0_18px_50px_-28px_oklch(0.35_0.04_220/0.55)]",
  "dark:shadow-[0_18px_50px_-24px_oklch(0_0_0/0.55)]",
  "[backface-visibility:hidden] [transform-style:preserve-3d]",
);

/**
 * 3D flip card for active-recall study.
 * Pulse bloom room is provided by the study page stage padding (not by clipping
 * ancestors), so left/right glow is not cut off.
 */
export const FlashcardFlip = ({
  flipped,
  onFlip,
  front,
  back,
  className,
  frontClassName,
  backClassName,
  disabled = false,
  frontLabel = "Reveal answer",
  backLabel = "Hide answer",
}: FlashcardFlipProps) => {
  const { resolvedTheme } = useTheme();
  const beamTheme = resolvedTheme === "light" ? "light" : "dark";
  const [beamReady, setBeamReady] = useState(false);
  const [seenFlipped, setSeenFlipped] = useState(flipped);

  if (flipped !== seenFlipped) {
    setSeenFlipped(flipped);
    setBeamReady(false);
  }

  useEffect(() => {
    if (!flipped) return;

    const timer = window.setTimeout(() => {
      setBeamReady(true);
    }, FLIP_MS);

    return () => window.clearTimeout(timer);
  }, [flipped]);

  const beamVisible = flipped && beamReady;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (!disabled) onFlip();
    }
  };

  return (
    <div
      className={cn("relative w-full overflow-visible py-10 sm:py-12", className)}
      data-slot="flashcard-flip"
    >
      {beamVisible ? (
        <div
          className="pointer-events-none absolute inset-y-10 left-0 right-0 z-0 sm:inset-y-12"
          aria-hidden
        >
          <BorderBeam
            active
            size="pulse-outside"
            colorVariant="colorful"
            strength={1}
            brightness={2.4}
            saturation={1.55}
            theme={beamTheme}
            borderRadius={16}
            duration={2.4}
            className="h-full w-full"
          >
            <div className="h-full w-full rounded-2xl border border-border/70 bg-card" />
          </BorderBeam>
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10 w-full rounded-2xl [perspective:1400px]",
          FLASHCARD_FACE_HEIGHT,
        )}
      >
        <button
          type="button"
          disabled={disabled}
          aria-pressed={flipped}
          aria-label={flipped ? backLabel : frontLabel}
          onClick={() => {
            if (!disabled) onFlip();
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "group relative grid h-full w-full touch-manipulation rounded-2xl bg-transparent text-left outline-none",
            "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "[transform-style:preserve-3d]",
            "focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-default disabled:opacity-90",
            "active:scale-[0.985] sm:active:scale-[0.99]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          <div
            className={cn(
              faceShellClass,
              "[transform:translateZ(1px)]",
              frontClassName,
            )}
            aria-hidden={flipped}
          >
            {front}
          </div>
          <div
            className={cn(
              faceShellClass,
              "[transform:rotateY(180deg)_translateZ(1px)]",
              backClassName,
            )}
            aria-hidden={!flipped}
          >
            {back}
          </div>
        </button>
      </div>
    </div>
  );
};
