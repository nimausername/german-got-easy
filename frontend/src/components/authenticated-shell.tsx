"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { AppShell } from "@/components/app-shell";
import { useMe } from "@/hooks/use-me";
import type { UserNavUser } from "@/components/user-nav";

type AuthenticatedShellProps = {
  readonly children: ReactNode;
  readonly width?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  readonly className?: string;
  readonly centered?: boolean;
  /** When provided, skips an extra /v1/me fetch (e.g. dashboard already loaded). */
  readonly user?: UserNavUser | null;
  readonly loading?: boolean;
};

/**
 * Shared chrome for signed-in pages: sticky header + responsive page shell
 * with clearance for the mobile bottom nav.
 */
export const AuthenticatedShell = ({
  children,
  width = "lg",
  className,
  centered = false,
  user,
  loading,
}: AuthenticatedShellProps) => {
  const shouldFetch = user === undefined && loading === undefined;
  const meState = useMe({ enabled: shouldFetch });

  const resolvedLoading = loading ?? (shouldFetch ? meState.loading : false);
  const resolvedUser =
    user !== undefined ? user : (meState.me?.user ?? null);

  return (
    <>
      <AppHeader user={resolvedUser} loading={resolvedLoading} />
      <AppShell
        width={width}
        centered={centered}
        showThemeToggle={false}
        className={className}
      >
        {children}
      </AppShell>
    </>
  );
};
