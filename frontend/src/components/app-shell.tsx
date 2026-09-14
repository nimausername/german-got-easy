import type { ReactNode } from "react";
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";
import { cn } from "@/lib/utils";

type AppShellProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly width?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  readonly centered?: boolean;
  readonly showThemeToggle?: boolean;
};

const widthClass = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
  full: "max-w-6xl",
} as const;

/**
 * Consistent page container for authenticated and marketing flows.
 * Authenticated pages lock the viewport under the header; page chrome stays
 * fixed and only inner regions scroll (via PageFrame / ScrollFade).
 */
export const AppShell = ({
  children,
  className,
  width = "lg",
  centered = false,
  showThemeToggle = true,
}: AppShellProps) => (
  <>
    {showThemeToggle ? <ThemeToggleCorner /> : null}
    <main
      className={cn(
        "mx-auto w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10 md:py-12",
        showThemeToggle
          ? "min-h-dvh pb-10 sm:pb-12"
          : cn(
              "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
              "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12",
            ),
        widthClass[width],
        centered && "justify-center",
        className,
      )}
    >
      {children}
    </main>
  </>
);
