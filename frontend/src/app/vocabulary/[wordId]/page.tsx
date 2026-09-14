"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { BackLink } from "@/components/back-link";
import { ErrorAlert } from "@/components/error-alert";
import { PageFrame } from "@/components/page-frame";
import { VocabularyDetailPageSkeleton } from "@/components/skeletons";
import { VocabularyWordStudy } from "@/components/vocabulary-word-study";
import { useShellUser } from "@/hooks/use-me";
import { ApiRequestError } from "@/lib/api";
import { fetchWord } from "@/lib/api-queries";
import { APP_CONTENT_WIDTH, APP_SHELL_CLASS } from "@/lib/layout";
import { queryKeys } from "@/lib/query-keys";

/**
 * Vocabulary reference entry optimized for encoding and practice follow-through.
 */
export default function VocabularyDetailPage() {
  const router = useRouter();
  const shellUser = useShellUser();
  const params = useParams<{ wordId: string }>();
  const wordId = params.wordId;

  const wordQuery = useQuery({
    queryKey: queryKeys.word(wordId ?? ""),
    queryFn: () => fetchWord(wordId!),
    enabled: Boolean(wordId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!(wordQuery.error instanceof ApiRequestError) || wordQuery.error.status !== 401) {
      return;
    }
    router.replace("/login");
  }, [router, wordQuery.error]);

  const word = wordQuery.data ?? null;
  const error =
    wordQuery.error instanceof ApiRequestError && wordQuery.error.status === 404
      ? "Word not found."
      : wordQuery.error instanceof ApiRequestError && wordQuery.error.status === 401
        ? "Please log in to view this word."
        : wordQuery.isError
          ? "Could not load this word."
          : null;

  if (wordQuery.isLoading) {
    return (
      <AuthenticatedShell
        width={APP_CONTENT_WIDTH}
        className={APP_SHELL_CLASS}
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <VocabularyDetailPageSkeleton />
      </AuthenticatedShell>
    );
  }

  if (error || !word) {
    return (
      <AuthenticatedShell
        width={APP_CONTENT_WIDTH}
        centered
        user={shellUser.user}
        loading={shellUser.loading}
      >
        <ErrorAlert message={error ?? "Word not found."} />
        <BackLink href="/vocabulary" label="Vocabulary" className="mt-4" />
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell
      width={APP_CONTENT_WIDTH}
      className={APP_SHELL_CLASS}
      user={shellUser.user}
      loading={shellUser.loading}
    >
      <PageFrame
        header={<BackLink href="/vocabulary" label="Vocabulary" />}
        contentClassName="pb-2"
      >
        <VocabularyWordStudy word={word} />
      </PageFrame>
    </AuthenticatedShell>
  );
}
