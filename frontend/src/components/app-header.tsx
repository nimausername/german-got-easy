"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learn", label: "Learn" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/vocabulary", label: "Vocabulary" },
] as const;

/**
 * Full-width app header without a sidebar — brand, primary links, theme, and user menu.
 */
export const AppHeader = ({
  user = null,
  loading = false,
  nav,
  className,
}: AppHeaderProps) => {
  const pathname = usePathname();

  const defaultNav = (
    <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              active && "bg-muted text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/80 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <BrandLink className="min-w-0 truncate text-lg sm:text-xl" />
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {nav ?? defaultNav}
          <ThemeToggle />
          {loading ? (
            <Skeleton className="hidden h-8 w-28 rounded-full sm:block" />
          ) : user ? (
            <UserNav user={user} />
          ) : null}
        </div>
      </div>
    </header>
  );
};
