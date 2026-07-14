"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { UIProvider } from "@/components/ui-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 15_000 } },
      })
  );
  return (
    <QueryClientProvider client={client}>
      <UIProvider>{children}</UIProvider>
    </QueryClientProvider>
  );
}
