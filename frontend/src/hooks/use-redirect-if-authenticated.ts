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
        const response = await apiFetch<{ data: { authenticated: boolean } }>(
          "/v1/auth/session",
        );
        if (!cancelled && response.data.authenticated) {
          router.replace(destination);
          return;
        }
        if (!cancelled) setChecking(false);
      } catch {
        if (!cancelled) setChecking(false);
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [destination, router]);

  return { checking };
};
