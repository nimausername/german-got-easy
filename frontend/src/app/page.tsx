import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { GuestGate } from "@/components/guest-gate";
import { HomeGrainientBackground } from "@/components/home-grainient-background";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";
import { buttonVariants } from "@/components/ui/button";
import { LEGAL } from "@/lib/legal";
import { cn } from "@/lib/utils";

const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "German Got Easy";

export default function HomePage() {
  return (
    <GuestGate>
      <main className="relative isolate flex min-h-dvh items-center overflow-hidden bg-transparent px-4 py-16 sm:px-6 sm:py-20">
        <HomeGrainientBackground />
        <ThemeToggleCorner />
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col">
          <BrandLink className="max-w-full text-4xl leading-none break-words sm:text-6xl md:text-7xl" />
          <h1 className="mt-5 max-w-2xl text-xl leading-snug text-brand-ink/90 sm:mt-6 sm:text-2xl md:text-3xl">
            Learn German with a clear path, daily flashcards, and progress that stays with you.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-brand-ink/80 sm:mt-4 sm:text-base">
            CEFR lessons, 4000 everyday words with example sentences, and spaced review — built for
            real exam readiness.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-12 w-full touch-manipulation px-6 sm:w-auto",
              )}
              aria-label={`Create a ${productName} account`}
            >
              Get started
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-12 w-full touch-manipulation px-6 sm:w-auto",
              )}
              aria-label="Log in to your account"
            >
              Log in
            </Link>
          </div>
          <section className="mt-6 max-w-md sm:mt-8" aria-label="Open source">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-brand-ink/80">
              <span>Open-source project by {LEGAL.controllerName}.</span>
              <a
                href={LEGAL.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-brand-ink underline-offset-4 hover:underline"
                aria-label={`${productName} on GitHub`}
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="size-4 shrink-0 fill-current"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </p>
          </section>
          <LegalFooterLinks className="mt-8 items-start text-left text-brand-ink/75 sm:mt-10" />
        </div>
      </main>
    </GuestGate>
  );
}
