"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ListFilter, Search } from "lucide-react";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
} from "@/components/reui/autocomplete";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder";
import {
  VOCAB_CEFR_BANDS,
  VOCAB_STATUS_FILTERS,
  VOCAB_TOPICS,
} from "@/lib/vocabulary";
import { cn } from "@/lib/utils";

type SuggestionItem = {
  readonly id: string;
  readonly label: string;
  readonly translation: string;
};

type VocabularyFiltersProps = {
  readonly query: string;
  readonly topic: string;
  readonly cefrBand: string;
  readonly status: string;
  readonly loadedCount: number;
  readonly totalInBank: number | null;
  readonly loading: boolean;
  readonly suggestions: SuggestionItem[];
  readonly suggestionsLoading: boolean;
  readonly onQueryChange: (value: string) => void;
  readonly onTopicChange: (value: string) => void;
  readonly onCefrBandChange: (value: string) => void;
  readonly onStatusChange: (value: string) => void;
  readonly onClearAll: () => void;
  readonly onWordSelect: (wordId: string) => void;
};

const selectClassName =
  "flex h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Compact vocabulary find bar: search always visible; topic/level/status on demand.
 */
export const VocabularyFilters = ({
  query,
  topic,
  cefrBand,
  status,
  loadedCount,
  totalInBank,
  loading,
  suggestions,
  suggestionsLoading,
  onQueryChange,
  onTopicChange,
  onCefrBandChange,
  onStatusChange,
  onClearAll,
  onWordSelect,
}: VocabularyFiltersProps) => {
  const [desktopAutofocus, setDesktopAutofocus] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [topic, cefrBand, status].filter(Boolean).length;
  const hasActiveFilters = Boolean(query) || activeFilterCount > 0;
  const trimmedQuery = query.trim();
  const shouldShowSuggestions = trimmedQuery.length > 0;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktopAutofocus(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const handleSelectSuggestion = (item: SuggestionItem) => {
    onQueryChange(item.label);
    onWordSelect(item.id);
  };

  let suggestionStatus: ReactNode = null;
  if (suggestionsLoading) {
    suggestionStatus = (
      <div className="flex items-center gap-2">
        <IconPlaceholder
          lucide="LoaderCircleIcon"
          className="size-4 animate-spin"
          aria-hidden
        />
        Searching words…
      </div>
    );
  } else if (suggestions.length === 0) {
    suggestionStatus = `No matches for “${trimmedQuery}”`;
  } else {
    suggestionStatus = `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"}`;
  }

  const countLabel = loading
    ? "Loading…"
    : totalInBank === null
      ? `Showing ${loadedCount} word${loadedCount === 1 ? "" : "s"}`
      : `${loadedCount} shown · ${totalInBank} in bank`;

  return (
    <Card className="mt-4" size="sm">
      <CardContent className="space-y-3 pt-(--card-spacing)">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Find a word</p>
          <Button
            type="button"
            variant={filtersOpen || activeFilterCount > 0 ? "secondary" : "outline"}
            size="sm"
            className="shrink-0 touch-manipulation"
            aria-expanded={filtersOpen}
            aria-controls="vocab-filter-panel"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <ListFilter data-icon="inline-start" />
            Filters
            {activeFilterCount > 0 ? (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 justify-center bg-background px-1 tabular-nums"
              >
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
        </div>

        <section role="search" aria-label="Vocabulary search and filters" className="space-y-3">
          <Field className="gap-0">
            <FieldLabel htmlFor="vocab-search" className="sr-only">
              Search
            </FieldLabel>
            <Autocomplete
              items={shouldShowSuggestions ? suggestions : []}
              value={query}
              onValueChange={onQueryChange}
              itemToStringValue={(item: unknown) => (item as SuggestionItem).label}
              filter={null}
              autoHighlight
            >
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <AutocompleteInput
                  id="vocab-search"
                  placeholder="Search German or English…"
                  aria-label="Search vocabulary"
                  autoComplete="off"
                  autoFocus={desktopAutofocus}
                  showClear
                  size="lg"
                  className="h-10 ps-8"
                />
              </div>
              {shouldShowSuggestions ? (
                <AutocompleteContent>
                  <AutocompleteStatus>{suggestionStatus}</AutocompleteStatus>
                  <AutocompleteList>
                    {(item: SuggestionItem) => (
                      <AutocompleteItem
                        key={item.id}
                        value={item}
                        className="rounded-lg"
                        onClick={() => handleSelectSuggestion(item)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{item.label}</div>
                          <div className="truncate text-sm text-muted-foreground">
                            {item.translation}
                          </div>
                        </div>
                      </AutocompleteItem>
                    )}
                  </AutocompleteList>
                </AutocompleteContent>
              ) : null}
            </Autocomplete>
          </Field>

          <div
            id="vocab-filter-panel"
            hidden={!filtersOpen}
            className={cn(
              "grid gap-2.5 sm:grid-cols-3 sm:gap-3",
              filtersOpen ? "grid" : "hidden",
            )}
          >
            <Field className="gap-1.5">
              <FieldLabel htmlFor="vocab-topic">Topic</FieldLabel>
              <select
                id="vocab-topic"
                className={selectClassName}
                value={topic}
                aria-label="Filter by topic"
                onChange={(e) => onTopicChange(e.target.value)}
              >
                <option value="">All topics</option>
                {VOCAB_TOPICS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="vocab-cefr">CEFR</FieldLabel>
              <select
                id="vocab-cefr"
                className={selectClassName}
                value={cefrBand}
                aria-label="Filter by CEFR level"
                onChange={(e) => onCefrBandChange(e.target.value)}
              >
                <option value="">All levels</option>
                {VOCAB_CEFR_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="vocab-status">Status</FieldLabel>
              <select
                id="vocab-status"
                className={selectClassName}
                value={status}
                aria-label="Filter by learning status"
                onChange={(e) => onStatusChange(e.target.value)}
              >
                <option value="">All statuses</option>
                {VOCAB_STATUS_FILTERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground sm:text-sm" aria-live="polite">
              {countLabel}
            </p>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 touch-manipulation px-2"
                onClick={onClearAll}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </section>
      </CardContent>
    </Card>
  );
};
