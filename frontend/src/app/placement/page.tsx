"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { ErrorAlert } from "@/components/error-alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Item = { id: string; prompt: string };

export default function PlacementPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch<{ data: { items: Item[] } }>("/v1/placement");
        setItems(response.data.items);
      } catch {
        setError("Please log in first.");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit placement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedShell width="md" className="pt-6 sm:pt-8">
        <Skeleton className="h-8 w-28 max-w-full" />
        <Skeleton className="mt-6 h-10 w-56 max-w-full" />
        <Skeleton className="mt-8 h-64 w-full" />
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell width="md" className="pt-6 sm:pt-8">
      <h1 className="font-display text-2xl text-brand-ink sm:text-3xl">Placement</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        A short check to suggest your starting level.
      </p>

      {error ? (
        <div className="mt-4">
          <ErrorAlert message={error} />
        </div>
      ) : null}

      {result ? (
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle>Your suggestion</CardTitle>
            <CardDescription>{result}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              href="/learn"
              className={cn(buttonVariants(), "min-h-11 w-full touch-manipulation sm:w-auto")}
            >
              Start learning
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle>Quick check</CardTitle>
            <CardDescription>Answer briefly — spelling can be approximate.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="placement-form" onSubmit={(e) => void handleSubmit(e)}>
              <FieldGroup>
                {items.map((item) => (
                  <Field key={item.id}>
                    <FieldLabel htmlFor={item.id}>{item.prompt}</FieldLabel>
                    <Input
                      id={item.id}
                      className="min-h-11 text-base"
                      value={answers[item.id] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    />
                  </Field>
                ))}
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              form="placement-form"
              className="min-h-11 w-full touch-manipulation sm:w-auto"
              disabled={submitting || items.length === 0}
            >
              {submitting ? "Checking…" : "Get suggestion"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </AuthenticatedShell>
  );
}
