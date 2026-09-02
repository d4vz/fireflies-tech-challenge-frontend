import { expect, test } from "bun:test";
import { join } from "node:path";
import {
  assistantChrome,
  assistantOpenHref,
  assistantPanelSlot,
  homeHref,
  isPlainLeftClick,
  parseHomeView,
  parseHomeViewFromSearch,
  toHomeModel,
  type HomeView,
} from "@lib/home";
import type { Meeting, MeetingListPage } from "@lib/meetings";

const defaults: HomeView = { tab: "all", query: "", fred: "unset" };

test("parseHomeView uses defaults for empty params", () => {
  expect(parseHomeView({})).toEqual(defaults);
});

test("parseHomeView keeps the first string when Next passes an array", () => {
  expect(parseHomeView({ tab: ["ready", "failed"], q: ["alpha", "beta"], fred: ["1"] })).toEqual({
    tab: "ready",
    query: "alpha",
    fred: "open",
  });
});

test("parseHomeView falls back on unknown tab and fred", () => {
  expect(parseHomeView({ tab: "upcoming", fred: "yes", q: "eng" })).toEqual({
    tab: "all",
    query: "eng",
    fred: "unset",
  });
});

test("parseHomeView maps fred 1 and 0", () => {
  expect(parseHomeView({ fred: "1" }).fred).toBe("open");
  expect(parseHomeView({ fred: "0" }).fred).toBe("closed");
});

test("homeHref drops default fields so home stays /", () => {
  expect(homeHref(defaults)).toBe("/");
});

test("homeHref writes only non-default fields", () => {
  expect(homeHref({ tab: "ready", query: "eng", fred: "open" })).toBe("/?tab=ready&q=eng&fred=1");
  expect(homeHref({ tab: "all", query: "", fred: "closed" })).toBe("/?fred=0");
});

test("parseHomeViewFromSearch reads the tab from the query string", () => {
  expect(parseHomeViewFromSearch("?tab=ready&q=eng")).toEqual({
    tab: "ready",
    query: "eng",
    fred: "unset",
  });
  expect(parseHomeViewFromSearch("")).toEqual(defaults);
});

test("isPlainLeftClick is false for modified or non-primary clicks", () => {
  const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
  expect(isPlainLeftClick(plain)).toBe(true);
  expect(isPlainLeftClick({ ...plain, button: 1 })).toBe(false);
  expect(isPlainLeftClick({ ...plain, metaKey: true })).toBe(false);
  expect(isPlainLeftClick({ ...plain, ctrlKey: true })).toBe(false);
});

test("Home tab clicks filter the current page without a new RSC fetch", async () => {
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  expect(dashboard).toContain("isPlainLeftClick");
  expect(dashboard).toContain("pushHomeUrl");
  expect(dashboard).toContain("preventDefault");
});

test("AppFrame and AskFred sheet follow pushHomeUrl so tab stays in the header href", async () => {
  const frame = await Bun.file(join(import.meta.dir, "../components/app-frame.tsx")).text();
  const canvas = await Bun.file(join(import.meta.dir, "../components/workspace-canvas.tsx")).text();
  expect(frame).toContain("subscribeHomeUrl");
  expect(canvas).toContain("pushHomeUrl");
});

test("assistantOpenHref keeps Home tab and query", () => {
  expect(assistantOpenHref({ current: { tab: "busy", query: "eng", fred: "unset" } })).toBe(
    "/?tab=busy&q=eng&fred=1",
  );
});

test("assistantOpenHref is /?fred=1 off Home", () => {
  expect(assistantOpenHref({ current: null })).toBe("/?fred=1");
});

test("assistantChrome maps fred without reading the viewport", () => {
  expect(assistantChrome("unset")).toEqual({ sheetOpen: false, dockHidden: true });
  expect(assistantChrome("open")).toEqual({ sheetOpen: true, dockHidden: false });
  expect(assistantChrome("closed")).toEqual({ sheetOpen: false, dockHidden: true });
});

test("AskFred mounts in one slot so stick-to-bottom does not run on a hidden copy", () => {
  expect(assistantPanelSlot(true, true)).toBe("dock");
  expect(assistantPanelSlot(false, true)).toBe("sheet");
  expect(assistantPanelSlot(true, false)).toBe("none");
  expect(assistantPanelSlot(false, false)).toBe("none");
});

function meeting(input: {
  id: string;
  sourceId: string;
  createdAt: string;
  status: Meeting["status"];
  text?: string;
  actionItems?: string[];
}): Meeting {
  return {
    _id: input.id,
    sourceId: input.sourceId,
    createdAt: input.createdAt,
    status: input.status,
    summary:
      input.text === undefined && input.actionItems === undefined
        ? undefined
        : {
            text: input.text ?? "",
            takeaways: [],
            actionItems: input.actionItems ?? [],
          },
    blob: { url: "/v", thumbnailUrl: "/t", durationInSeconds: 1 },
  };
}

