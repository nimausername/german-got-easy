"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
} from "@/components/reui/autocomplete";
import { Filters } from "@/components/reui/filters/filters";
import {
  createFilterQuery,
  createFilterRule,
  flattenFilterConditions,
} from "@/components/reui/filters/filters-query";
import type {
  FilterField,
  FilterQuery,
} from "@/components/reui/filters/filters-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder";
import { apiFetch } from "@/lib/api";
import {
  formatGermanLemma,
  VOCAB_CEFR_BANDS,
  VOCAB_STATUS_FILTERS,
  VOCAB_TOPICS,
  type VocabularyWord,
} from "@/lib/vocabulary";

type VocabularyFiltersProps = {
  readonly query: string;
  readonly topic: string;
  readonly cefrBand: string;
  readonly status: string;
  readonly loadedCount: number;
  readonly totalInBank: number | null;
  readonly loading: boolean;
  readonly onQueryChange: (value: string) => void;
  readonly onTopicChange: (value: string) => void;
  readonly onCefrBandChange: (value: string) => void;
  readonly onStatusChange: (value: string) => void;
  readonly onClearAll: () => void;
  readonly onWordSelect: (wordId: string) => void;
};

type WordsResponse = {
  data: {
    words: VocabularyWord[];
    nextCursor: string | null;
  };
};

type SuggestionItem = {
  readonly id: string;
  readonly label: string;
  readonly translation: string;
  readonly topic: string;
};

const SUGGESTION_LIMIT = 8;
const SUGGESTION_DEBOUNCE_MS = 250;

const FILTER_FIELDS: FilterField[] = [
  {
    id: "topic",
    label: "Topic",
    type: "select",
    defaultOperator: "is",
    options: VOCAB_TOPICS.map((topic) => ({
      value: topic.id,
      label: topic.title,
    })),
  },
  {
    id: "cefrBand",
    label: "CEFR",
    type: "select",
    defaultOperator: "is",
    options: VOCAB_CEFR_BANDS.map((band) => ({
      value: band,
      label: band,
    })),
  },
  {
    id: "status",
    label: "Status",
    type: "select",
    defaultOperator: "is",
    options: VOCAB_STATUS_FILTERS.map((item) => ({
      value: item.id,
      label: item.label,
    })),
  },
];

const buildFilterQuery = (
  topic: string,
  cefrBand: string,
  status: string,
): FilterQuery => {
  const rules = [];
  if (topic) {
    rules.push(
      createFilterRule({
        id: "rule-topic",
        path: ["topic"],
        operator: "is",
        value: topic,
      }),
    );
  }
  if (cefrBand) {
    rules.push(
      createFilterRule({
        id: "rule-cefr",
        path: ["cefrBand"],
        operator: "is",
        value: cefrBand,
      }),
    );
  }
  if (status) {
    rules.push(
      createFilterRule({
        id: "rule-status",
        path: ["status"],
        operator: "is",
        value: status,
      }),
    );
  }
  return createFilterQuery(rules);
};

const applyFilterQuery = (
  next: FilterQuery,
  handlers: {
    onTopicChange: (value: string) => void;
    onCefrBandChange: (value: string) => void;
    onStatusChange: (value: string) => void;
  },
) => {
  let topic = "";
  let cefrBand = "";
  let status = "";

  for (const condition of flattenFilterConditions(next)) {
    if (condition.negated) continue;
    if (condition.operator !== "is" && condition.operator !== "is_any_of") {
      continue;
    }
    const raw = condition.values[0];
    if (raw === undefined || raw === null || raw === "") continue;
    const value = String(raw);
    const fieldId = condition.path[0];
    if (fieldId === "topic") topic = value;
    if (fieldId === "cefrBand") cefrBand = value;
    if (fieldId === "status") status = value;
  }

  handlers.onTopicChange(topic);
  handlers.onCefrBandChange(cefrBand);
  handlers.onStatusChange(status);
};

const toSuggestion = (word: VocabularyWord): SuggestionItem => ({
  id: word.id,
  label: formatGermanLemma(word.article, word.lemma),
  translation: word.translation,
  topic: word.topic,
});

/**
 * Vocabulary find controls: ReUI Autocomplete search + Filters chip bar.
 */
