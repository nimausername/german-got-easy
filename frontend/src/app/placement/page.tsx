"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { ErrorAlert } from "@/components/error-alert";
import { PageFrame } from "@/components/page-frame";
import { PlacementPageSkeleton } from "@/components/skeletons";
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
import { useShellUser } from "@/hooks/use-me";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { fetchPlacementItems } from "@/lib/api-queries";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export default function PlacementPage() {
  const router = useRouter();
  const shellUser = useShellUser();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const placementQuery = useQuery({
    queryKey: queryKeys.placement,
    queryFn: fetchPlacementItems,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!(placementQuery.error instanceof ApiRequestError) || placementQuery.error.status !== 401) {
      return;
    }
    router.replace("/login");
  }, [placementQuery.error, router]);

  const items = placementQuery.data ?? [];
  const loadError = placementQuery.isError ? "Please log in first." : null;
  const error = submitError ?? loadError;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
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
      setSubmitError(err instanceof Error ? err.message : "Could not submit placement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placementQuery.isLoading) {
    return (
      <AuthenticatedShell
        width="md"
        className="pt-6 sm:pt-8"
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <PlacementPageSkeleton />
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell
      width="md"
      className="pt-6 sm:pt-8"
      user={shellUser.user}
      loading={shellUser.loading}
    >
      <PageFrame
        header={
          <>
            <h1 className="font-display text-2xl text-brand-ink sm:text-3xl">Placement</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              A short check to suggest your starting level.
            </p>
            {error ? (
              <div className="mt-4">
                <ErrorAlert message={error} />
              </div>
            ) : null}
          </>
        }
        contentClassName="pb-2"
      >
        {result ? (
          <Card>
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
          <Card>
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
      </PageFrame>
    </AuthenticatedShell>
  );
}
