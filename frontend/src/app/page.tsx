import Link from "next/link";

const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "German Got Easy";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Cpath fill=%22%230f4c4d%22 fill-opacity=%220.04%22 d=%22M0 80V0h80%22/%3E%3C/svg%3E')]"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <p className="font-display text-5xl tracking-tight text-brand-ink sm:text-7xl">
          {productName}
        </p>
        <h1 className="mt-6 max-w-2xl text-2xl leading-snug text-stone-700 sm:text-3xl">
          Learn German with a clear path, daily flashcards, and progress that stays with you.
        </h1>
        <p className="mt-4 max-w-xl text-base text-stone-600">
          CEFR lessons, 4000 everyday words with example sentences, and spaced review — built for real exam readiness.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="Create an account"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-brand/30 bg-white/70 px-6 text-sm font-semibold text-brand-ink transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="Log in to your account"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
