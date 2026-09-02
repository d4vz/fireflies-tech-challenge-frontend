import type { ChatStatus } from "ai";

export const ASK_FRED_PLACEHOLDER = "Ask anything here";

const MEETING_PATH = /^\/meetings\/[a-f0-9]{24}$/i;

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
  return next.isAtBottom;
}

export function askFredMeetingPath(url: string, origin: string): string | undefined {
  try {
    const parsed = new URL(url, origin);
    if (!MEETING_PATH.test(parsed.pathname)) {
      return undefined;
    }
    return parsed.pathname;
  } catch {
    return undefined;
  }
}
