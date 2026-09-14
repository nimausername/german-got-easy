"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BookText, Layers, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/", "/login", "/register"] as const;

/** Focused study surfaces that already have their own step controls. */
const HIDDEN_STUDY_PREFIXES = ["/learn/lessons/"] as const;

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/flashcards", label: "Cards", icon: Layers },
  { href: "/vocabulary", label: "Words", icon: BookText },
] as const;

const shouldHideNav = (pathname: string) =>
  HIDDEN_PREFIXES.some((path) => pathname === path) ||
  HIDDEN_STUDY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

/**
 * Thumb-friendly primary navigation for phones and small tablets.
 * Hidden from md up where the header nav takes over.
 */
export const MobileBottomNav = () => {
  const pathname = usePathname();

  if (shouldHideNav(pathname)) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex min-w-0 flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn("size-5", active && "stroke-[2.25px]")}
                  aria-hidden
                />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
