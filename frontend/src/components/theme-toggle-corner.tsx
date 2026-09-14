import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Fixed theme control for public pages without the app header.
 */
export const ThemeToggleCorner = () => (
  <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50 sm:top-6 sm:right-6">
    <ThemeToggle />
  </div>
);
