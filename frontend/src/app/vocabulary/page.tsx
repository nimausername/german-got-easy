"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { ErrorAlert } from "@/components/error-alert";
import { PageFrame } from "@/components/page-frame";
import { VocabularyListSkeleton } from "@/components/skeletons";
import { VocabularyFilters } from "@/components/vocabulary-filters";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useShellUser } from "@/hooks/use-me";
import { ApiRequestError } from "@/lib/api";
import { fetchWordsPage } from "@/lib/api-queries";
import { APP_CONTENT_WIDTH } from "@/lib/layout";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import {
  formatGermanLemma,
  progressLabel,
  topicTitle,
  type VocabularyWordListItem,
} from "@/lib/vocabulary";

const SUGGESTION_LIMIT = 8;
const VIRTUALIZE_AFTER = 40;

/**
 * Searchable curated vocabulary book ordered by everyday frequency.
 */
export default function VocabularyPage() {
  const router = useRouter();
  const shellUser = useShellUser();
  const listParentRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [cefrBand, setCefrBand] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filters = useMemo(
    () => ({
      q: debouncedQuery,
      topic,
      cefrBand,
      status,
    }),
    [cefrBand, debouncedQuery, status, topic],
  );

  const wordsQuery = useInfiniteQuery({
    queryKey: queryKeys.words(filters),
    queryFn: ({ pageParam }) =>
      fetchWordsPage({
        ...filters,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!(wordsQuery.error instanceof ApiRequestError) || wordsQuery.error.status !== 401) {
      return;
    }
    router.replace("/login");
  }, [router, wordsQuery.error]);

  const words = useMemo(
    () => wordsQuery.data?.pages.flatMap((page) => page.words) ?? [],
    [wordsQuery.data],
  );
  const totalInBank = wordsQuery.data?.pages[0]?.totalInBank ?? null;
  const nextCursor = wordsQuery.hasNextPage
    ? (wordsQuery.data?.pages.at(-1)?.nextCursor ?? null)
    : null;
  const loading = wordsQuery.isLoading;
  const loadingMore = wordsQuery.isFetchingNextPage;
  const error =
    wordsQuery.error instanceof ApiRequestError && wordsQuery.error.status === 401
      ? "Please log in to browse vocabulary."
      : wordsQuery.isError
        ? "Could not load vocabulary. Try again."
        : null;

  const suggestions = useMemo(
    () =>
      words.slice(0, SUGGESTION_LIMIT).map((word) => ({
        id: word.id,
        label: formatGermanLemma(word.article, word.lemma),
        translation: word.translation,
      })),
    [words],
  );

  const useVirtual = words.length > VIRTUALIZE_AFTER;
  const rowVirtualizer = useVirtualizer({
    count: useVirtual ? words.length : 0,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 96,
    overscan: 6,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const handleLoadMore = () => {
    if (!wordsQuery.hasNextPage || loadingMore) return;
    void wordsQuery.fetchNextPage();
  };

  const handleClearFilters = () => {
    setQuery("");
    setTopic("");
    setCefrBand("");
    setStatus("");
  };

  const renderWordLink = (word: VocabularyWordListItem) => (
    <Link
      key={word.id}
      href={`/vocabulary/${word.id}`}
      className={cn(
        "block rounded-xl border border-border/80 bg-card px-3 py-3 transition-colors hover:bg-accent/40 sm:px-4",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        "touch-manipulation active:bg-accent/50",
      )}
      aria-label={`Open ${formatGermanLemma(word.article, word.lemma)}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium break-words text-foreground">
            {formatGermanLemma(word.article, word.lemma)}
          </p>
          <p className="mt-0.5 text-sm break-words text-muted-foreground">
            {word.translation}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:justify-end">
          <Badge variant="outline">{topicTitle(word.topic)}</Badge>
          <Badge variant="secondary">{progressLabel(word.progressStatus)}</Badge>
        </div>
      </div>
    </Link>
  );

  return (
    <AuthenticatedShell
      width={APP_CONTENT_WIDTH}
      className="pt-6 sm:pt-8"
      user={shellUser.user}
      loading={shellUser.loading}
    >
      <PageFrame
        contentRef={listParentRef}
        header={
          <>
            <h1 className="font-display text-2xl text-brand-ink sm:text-4xl">Vocabulary</h1>
            <p className="mt-1 hidden max-w-xl text-sm text-muted-foreground sm:mt-3 sm:block sm:text-base">
              Browse the everyday word bank by frequency, look up meanings and examples, then
              practice with flashcards.
            </p>
            <VocabularyFilters
              query={query}
              topic={topic}
              cefrBand={cefrBand}
              status={status}
              loadedCount={words.length}
              totalInBank={totalInBank}
              loading={loading}
              suggestions={suggestions}
              suggestionsLoading={loading && Boolean(debouncedQuery)}
              onQueryChange={setQuery}
              onTopicChange={setTopic}
              onCefrBandChange={setCefrBand}
              onStatusChange={setStatus}
              onClearAll={handleClearFilters}
              onWordSelect={(wordId) => router.push(`/vocabulary/${wordId}`)}
            />
            {error ? (
              <div className="mt-4">
                <ErrorAlert message={error} />
              </div>
            ) : null}
          </>
        }
        contentClassName="pb-2"
      >
        <section className="space-y-2 sm:space-y-3" aria-label="Vocabulary results">
          {loading ? <VocabularyListSkeleton /> : null}

          {!loading && words.length === 0 ? (
            <p className="text-sm text-muted-foreground">No words match these filters.</p>
          ) : null}

          {!loading && !useVirtual ? words.map((word) => renderWordLink(word)) : null}

          {!loading && useVirtual ? (
            <div
              className="relative w-full"
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                contain: "strict",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const word = words[virtualRow.index];
                if (!word) return null;
                return (
                  <div
                    key={word.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute top-0 left-0 w-full pb-2 sm:pb-3"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderWordLink(word)}
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        {nextCursor ? (
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full touch-manipulation sm:w-auto"
              disabled={loadingMore}
              onClick={handleLoadMore}
              aria-label="Load more vocabulary words"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>
        ) : null}

        <p className="mt-8 text-sm text-muted-foreground">
          Prefer drills?{" "}
          <Link
            href="/flashcards"
            className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}
          >
            Study flashcards
          </Link>
        </p>
      </PageFrame>
    </AuthenticatedShell>
  );
}
