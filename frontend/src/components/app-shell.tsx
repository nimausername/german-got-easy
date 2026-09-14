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
 * Authenticated pages (theme toggle off) reserve space for the mobile bottom nav.
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
        "mx-auto min-h-screen w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 md:py-12",
        showThemeToggle
          ? "pb-10 sm:pb-12"
          : "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12",
        widthClass[width],
        centered && "flex flex-col justify-center",
        className,
      )}
    >
      {children}
    </main>
  </>
);
