"use client";

import type { ComponentProps, ReactNode, Ref } from "react";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { cn } from "@/lib/utils";

type PageFrameProps = {
  /** Sticky top chrome (title, progress, filters). */
  readonly header?: ReactNode;
  /** Sticky bottom chrome (step nav, primary actions). */
  readonly footer?: ReactNode;
  /** Scrollable body — uses scroll-fade when content overflows. */
  readonly children: ReactNode;
  readonly className?: string;
  readonly headerClassName?: string;
  readonly contentClassName?: string;
  readonly footerClassName?: string;
  /** Ref to the scroll container (e.g. virtualized lists). */
  readonly contentRef?: Ref<HTMLDivElement>;
} & Omit<ComponentProps<"div">, "children" | "className" | "ref">;

/**
 * Locked page layout: fixed header/footer, only the middle section scrolls.
 * `basis-0` is required so the scroller is height-bounded and can overflow.
 */
export const PageFrame = ({
  header,
  footer,
  children,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  contentRef,
  ...props
}: PageFrameProps) => (
  <div
    data-slot="page-frame"
    className={cn("flex h-full min-h-0 flex-1 flex-col", className)}
    {...props}
  >
    {header ? (
      <div data-slot="page-frame-header" className={cn("shrink-0", headerClassName)}>
        {header}
      </div>
    ) : null}
    <ScrollFade
      ref={contentRef}
      className={cn(
        "min-h-0 flex-1 basis-0 overflow-x-hidden",
        header ? "mt-4 sm:mt-5" : null,
        contentClassName,
      )}
    >
      {children}
    </ScrollFade>
    {footer ? (
      <div data-slot="page-frame-footer" className={cn("shrink-0", footerClassName)}>
        {footer}
      </div>
    ) : null}
  </div>
);
