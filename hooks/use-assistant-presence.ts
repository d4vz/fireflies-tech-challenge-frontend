"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { parseAssistantLocation } from "@lib/assistant-url";
import {
  assistantPresenceOf,
  onAssistantPresenceClick,
  pushAppUrl,
  subscribeAppUrl,
  type ClickModifiers,
} from "@lib/assistant-presence";

function searchSnapshot(): string {
  return window.location.search;
}

export type AssistantPresenceClick = ClickModifiers & { preventDefault(): void };

export function useAssistantPresence() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const liveSearch = useSyncExternalStore(
    subscribeAppUrl,
    searchSnapshot,
    () => `?${searchParams.toString()}`,
  );
  const location = parseAssistantLocation(pathname, liveSearch);
  const view = assistantPresenceOf(pathname, liveSearch);
  return {
    open: view.open,
    openHref: view.openHref,
    closeHref: view.closeHref,
    close() {
      pushAppUrl(view.closeHref);
    },
    onOpenClick(event: AssistantPresenceClick) {
      onAssistantPresenceClick(event, location, "open");
    },
    onCloseClick(event: AssistantPresenceClick) {
      onAssistantPresenceClick(event, location, "closed");
    },
  };
}