const now = new Date(2026, 8, 1, 12, 0, 0);

const ready = meeting({
  id: "1",
  sourceId: "Eng. Class - Davi",
  createdAt: "2026-09-01T04:10:00.000Z",
  status: "ready",
  text: "class recap",
  actionItems: ["review notes"],
});

const processing = meeting({
  id: "2",
  sourceId: "Meet",
  createdAt: "2026-08-31T10:00:00.000Z",
  status: "processing",
});

const queued = meeting({
  id: "3",
  sourceId: "Standup",
  createdAt: "2026-09-01T11:00:00.000Z",
  status: "queued",
});

const failed = meeting({
  id: "4",
  sourceId: "Broken",
  createdAt: "2026-09-01T09:00:00.000Z",
  status: "failed",
});

function pageOf(items: Meeting[], total = items.length): MeetingListPage {
  return { items, total, page: 1, limit: 20 };
}

test("toHomeModel uses page.total for meeting-count even on a sample", () => {
  const model = toHomeModel({
    page: pageOf([ready], 40),
    view: defaults,
    now,
    workspaceName: "Davi",
  });
  expect(model.coverage).toEqual({ kind: "sample", sampled: 1, total: 40 });
  expect(model.insights[0]).toEqual({ kind: "meeting-count", total: 40 });
});

test("toHomeModel tags busy and action-item cards with sample coverage", () => {
  const model = toHomeModel({
    page: pageOf([ready, processing], 10),
    view: defaults,
    now,
    workspaceName: "Davi",
  });
  expect(model.insights).toContainEqual({
    kind: "busy-count",
    count: 1,
    coverage: { kind: "sample", sampled: 2, total: 10 },
  });
  expect(model.insights).toContainEqual({
    kind: "action-item-count",
    count: 1,
    coverage: { kind: "sample", sampled: 2, total: 10 },
  });
});

test("toHomeModel never adds a longest-processing insight card", () => {
  const model = toHomeModel({
    page: pageOf([queued, processing]),
    view: defaults,
    now,
    workspaceName: "Davi",
  });
  expect(model.insights.map((card) => card.kind)).toEqual([
    "meeting-count",
    "busy-count",
    "action-item-count",
  ]);
});

test("toHomeModel filters rows by tab then query on sourceId and summary", () => {
  const page = pageOf([ready, processing, queued, failed]);
  const busy = toHomeModel({
    page,
    view: { tab: "busy", query: "", fred: "unset" },
    now,
    workspaceName: "Davi",
  });
  expect(busy.rows.map((row) => row._id)).toEqual(["2", "3"]);
  expect(busy.tabCounts).toEqual({ all: 4, ready: 1, busy: 2, failed: 1 });

  const search = toHomeModel({
    page,
    view: { tab: "all", query: "class", fred: "unset" },
    now,
    workspaceName: "Davi",
  });
  expect(search.rows.map((row) => row._id)).toEqual(["1"]);
});

test("toHomeModel greeting uses periodAt and the workspace name", () => {
  const model = toHomeModel({
    page: pageOf([]),
    view: defaults,
    now,
    workspaceName: "Davi",
  });
  expect(model.greeting).toEqual({ period: "afternoon", workspaceName: "Davi" });
});

test("Home RSC fetches meetings on the server and hydrates the client dashboard", async () => {
  const page = await Bun.file(join(import.meta.dir, "../app/page.tsx")).text();
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  expect(page).toContain('from "@lib/backend"');
  expect(page).toContain("listMeetings");
  expect(page).toContain("Promise.all");
  expect(page).toContain("initialPage");
  expect(dashboard).toContain("initialData:");
  expect(dashboard).toContain("props.initialPage");
});

test("AskFred sheet uses full-travel slide and the dock animates width", async () => {
  const canvas = await Bun.file(join(import.meta.dir, "../components/workspace-canvas.tsx")).text();
  const sheet = await Bun.file(join(import.meta.dir, "../components/ui/sheet.tsx")).text();
  expect(canvas).toContain('slideTravel="full"');
  expect(canvas).toContain("data-[side=right]:data-open:slide-in-from-right");
  expect(canvas).toContain("data-[side=right]:data-closed:slide-out-to-right");
  expect(canvas.includes("slide-in-from-right-10")).toBe(false);
  expect(canvas).toContain("transition-[width]");
  expect(canvas).toContain("w-[360px]");
  expect(canvas.includes("animate-in fade-in-0 slide-in-from-right")).toBe(false);
  expect(sheet).toContain("data-[side=right]:data-open:slide-in-from-right ");
  expect(sheet).toContain("data-[side=right]:data-open:slide-in-from-right-10");
});
