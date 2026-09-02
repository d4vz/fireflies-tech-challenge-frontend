import type { ChatStatus } from "ai";

export const ASK_FRED_PLACEHOLDER = "Ask anything here";

export function isAskFredBusy(status: ChatStatus): boolean {
  return status === "submitted" || status === "streaming";
}

export type FredPendingMessage = {
  role: string;
  parts: readonly { type: string; text?: string }[];
};

export function shouldShowFredPending(
  status: ChatStatus,
  last: FredPendingMessage | undefined,
): boolean {
  if (!isAskFredBusy(status)) {
    return false;
  }
  if (last === undefined || last.role !== "assistant") {
    return true;
  }
  return !last.parts.some((part) => part.type === "text" && (part.text ?? "").trim() !== "");
}

export function shouldShowFredSuggestions(messages: readonly { role: string }[]): boolean {
  return !messages.some((message) => message.role === "assistant");
}

export type FredStickSnapshot = {
  force: boolean;
  isAtBottom: boolean;
  key: string;
};

export function shouldScrollFredStick(
  previous: FredStickSnapshot | undefined,
  next: FredStickSnapshot,
): boolean {
  if (next.force && (previous === undefined || !previous.force)) {
    return true;
  }
  if (previous !== undefined && previous.key === next.key) {
    return false;
  }
  if (previous?.force === true) {
    return false;
  }
  return next.isAtBottom;
}
