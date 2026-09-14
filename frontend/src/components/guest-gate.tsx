"use client";

import type { ReactNode } from "react";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";
import { Spinner } from "@/components/ui/spinner";

type GuestGateProps = {
  readonly children: ReactNode;
  readonly destination?: string;
};

/**
 * Renders guest-only UI after confirming there is no active session.
 * Authenticated users are redirected to the app home (dashboard by default).
 */
export const GuestGate = ({
  children,
  destination = "/dashboard",
}: GuestGateProps) => {
  const { checking } = useRedirectIfAuthenticated(destination);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return children;
};
