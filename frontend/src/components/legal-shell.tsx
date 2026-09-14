import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";
import { cn } from "@/lib/utils";

type LegalShellProps = {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
};

/**
 * Readable layout for public legal documents. Available to guests and signed-in users.
 */
export const LegalShell = ({ title, description, children }: LegalShellProps) => (
  <div className="min-h-dvh w-full">
    <header
      className={cn(
        "sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-sm",
        "pt-[max(0.75rem,env(safe-area-inset-top))]",
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <BrandLink className="min-w-0 truncate text-xl sm:text-2xl" />
        <ThemeToggle />
      </div>
    </header>

    <main
      className={cn(
        "mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-12",
        "pb-[max(2rem,env(safe-area-inset-bottom))]",
      )}
    >
      <p className="text-xs text-muted-foreground">Last updated: {LEGAL.effectiveDate}</p>
      <h1 className="mt-2 font-display text-2xl tracking-tight text-brand-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
        {description}
      </p>

      <article className="mt-6 space-y-6 text-sm leading-relaxed text-foreground sm:mt-8 sm:space-y-8 sm:text-base">
        {children}
      </article>

      <nav
        className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 pt-6 text-sm"
        aria-label="Legal documents"
      >
        {LEGAL_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Home
        </Link>
      </nav>

      <p className="mt-6 text-xs text-muted-foreground">
        These pages describe the hosted service at {LEGAL.siteHost}. They are informational
        templates, not legal advice. Self-hosted copies of the open-source project are operated by
        whoever runs them.
      </p>
    </main>
  </div>
);

type LegalSectionProps = {
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
};

/**
 * One titled section inside a legal document.
 */
export const LegalSection = ({ id, title, children }: LegalSectionProps) => (
  <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
    <h2 id={`${id}-heading`} className="text-lg font-semibold tracking-tight sm:text-xl">
      {title}
    </h2>
    <div className="mt-3 space-y-3 text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      {children}
    </div>
  </section>
);
