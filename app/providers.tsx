"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQueryClient } from "@app/get-query-client";
import { Toaster } from "@/components/ui/sonner";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers(props: ProvidersProps) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
