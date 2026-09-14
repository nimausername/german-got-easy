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

/**
 * Loads the authenticated learner profile used by app chrome and dashboard.
 */
export const useMe = (options: UseMeOptions = {}): UseMeResult => {
  const { enabled = true, redirectOnUnauthorized = true } = options;
  const router = useRouter();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const response = await apiFetch<MeResponse>("/v1/me");
        setMe(response.data);
        setError(null);
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Please log in to continue.";
        setError(message);
        if (redirectOnUnauthorized) {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [enabled, redirectOnUnauthorized, router]);

  return { me, loading, error };
};
