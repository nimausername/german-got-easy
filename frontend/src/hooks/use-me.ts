"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";
import type { UserNavUser } from "@/components/user-nav";

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

type MeResponse = {
  data: MeData;
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

type MeCache = {
  data: MeData;
  at: number;
};

const ME_TTL_MS = 30_000;
let meCache: MeCache | null = null;
let meInFlight: Promise<MeData> | null = null;

/**
 * Clears the short-lived /v1/me cache (call on logout).
 */
export const clearMeCache = () => {
  meCache = null;
  meInFlight = null;
};

const fetchMe = async (): Promise<MeData> => {
  if (meCache && Date.now() - meCache.at < ME_TTL_MS) {
    return meCache.data;
  }
  if (!meInFlight) {
    meInFlight = apiFetch<MeResponse>("/v1/me")
      .then((response) => {
        meCache = { data: response.data, at: Date.now() };
        return response.data;
      })
      .finally(() => {
        meInFlight = null;
      });
  }
  return meInFlight;
};

/**
 * Loads the authenticated learner profile used by app chrome and dashboard.
 */
export const useMe = (options: UseMeOptions = {}): UseMeResult => {
  const { enabled = true, redirectOnUnauthorized = true } = options;
  const router = useRouter();
  const [me, setMe] = useState<MeData | null>(() =>
    meCache && Date.now() - meCache.at < ME_TTL_MS ? meCache.data : null,
  );
  const [loading, setLoading] = useState(enabled && !me);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      if (!(meCache && Date.now() - meCache.at < ME_TTL_MS)) {
        setLoading(true);
      }
      try {
        const data = await fetchMe();
        if (cancelled) return;
        setMe(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        clearMeCache();
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Please log in to continue.";
        setError(message);
        if (redirectOnUnauthorized) {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, redirectOnUnauthorized, router]);

  return { me, loading, error };
};
