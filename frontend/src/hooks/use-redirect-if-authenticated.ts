"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type UseRedirectIfAuthenticatedResult = {
  /** True while session status is unknown or a redirect is in flight. */
  readonly checking: boolean;
};

/**
 * Sends signed-in learners to the dashboard so they never see guest-only pages.
 */
export const useRedirectIfAuthenticated = (
  destination = "/dashboard",
): UseRedirectIfAuthenticatedResult => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        await apiFetch("/v1/me");
        if (!cancelled) {
          router.replace(destination);
        }
      } catch {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [destination, router]);

  return { checking };
};
