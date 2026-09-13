"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type MeResponse = {
  data: {
    user: {
      id: string;
      email: string | null;
      username: string | null;
      displayName: string | null;
      targetLevel: string;
    };
    progress: {
      lessonsCompleted: number;
      wordsDueToday: number;
      wordsLearning: number;
      wordsKnown: number;
      streakDays: number;
    };
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch<MeResponse>("/v1/me");
        setMe(response.data);
      } catch {
        setError("Please log in to continue.");
        router.replace("/login");
      }
    };
    void load();
  }, [router]);

  const handleLogout = async () => {
    const { setAccessToken } = await import("@/lib/api");
    await apiFetch("/v1/auth/logout", { method: "POST" });
    setAccessToken(null);
    router.push("/");
  };

  if (!me) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
        <p className="text-stone-600">{error ?? "Loading your dashboard…"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="font-display text-2xl text-brand-ink">
            German Got Easy
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            Welcome{me.user.displayName ? `, ${me.user.displayName}` : ""}
          </h1>
          <p className="mt-2 text-stone-600">Your personal learning dashboard.</p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:bg-stone-50"
        >
          Log out
        </button>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white/80 p-5">
          <p className="text-sm text-stone-500">Continue learning</p>
          <p className="mt-2 text-xl font-semibold">Lessons completed</p>
          <p className="mt-1 text-3xl font-display text-brand">{me.progress.lessonsCompleted}</p>
          <Link
            href="/learn"
            className="mt-4 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink"
          >
            Continue lesson
          </Link>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white/80 p-5">
          <p className="text-sm text-stone-500">Flashcards due</p>
          <p className="mt-2 text-xl font-semibold">Words to review</p>
          <p className="mt-1 text-3xl font-display text-brand">{me.progress.wordsDueToday}</p>
          <p className="mt-3 text-sm text-stone-500">
            Learning {me.progress.wordsLearning} · Known {me.progress.wordsKnown}
          </p>
          <Link
            href="/flashcards"
            className="mt-4 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink"
          >
            Study flashcards
          </Link>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/placement" className="text-sm font-semibold text-brand underline-offset-2 hover:underline">
          Take placement check
        </Link>
      </div>
    </main>
  );
}
