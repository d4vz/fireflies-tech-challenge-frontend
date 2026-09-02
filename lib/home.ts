import { applyAssistantPresence, parseAssistantOpen, pushAppUrl } from "@lib/assistant-url";
import { periodAt, type DayPeriod } from "@lib/chrome";
import { isBusy, type Meeting, type MeetingListPage } from "@lib/meetings";

export type HomeTab = "all" | "ready" | "busy" | "failed";

export type HomeView = {
  tab: HomeTab;
  query: string;
};

export type RawSearchParam = string | string[] | undefined;

export type HomeSearchParams = {
  tab?: RawSearchParam;
  q?: RawSearchParam;
  fred?: RawSearchParam;
};

function firstString(value: RawSearchParam): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function parseTab(value: string): HomeTab {
  if (value === "ready" || value === "busy" || value === "failed") {
    return value;
  }
  return "all";
}

export function parseHomeView(params: HomeSearchParams): HomeView {
  return {
    tab: parseTab(firstString(params.tab)),
    query: firstString(params.q),
  };
}

export function parseHomeViewFromSearch(search: string): HomeView {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return parseHomeView({
    tab: params.get("tab") ?? undefined,
    q: params.get("q") ?? undefined,
  });
}

export type ClickModifiers = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

export function isPlainLeftClick(event: ClickModifiers): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function pushHomeUrl(view: HomeView): void {
  pushAppUrl(applyAssistantPresence(homeHref(view), parseAssistantOpen(window.location.search)));
}

export function homeHref(view: HomeView): string {
  const params = new URLSearchParams();
  if (view.tab !== "all") {
    params.set("tab", view.tab);
  }
  if (view.query !== "") {
    params.set("q", view.query);
  }
  const query = params.toString();
  if (query === "") {
    return "/";
  }
  return `/?${query}`;
}

export type InsightCoverage =
  | { kind: "complete" }
  | { kind: "sample"; sampled: number; total: number };

export type Greeting = {
  period: DayPeriod;
  workspaceName: string;
};

export type MeetingCountInsight = {
  kind: "meeting-count";
  total: number;
};

export type BusyCountInsight = {
  kind: "busy-count";
  count: number;
  coverage: InsightCoverage;
};

export type TaskCountInsight = {
  kind: "task-count";
  pending: number;
  completed: number;
  coverage: InsightCoverage;
};

export type InsightCard = MeetingCountInsight | BusyCountInsight | TaskCountInsight;

export const HOME_PREVIEW_COUNT = 3;

export type HomeModel = {
  greeting: Greeting;
  coverage: InsightCoverage;
  insights: InsightCard[];
  tab: HomeTab;
  query: string;
  rows: Meeting[];
};

export type ToHomeModelInput = {
  page: MeetingListPage;
  view: HomeView;
  now: Date;
  workspaceName: string;
};

function coverageOf(page: MeetingListPage): InsightCoverage {
  if (page.items.length >= page.total) {
    return { kind: "complete" };
  }
  return { kind: "sample", sampled: page.items.length, total: page.total };
}

type TaskCounts = {
  pending: number;
  completed: number;
};

function taskCounts(items: Meeting[]): TaskCounts {
  let pending = 0;
  let completed = 0;
  for (const meeting of items) {
    for (const task of meeting.tasks ?? []) {
      if (task.status === "completed") {
        completed += 1;
      } else {
        pending += 1;
      }
    }
  }
  return { pending, completed };
}

function matchesQuery(meeting: Meeting, query: string): boolean {
  if (query === "") {
    return true;
  }
  const haystack =
    `${meeting.name} ${meeting.sourceId} ${meeting.summary?.text ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function newestFirst(left: Meeting, right: Meeting): number {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt);
}

function previewRows(items: Meeting[], query: string): Meeting[] {
  return items
    .filter((item) => matchesQuery(item, query))
    .toSorted(newestFirst)
    .slice(0, HOME_PREVIEW_COUNT);
}

function insightsOf(page: MeetingListPage, coverage: InsightCoverage): InsightCard[] {
  const busyItems = page.items.filter((item) => isBusy(item.status));
  const counts = taskCounts(page.items);
  return [
    { kind: "meeting-count", total: page.total },
    { kind: "busy-count", count: busyItems.length, coverage },
    {
      kind: "task-count",
      pending: counts.pending,
      completed: counts.completed,
      coverage,
    },
  ];
}

export function toHomeModel(input: ToHomeModelInput): HomeModel {
  const coverage = coverageOf(input.page);
  return {
    greeting: {
      period: periodAt(input.now),
      workspaceName: input.workspaceName,
    },
    coverage,
    insights: insightsOf(input.page, coverage),
    tab: input.view.tab,
    query: input.view.query,
    rows: previewRows(input.page.items, input.view.query),
  };
}
