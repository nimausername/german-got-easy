import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav, type UserNavUser } from "@/components/user-nav";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  readonly user?: UserNavUser | null;
  readonly loading?: boolean;
  readonly nav?: ReactNode;
  readonly className?: string;
};

const defaultNav = (
  <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
    <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
      Dashboard
    </Link>
    <Link href="/learn" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
      Learn
    </Link>
    <Link href="/flashcards" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
      Flashcards
    </Link>
  </nav>
);

/**
 * Full-width app header without a sidebar — brand, primary links, theme, and user menu.
 */
export const AppHeader = ({
  user = null,
  loading = false,
  nav = defaultNav,
  className,
}: AppHeaderProps) => (
  <header
    className={cn(
      "sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md",
      className,
    )}
  >
    <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-6">
      <BrandLink className="text-xl" />
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {nav}
        <ThemeToggle />
        {loading ? (
          <Skeleton className="h-8 w-28 rounded-full" />
        ) : user ? (
          <UserNav user={user} />
        ) : null}
      </div>
    </div>
  </header>
);
