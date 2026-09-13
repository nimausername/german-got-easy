import type { ReactNode } from "react";
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";
import { cn } from "@/lib/utils";

type AppShellProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly width?: "sm" | "md" | "lg" | "xl";
  readonly centered?: boolean;
  readonly showThemeToggle?: boolean;
};

const widthClass = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
} as const;

/**
 * Consistent page container for authenticated and marketing flows.
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
        "mx-auto min-h-screen w-full px-6 py-12",
        widthClass[width],
        centered && "flex flex-col justify-center",
        className,
      )}
    >
      {children}
    </main>
  </>
);
