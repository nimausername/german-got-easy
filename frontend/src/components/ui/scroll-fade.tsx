"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

type ScrollFadeProps = ComponentProps<"div"> & {
  /** Scroll axis. Default is vertical. */
  readonly orientation?: "y" | "x";
  /** Hide the native scrollbar. Default true — pairs with edge fades. */
  readonly hideScrollbar?: boolean;
  /** Fade depth in px. Default 40. */
  readonly fadeSize?: number;
};

type EdgeState = {
  readonly overflow: boolean;
  readonly atStart: boolean;
  readonly atEnd: boolean;
};

const DEFAULT_FADE_SIZE = 40;
const EPSILON = 2;

/**
 * Overflow-only scroll classes (no edge fade). Prefer `ScrollFade` when fades
 * are needed — CSS-only scroll-fade falls back to a static both-edge mask in
 * browsers without scroll-driven animations.
 */
export const scrollOverflowYClassName =
  "no-scrollbar overflow-y-auto overscroll-y-contain";

/**
 * Horizontal overflow-only scroll classes.
 */
export const scrollOverflowXClassName =
  "no-scrollbar overflow-x-auto overscroll-x-contain";

/** @deprecated Use `ScrollFade` or `scrollOverflowYClassName`. */
export const scrollFadeYClassName = scrollOverflowYClassName;

/** @deprecated Use `ScrollFade` or `scrollOverflowXClassName`. */
export const scrollFadeXClassName = scrollOverflowXClassName;

const assignRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  ref.current = value;
};

const measureEdges = (
  element: HTMLElement,
  orientation: "y" | "x",
): EdgeState => {
  if (orientation === "x") {
    const max = element.scrollWidth - element.clientWidth;
    const overflow = max > EPSILON;
    const offset = element.scrollLeft;
    return {
      overflow,
      atStart: !overflow || offset <= EPSILON,
      atEnd: !overflow || offset >= max - EPSILON,
    };
  }

  const max = element.scrollHeight - element.clientHeight;
  const overflow = max > EPSILON;
  const offset = element.scrollTop;
  return {
    overflow,
    atStart: !overflow || offset <= EPSILON,
    atEnd: !overflow || offset >= max - EPSILON,
  };
};

const toMaskStyle = (
  orientation: "y" | "x",
  edges: EdgeState,
  fadeSize: number,
): CSSProperties | undefined => {
  if (!edges.overflow) return undefined;

  const start = edges.atStart ? 0 : fadeSize;
  const end = edges.atEnd ? 0 : fadeSize;

  if (start === 0 && end === 0) return undefined;

  const gradient =
    orientation === "x"
      ? `linear-gradient(to right, transparent 0, #000 ${start}px, #000 calc(100% - ${end}px), transparent 100%)`
      : `linear-gradient(to bottom, transparent 0, #000 ${start}px, #000 calc(100% - ${end}px), transparent 100%)`;

  return {
    WebkitMaskImage: gradient,
    maskImage: gradient,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  };
};

/**
 * Direction-aware scroll fade (shadcn-style), driven by scroll position so it
 * works in every browser — not only those with CSS scroll-driven animations.
 *
 * - At top: crisp top, fade bottom if more content
 * - Mid-scroll: fade both edges
 * - At bottom: fade top, crisp bottom
 * - No overflow: no fade
 */
export const ScrollFade = forwardRef<HTMLDivElement, ScrollFadeProps>(
  (
    {
      orientation = "y",
      hideScrollbar = true,
      fadeSize = DEFAULT_FADE_SIZE,
      className,
      style,
      onScroll,
      ...props
    },
    ref,
  ) => {
    const localRef = useRef<HTMLDivElement | null>(null);
    const edgesRef = useRef<EdgeState>({
      overflow: false,
      atStart: true,
      atEnd: true,
    });

    const applyEdges = useCallback(() => {
      const element = localRef.current;
      if (!element) return;

      const next = measureEdges(element, orientation);
      const prev = edgesRef.current;
      if (
        prev.overflow === next.overflow &&
        prev.atStart === next.atStart &&
        prev.atEnd === next.atEnd
      ) {
        return;
      }

      edgesRef.current = next;
      const mask = toMaskStyle(orientation, next, fadeSize);
      element.style.webkitMaskImage = mask?.WebkitMaskImage
        ? String(mask.WebkitMaskImage)
        : "";
      element.style.maskImage = mask?.maskImage ? String(mask.maskImage) : "";
      element.style.webkitMaskRepeat = mask?.WebkitMaskRepeat
        ? String(mask.WebkitMaskRepeat)
        : "";
      element.style.maskRepeat = mask?.maskRepeat ? String(mask.maskRepeat) : "";
      element.dataset.overflow = next.overflow ? "true" : "false";
      element.dataset.atStart = next.atStart ? "true" : "false";
      element.dataset.atEnd = next.atEnd ? "true" : "false";
    }, [fadeSize, orientation]);

    const setNode = useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node;
        assignRef(ref, node);
        if (node) {
          // Measure after layout so flex children have real heights.
          requestAnimationFrame(applyEdges);
        }
      },
      [applyEdges, ref],
    );

    useEffect(() => {
      const element = localRef.current;
      if (!element) return;

      applyEdges();

      const onScrollNative = () => applyEdges();
      element.addEventListener("scroll", onScrollNative, { passive: true });

      const resizeObserver = new ResizeObserver(() => applyEdges());
      resizeObserver.observe(element);
      if (element.firstElementChild) {
        resizeObserver.observe(element.firstElementChild);
      }

      const mutationObserver = new MutationObserver(() => applyEdges());
      mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        element.removeEventListener("scroll", onScrollNative);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }, [applyEdges]);

    return (
      <div
        {...props}
        ref={setNode}
        data-slot="scroll-fade"
        data-orientation={orientation}
        className={cn(
          orientation === "x"
            ? "min-h-0 overflow-x-auto overscroll-x-contain"
            : "min-h-0 overflow-y-auto overscroll-y-contain",
          hideScrollbar && "no-scrollbar",
          className,
        )}
        style={style}
        onScroll={(event) => {
          applyEdges();
          onScroll?.(event);
        }}
      />
    );
  },
);

ScrollFade.displayName = "ScrollFade";
