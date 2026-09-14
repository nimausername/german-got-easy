"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { ErrorAlert } from "@/components/error-alert";
import { VocabularyFilters } from "@/components/vocabulary-filters";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  formatGermanLemma,
  progressLabel,
  topicTitle,
  type VocabularyWordListItem,
} from "@/lib/vocabulary";

type WordsResponse = {
  data: {
    words: VocabularyWordListItem[];
    nextCursor: string | null;
    totalInBank: number | null;
    matchedCount: number | null;
  };
};

const SUGGESTION_LIMIT = 8;
const VIRTUALIZE_AFTER = 40;

/**
 * Searchable curated vocabulary book ordered by everyday frequency.
 */
export default function VocabularyPage() {
  const router = useRouter();
  const listParentRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [cefrBand, setCefrBand] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [words, setWords] = useState<VocabularyWordListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalInBank, setTotalInBank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const buildQueryString = useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams();
      params.set("limit", "40");
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (topic) params.set("topic", topic);
      if (cefrBand) params.set("cefrBand", cefrBand);
      if (status) params.set("status", status);
      if (cursor) {
        params.set("cursor", cursor);
        params.set("includeCounts", "false");
      }
      return params.toString();
    },
    [cefrBand, debouncedQuery, status, topic],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch<WordsResponse>(`/v1/words?${buildQueryString()}`);
        setWords(response.data.words);
        setNextCursor(response.data.nextCursor);
        if (response.data.totalInBank !== null) {
          setTotalInBank(response.data.totalInBank);
        }
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) {
          setError("Please log in to browse vocabulary.");
          router.replace("/login");
          return;
        }
        setError("Could not load vocabulary. Try again.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [buildQueryString, router]);

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

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const response = await apiFetch<WordsResponse>(
        `/v1/words?${buildQueryString(nextCursor)}`,
      );
      setWords((prev) => [...prev, ...response.data.words]);
      setNextCursor(response.data.nextCursor);
    } catch {
      setError("Could not load more words.");
    } finally {
      setLoadingMore(false);
    }
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
    <AuthenticatedShell width="xl" className="pt-6 sm:pt-8">
      <h1 className="font-display text-3xl text-brand-ink sm:text-4xl">Vocabulary</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
        Browse the everyday word bank by frequency, look up meanings and examples, then practice
        with flashcards.
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
        <div className="mt-6">
          <ErrorAlert message={error} />
        </div>
      ) : null}

      <section className="mt-6 space-y-2 sm:mt-8 sm:space-y-3" aria-label="Vocabulary results">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : null}

        {!loading && words.length === 0 ? (
          <p className="text-sm text-muted-foreground">No words match these filters.</p>
        ) : null}

        {!loading && !useVirtual
          ? words.map((word) => renderWordLink(word))
          : null}

        {!loading && useVirtual ? (
          <div
            ref={listParentRef}
            className="max-h-[70vh] overflow-auto"
            style={{ contain: "strict" }}
          >
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
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
            onClick={() => void handleLoadMore()}
            aria-label="Load more vocabulary words"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}

      <p className="mt-8 text-sm text-muted-foreground">
        Prefer drills?{" "}
        <Link href="/flashcards" className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}>
          Study flashcards
        </Link>
      </p>
    </AuthenticatedShell>
  );
}
