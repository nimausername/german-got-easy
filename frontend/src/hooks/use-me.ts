"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserNavUser } from "@/components/user-nav";
import { ApiRequestError } from "@/lib/api";
import { fetchMe } from "@/lib/api-queries";
import { queryKeys } from "@/lib/query-keys";

export type MeData = {
  readonly user: UserNavUser & {
    readonly id: string;
    readonly targetLevel: string;
  };
  readonly progress: {
    readonly lessonsCompleted: number;
    readonly wordsDueToday: number;
    readonly wordsLearning: number;
    readonly wordsKnown: number;
    readonly streakDays: number;
  };
};

type UseMeOptions = {
  readonly enabled?: boolean;
  readonly redirectOnUnauthorized?: boolean;
};

type UseMeResult = {
  readonly me: MeData | null;
  readonly loading: boolean;
  readonly error: string | null;
};

/**
 * Clears cached learner profile queries (call on logout).
 */
export const clearMeCache = (queryClient?: { removeQueries: (opts: { queryKey: readonly unknown[] }) => void }) => {
  queryClient?.removeQueries({ queryKey: queryKeys.me });
};

/**
 * Loads the authenticated learner profile used by app chrome and dashboard.
 */
export const useMe = (options: UseMeOptions = {}): UseMeResult => {
  const { enabled = true, redirectOnUnauthorized = true } = options;
  const router = useRouter();
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.isError || !redirectOnUnauthorized) return;
    if (query.error instanceof ApiRequestError && query.error.status === 401) {
      router.replace("/login");
    }
  }, [query.error, query.isError, redirectOnUnauthorized, router]);

  const errorMessage =
    query.error instanceof ApiRequestError
      ? query.error.message
      : query.isError
        ? "Please log in to continue."
        : null;

  return {
    me: query.data ?? null,
    loading: query.isLoading || (query.isFetching && !query.data),
    error: errorMessage,
  };
};

type ShellUserState = {
  readonly user: UserNavUser | null;
  readonly loading: boolean;
};

/**
 * Shared /v1/me state for AuthenticatedShell so product pages reuse one cache.
 */
export const useShellUser = (): ShellUserState => {
  const { me, loading } = useMe();
  return {
    user: me?.user ?? null,
    loading,
  };
};

/**
 * Invalidates all authenticated product caches after logout.
 */
export const useClearSessionQueries = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.clear();
  };
};
