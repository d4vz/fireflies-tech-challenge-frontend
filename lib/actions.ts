import type { Meeting, MeetingTask, TaskStatus } from "@lib/meetings";
import { parsePage } from "@lib/meetings";

export type ActionGroup = {
  meetingId: string;
  sourceId: string;
  createdAt: string;
  href: string;
  mediaKind: Meeting["blob"]["kind"];
  tasks: MeetingTask[];
};

export type ActionListPage = {
  items: ActionGroup[];
  total: number;
  page: number;
  limit: number;
};

export type ActionStatusFilter = "all" | TaskStatus;

export const actionsKey = ["actions"] as const;
export const ACTIONS_PAGE_SIZE = 10;
export const HOME_RECENT_TASK_GROUPS = 2;

export function actionsListKey(page: number, limit: number, status: ActionStatusFilter) {
  return ["actions", "list", page, limit, status] as const;
}

export function parseActionStatus(value: string | null | undefined): ActionStatusFilter {
  if (value === "pending" || value === "completed") {
    return value;
  }
  return "all";
}

export function tasksHref(status: ActionStatusFilter, page = 1): string {
  const params = new URLSearchParams();
  if (status !== "all") {
    params.set("status", status);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  if (query === "") {
    return "/tasks";
  }
  return `/tasks?${query}`;
}

export function parseActionsView(status: string | undefined, page: string | undefined) {
  return {
    status: parseActionStatus(status),
    page: parsePage(page),
  };
}

type StoredActionGroup = Omit<ActionGroup, "mediaKind"> & {
  mediaKind?: Meeting["blob"]["kind"];
};

export function parseActionGroup(raw: StoredActionGroup): ActionGroup {
  return {
    ...raw,
    mediaKind: raw.mediaKind === "audio" ? "audio" : "video",
  };
}

export function taskCountLabel(count: number): string {
  if (count === 1) {
    return "1 Task";
  }
  return `${count} Tasks`;
}