export const VocabularyFilters = ({
  query,
  topic,
  cefrBand,
  status,
  loadedCount,
  totalInBank,
  loading,
  onQueryChange,
  onTopicChange,
  onCefrBandChange,
  onStatusChange,
  onClearAll,
  onWordSelect,
}: VocabularyFiltersProps) => {
  const [desktopAutofocus, setDesktopAutofocus] = useState(false);
  // Own the chip tree locally. ReUI commits incomplete rules (field picked,
  // operator/value still empty); deriving query only from API params wiped them.
  const [filterQuery, setFilterQuery] = useState<FilterQuery>(() =>
    buildFilterQuery(topic, cefrBand, status),
  );
  const [fetchedSuggestions, setFetchedSuggestions] = useState<SuggestionItem[]>(
    [],
  );
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fields = useMemo(() => FILTER_FIELDS, []);
  const hasActiveFilters =
    Boolean(query) || Boolean(topic || cefrBand || status);
  const trimmedQuery = query.trim();
  const shouldShowSuggestions = trimmedQuery.length > 0;
  const suggestions = shouldShowSuggestions ? fetchedSuggestions : [];
  const suggestionsLoading = shouldShowSuggestions && fetchLoading;
  const suggestionsError = shouldShowSuggestions ? fetchError : null;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktopAutofocus(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!trimmedQuery) return;

    let ignore = false;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("q", trimmedQuery);
      params.set("limit", String(SUGGESTION_LIMIT));
      if (topic) params.set("topic", topic);
      if (cefrBand) params.set("cefrBand", cefrBand);
      if (status) params.set("status", status);

      void (async () => {
        if (ignore) return;
        setFetchLoading(true);
        setFetchError(null);
        try {
          const response = await apiFetch<WordsResponse>(`/v1/words?${params}`);
          if (ignore) return;
          setFetchedSuggestions(response.data.words.map(toSuggestion));
        } catch {
          if (ignore) return;
          setFetchedSuggestions([]);
          setFetchError("Could not load suggestions.");
        } finally {
          if (!ignore) setFetchLoading(false);
        }
      })();
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [trimmedQuery, topic, cefrBand, status]);

  const handleFilterQueryChange = (next: FilterQuery) => {
    setFilterQuery(next);
    applyFilterQuery(next, {
      onTopicChange,
      onCefrBandChange,
      onStatusChange,
    });
  };

  const handleClearAll = () => {
    setFilterQuery(createFilterQuery());
    setFetchedSuggestions([]);
    setFetchError(null);
    setFetchLoading(false);
    onClearAll();
  };

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
  } else if (suggestionsError) {
    suggestionStatus = suggestionsError;
  } else if (suggestions.length === 0) {
    suggestionStatus = `No matches for “${trimmedQuery}”`;
  } else {
    suggestionStatus = `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"}`;
  }

  return (
    <Card className="mt-6 sm:mt-8">
      <CardHeader>
        <CardTitle>Find a word</CardTitle>
        <CardDescription>
          Search German or English, then narrow with topic, level, and learning status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5">
        <section role="search" aria-label="Vocabulary search and filters" className="space-y-4 sm:space-y-5">
          <Field>
            <FieldLabel htmlFor="vocab-search">Search</FieldLabel>
            <Autocomplete
              items={suggestions}
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
                  placeholder="e.g. Haus or house"
                  aria-label="Search vocabulary"
                  autoComplete="off"
                  autoFocus={desktopAutofocus}
                  showClear
                  size="lg"
                  className="ps-8"
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

          <div className="space-y-2">
            <p className="text-sm font-medium">Filters</p>
            <div className="min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Filters
                fields={fields}
                query={filterQuery}
                onQueryChange={handleFilterQueryChange}
                size="sm"
                className="min-w-0"
              />
            </div>
          </div>

          {hasActiveFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleClearAll}>
              Clear all
            </Button>
          ) : null}
        </section>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading
            ? "Loading…"
            : totalInBank === null
              ? `Showing ${loadedCount} word${loadedCount === 1 ? "" : "s"}`
              : `Showing ${loadedCount} word${loadedCount === 1 ? "" : "s"} · ${totalInBank} in the word bank`}
        </p>
      </CardContent>
    </Card>
  );
};
