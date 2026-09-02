"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQueryClient } from "@app/get-query-client";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers(props: ProvidersProps) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
}
