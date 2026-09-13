"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Item = { id: string; prompt: string };

export default function PlacementPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch<{ data: { items: Item[] } }>("/v1/placement");
        setItems(response.data.items);
      } catch {
        setError("Please log in first.");
        router.replace("/login");
      }
    };
    void load();
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await apiFetch<{
      data: { suggestedLevel: string; score: number; total: number };
    }>("/v1/placement/submit", {
      method: "POST",
      body: JSON.stringify({
        answers: items.map((item) => ({ id: item.id, answer: answers[item.id] ?? "" })),
      }),
    });
    setResult(
      `Suggested level: ${response.data.suggestedLevel} (${response.data.score}/${response.data.total})`,
    );
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-medium text-brand">
        ← Dashboard
      </Link>
      <h1 className="mt-6 font-display text-3xl text-brand-ink">Placement</h1>
      <p className="mt-2 text-stone-600">A short check to suggest your starting level.</p>
      {error ? <p className="mt-4 text-red-700">{error}</p> : null}
      {result ? (
        <div className="mt-8 rounded-lg border border-stone-200 bg-white/80 p-6">
          <p className="text-xl font-semibold">{result}</p>
          <Link href="/learn" className="mt-4 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
            Start learning
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {items.map((item) => (
            <label key={item.id} className="block text-sm font-medium" htmlFor={item.id}>
              {item.prompt}
              <input
                id={item.id}
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
                value={answers[item.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))}
              />
            </label>
          ))}
          <button type="submit" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
            Get suggestion
          </button>
        </form>
      )}
    </main>
  );
}
