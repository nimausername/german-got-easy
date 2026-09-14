"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { BackLink } from "@/components/back-link";
import { ErrorAlert } from "@/components/error-alert";
import { VocabularyWordStudy } from "@/components/vocabulary-word-study";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiRequestError } from "@/lib/api";
import type { VocabularyWordDetail } from "@/lib/vocabulary";

type WordResponse = {
  data: {
    word: VocabularyWordDetail;
  };
};

/**
 * Vocabulary reference entry optimized for encoding and practice follow-through.
 */
export default function VocabularyDetailPage() {
  const router = useRouter();
  const params = useParams<{ wordId: string }>();
  const wordId = params.wordId;
  const [word, setWord] = useState<VocabularyWordDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wordId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch<WordResponse>(`/v1/words/${wordId}`);
        setWord(response.data.word);
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) {
          setError("Please log in to view this word.");
          router.replace("/login");
          return;
        }
        if (err instanceof ApiRequestError && err.status === 404) {
          setError("Word not found.");
          return;
        }
        setError("Could not load this word.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router, wordId]);

  if (loading) {
    return (
      <AuthenticatedShell width="lg" className="pt-6 sm:pt-8">
        <BackLink href="/vocabulary" label="Vocabulary" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-5 w-32 max-w-full sm:w-40" />
          <Skeleton className="h-10 w-48 max-w-full sm:h-12 sm:w-72" />
          <Skeleton className="h-6 w-40 max-w-full sm:w-48" />
          <Skeleton className="mt-4 h-40 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </AuthenticatedShell>
    );
  }

  if (error || !word) {
    return (
      <AuthenticatedShell width="lg" centered>
        <ErrorAlert message={error ?? "Word not found."} />
        <BackLink href="/vocabulary" label="Vocabulary" className="mt-4" />
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell width="lg" className="pt-6 sm:pt-8">
      <BackLink href="/vocabulary" label="Vocabulary" />
      <VocabularyWordStudy word={word} />
    </AuthenticatedShell>
  );
}
