import type { Meeting, MeetingListPage } from "@lib/meetings";

export const MEETING_SEARCH_LIMIT = 4;

export type MeetingSearchPanel =
  | { kind: "closed" }
  | { kind: "loading"; q: string }
  | { kind: "empty"; q: string }
  | { kind: "failed"; q: string }
  | { kind: "results"; q: string; items: Meeting[] };

export function meetingSearchPanel(
  q: string,
  open: boolean,
  page: MeetingListPage | undefined,
  error: Error | null,
): MeetingSearchPanel {
  if (!open || q === "") {
    return { kind: "closed" };
  }
  if (error !== null) {
    return { kind: "failed", q };
  }
  if (page === undefined) {
    return { kind: "loading", q };
  }
  if (page.items.length === 0) {
    return { kind: "empty", q };
  }
  return { kind: "results", q, items: page.items };
}
