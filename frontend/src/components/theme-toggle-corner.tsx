import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Fixed theme control for public pages without the app header.
 */
export const ThemeToggleCorner = () => (
  <div className="absolute top-4 right-4 z-50 sm:top-6 sm:right-6">
    <ThemeToggle />
  </div>
);
