"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

type ThemeProviderProps = {
  readonly children: ReactNode;
};

/**
 * Enables class-based light/dark/system theming across the app.
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
  >
    <TooltipProvider>{children}</TooltipProvider>
  </NextThemesProvider>
);
