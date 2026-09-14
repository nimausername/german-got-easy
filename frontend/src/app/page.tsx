import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { GuestGate } from "@/components/guest-gate";
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "German Got Easy";

export default function HomePage() {
  return (
    <GuestGate>
      <main className="relative flex min-h-dvh items-center overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
        <ThemeToggleCorner />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col">
          <BrandLink className="max-w-full text-4xl leading-none break-words sm:text-6xl md:text-7xl" />
          <h1 className="mt-5 max-w-2xl text-xl leading-snug text-muted-foreground sm:mt-6 sm:text-2xl md:text-3xl">
            Learn German with a clear path, daily flashcards, and progress that stays with you.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
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
        </div>
      </main>
    </GuestGate>
  );
}
