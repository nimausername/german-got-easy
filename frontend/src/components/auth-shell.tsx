"use client";

import type { ReactNode } from "react";
import { BrandLink } from "@/components/brand-link";
import { GuestGate } from "@/components/guest-gate";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  readonly children: ReactNode;
};

/**
 * Compact guest-only layout for login and register.
 * Uses the dynamic viewport and a header row so the form fits a phone
 * without a page-level scrollbar; the main area can still scroll if the
 * keyboard or a validation alert makes the content taller than the screen.
 */
export const AuthShell = ({ children }: AuthShellProps) => (
  <GuestGate>
    <ScrollFade className="h-dvh max-h-dvh w-full">
      <main
        className={cn(
          "mx-auto flex min-h-full w-full max-w-md flex-col",
          "px-4 py-4 sm:px-6 sm:py-10",
          "pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        {/* my-auto centers when there is spare height; collapses to top when content overflows */}
        <div className="my-auto w-full">
          <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
            <BrandLink className="min-w-0 truncate text-xl sm:text-2xl" />
            <ThemeToggle />
          </header>
          {children}
        </div>
      </main>
    </ScrollFade>
  </GuestGate>
);
