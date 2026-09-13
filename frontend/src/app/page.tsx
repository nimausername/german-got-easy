import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "German Got Easy";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden">
      <ThemeToggleCorner />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col px-6 py-16">
        <BrandLink className="text-5xl sm:text-7xl" />
        <h1 className="mt-6 max-w-2xl text-2xl leading-snug text-muted-foreground sm:text-3xl">
          Learn German with a clear path, daily flashcards, and progress that stays with you.
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          CEFR lessons, 4000 everyday words with example sentences, and spaced review — built for
          real exam readiness.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "min-h-11 px-6")}
            aria-label={`Create a ${productName} account`}
          >
            Get started
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 px-6")}
            aria-label="Log in to your account"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
