import { periodAt, type DayPeriod } from "@lib/chrome";
import { isBusy, meetingsHref, type Meeting, type MeetingListPage } from "@lib/meetings";

export type InsightCoverage =
  | { kind: "complete" }
  | { kind: "sample"; sampled: number; total: number };

export type Greeting = {
  period: DayPeriod;
  workspaceName: string;
};

export type InsightCard = {
  kind: "meeting-count" | "busy-count" | "task-count";
  title: string;
  body: string;
  metric: string;
  note?: string;
};

export const HOME_PREVIEW_COUNT = 2;

export type HomeModel = {
  greeting: Greeting;
  coverage: InsightCoverage;
  insights: InsightCard[];
  rows: Meeting[];
};

export type ToHomeModelInput = {
  page: MeetingListPage;
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

function newestFirst(left: Meeting, right: Meeting): number {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt);
}

function previewRows(items: Meeting[]): Meeting[] {
  return items.toSorted(newestFirst).slice(0, HOME_PREVIEW_COUNT);
}

function coverageNote(coverage: InsightCoverage): string | undefined {
  if (coverage.kind === "complete") {
    return undefined;
  }
  return `From ${coverage.sampled} of ${coverage.total}`;
}

function insightsOf(page: MeetingListPage, coverage: InsightCoverage): InsightCard[] {
  const busyItems = page.items.filter((item) => isBusy(item.status));
  const counts = taskCounts(page.items);
  const note = coverageNote(coverage);
  const busy: InsightCard = {
    kind: "busy-count",
    title: "In progress",
    body: `${busyItems.length} processing`,
    metric: String(busyItems.length),
  };
  const tasks: InsightCard = {
    kind: "task-count",
    title: "Tasks",
    body: `${counts.pending} pending · ${counts.completed} completed`,
    metric: String(counts.pending),
  };
  return [
    {
      kind: "meeting-count",
      title: "Meetings",
      body: `${page.total} in the library`,
      metric: String(page.total),
    },
    note === undefined ? busy : { ...busy, note },
    note === undefined ? tasks : { ...tasks, note },
  ];
}

export function insightHref(kind: InsightCard["kind"]): string {
  switch (kind) {
    case "meeting-count":
      return meetingsHref("all");
    case "busy-count":
      return meetingsHref("processing");
    case "task-count":
      return "/tasks";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
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
    rows: previewRows(input.page.items),
  };
}
