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

export function assistantChrome(fred: FredParam): AssistantChrome {
  return {
    sheetOpen: fred === "open",
    dockHidden: fred !== "open",
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

export type ActionItemCountInsight = {
  kind: "action-item-count";
  count: number;
  coverage: InsightCoverage;
};

export type InsightCard = MeetingCountInsight | BusyCountInsight | ActionItemCountInsight;

export type TabCounts = {
  all: number;
  ready: number;
  busy: number;
  failed: number;
};

export type HomeModel = {
  greeting: Greeting;
  coverage: InsightCoverage;
  insights: InsightCard[];
  tab: HomeTab;
  query: string;
  tabCounts: TabCounts;
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

function actionItemTotal(items: Meeting[]): number {
  let count = 0;
  for (const meeting of items) {
    count += meeting.summary?.actionItems.length ?? 0;
  }
  return count;
}

function matchesTab(meeting: Meeting, tab: HomeTab): boolean {
  if (tab === "all") {
    return true;
  }
  if (tab === "busy") {
    return isBusy(meeting.status);
  }
  return meeting.status === tab;
}

function matchesQuery(meeting: Meeting, query: string): boolean {
  if (query === "") {
    return true;
  }
  const haystack = `${meeting.sourceId} ${meeting.summary?.text ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function tabCountsOf(items: Meeting[]): TabCounts {
  const counts: TabCounts = { all: items.length, ready: 0, busy: 0, failed: 0 };
  for (const meeting of items) {
    if (meeting.status === "ready") {
      counts.ready += 1;
    }
    if (meeting.status === "failed") {
      counts.failed += 1;
    }
    if (isBusy(meeting.status)) {
      counts.busy += 1;
    }
  }
  return counts;
}

function insightsOf(page: MeetingListPage, coverage: InsightCoverage): InsightCard[] {
  const busyItems = page.items.filter((item) => isBusy(item.status));
  return [
    { kind: "meeting-count", total: page.total },
    { kind: "busy-count", count: busyItems.length, coverage },
    { kind: "action-item-count", count: actionItemTotal(page.items), coverage },
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
    tabCounts: tabCountsOf(input.page.items),
    rows: input.page.items.filter(
      (item) => matchesTab(item, input.view.tab) && matchesQuery(item, input.view.query),
    ),
  };
}
