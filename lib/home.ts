import { periodAt, type DayPeriod } from "@lib/chrome";
import { isBusy, type Meeting, type MeetingListPage } from "@lib/meetings";

export type HomeTab = "all" | "ready" | "busy" | "failed";

export type FredParam = "unset" | "open" | "closed";

export type HomeView = {
  tab: HomeTab;
  query: string;
  fred: FredParam;
};

export type RawSearchParam = string | string[] | undefined;

export type HomeSearchParams = {
  tab?: RawSearchParam;
  q?: RawSearchParam;
  fred?: RawSearchParam;
};

export type AssistantHrefInput = {
  current: HomeView | null;
};

export type AssistantChrome = {
  sheetOpen: boolean;
  dockHidden: boolean;
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

function parseFred(value: string): FredParam {
  if (value === "1") {
    return "open";
  }
  if (value === "0") {
    return "closed";
  }
  return "unset";
}

export function parseHomeView(params: HomeSearchParams): HomeView {
  return {
    tab: parseTab(firstString(params.tab)),
    query: firstString(params.q),
    fred: parseFred(firstString(params.fred)),
  };
}

export function parseHomeViewFromSearch(search: string): HomeView {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return parseHomeView({
    tab: params.get("tab") ?? undefined,
    q: params.get("q") ?? undefined,
    fred: params.get("fred") ?? undefined,
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

const HOME_URL_EVENT = "fireflies-home-url";

export function subscribeHomeUrl(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(HOME_URL_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(HOME_URL_EVENT, onChange);
  };
}

export function pushHomeUrl(view: HomeView): void {
  const href = homeHref(view);
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === href) {
    return;
  }
  window.history.pushState(null, "", href);
  window.dispatchEvent(new Event(HOME_URL_EVENT));
}

export function homeHref(view: HomeView): string {
  const params = new URLSearchParams();
  if (view.tab !== "all") {
    params.set("tab", view.tab);
  }
  if (view.query !== "") {
    params.set("q", view.query);
  }
  if (view.fred === "open") {
    params.set("fred", "1");
  }
  if (view.fred === "closed") {
    params.set("fred", "0");
  }
  const query = params.toString();
  if (query === "") {
    return "/";
  }
  return `/?${query}`;
}

export function assistantOpenHref(input: AssistantHrefInput): string {
  if (input.current === null) {
    return "/?fred=1";
  }
  return homeHref({ ...input.current, fred: "open" });
}

export type AssistantOpenClickKind = "ignore" | "navigate" | "push";

export function assistantOpenClickKind(
  current: HomeView | null,
  isPlain: boolean,
): AssistantOpenClickKind {
  if (!isPlain) {
    return "ignore";
  }
  if (current === null) {
    return "navigate";
  }
  return "push";
}

export function assistantIsOpen(fred: FredParam, isXl: boolean): boolean {
  switch (fred) {
    case "open":
      return true;
    case "closed":
      return false;
    case "unset":
      return isXl;
    default: {
      const _exhaustive: never = fred;
      return _exhaustive;
    }
  }
}

export function assistantChrome(fred: FredParam): AssistantChrome {
  return {
    sheetOpen: assistantIsOpen(fred, false),
    dockHidden: !assistantIsOpen(fred, true),
  };
}

export type AssistantPanelSlot = "dock" | "sheet" | "none";

export function assistantPanelSlot(isXl: boolean, isOpen: boolean): AssistantPanelSlot {
  if (!isOpen) {
    return "none";
  }
  return isXl ? "dock" : "sheet";
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
