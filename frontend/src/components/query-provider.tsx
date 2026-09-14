"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { createQueryClient } from "@/lib/query-client";

type QueryProviderProps = {
  readonly children: ReactNode;
};

/**
 * App-wide TanStack Query provider (one client per browser tab).
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [client] = useState(() => createQueryClient());

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
