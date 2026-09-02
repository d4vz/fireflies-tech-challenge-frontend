import type { ChatStatus } from "ai";

export const ASK_FRED_PLACEHOLDER = "Ask anything here";

export function isAskFredBusy(status: ChatStatus): boolean {
  return status === "submitted" || status === "streaming";
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
