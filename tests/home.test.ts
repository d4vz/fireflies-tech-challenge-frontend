import { expect, test } from "bun:test";
import { join } from "node:path";
import {
  HOME_PREVIEW_COUNT,
  homeHref,
  isPlainLeftClick,
  parseHomeView,
  parseHomeViewFromSearch,
  toHomeModel,
  type HomeView,
} from "@lib/home";
import { meetingName, type Meeting, type MeetingListPage } from "@lib/meetings";

const defaults: HomeView = { tab: "all", query: "" };

test("parseHomeView uses defaults for empty params", () => {
  expect(parseHomeView({})).toEqual(defaults);
});

test("parseHomeView keeps the first string when Next passes an array", () => {
  expect(parseHomeView({ tab: ["ready", "failed"], q: ["alpha", "beta"], fred: ["1"] })).toEqual({
    tab: "ready",
    query: "alpha",
  });
});

test("parseHomeView falls back on unknown tab and ignores fred", () => {
  expect(parseHomeView({ tab: "upcoming", fred: "yes", q: "eng" })).toEqual({
    tab: "all",
    query: "eng",
  });
});

test("parseHomeView ignores fred if present", () => {
  expect(parseHomeView({ fred: "1" })).toEqual(defaults);
  expect(parseHomeView({ fred: "0" })).toEqual(defaults);
  expect(parseHomeView({ fred: "open" })).toEqual(defaults);
});

test("homeHref drops default fields so home stays /", () => {
  expect(homeHref(defaults)).toBe("/");
});

test("homeHref writes only non-default fields and never writes fred", () => {
  expect(homeHref({ tab: "ready", query: "eng" })).toBe("/?tab=ready&q=eng");
  expect(homeHref({ tab: "all", query: "" })).toBe("/");
  expect(homeHref({ tab: "ready", query: "eng" }).includes("fred")).toBe(false);
});

test("HomeView has no assistantOpen", () => {
  const view: HomeView = { tab: "all", query: "" };
  expect("assistantOpen" in view).toBe(false);
});

test("parseHomeViewFromSearch reads the tab from the query string", () => {
  expect(parseHomeViewFromSearch("?tab=ready&q=eng")).toEqual({
    tab: "ready",
    query: "eng",
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

test("Home Tasks card links to /tasks and shows pending and completed counts", async () => {
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  expect(dashboard).toContain('href="/tasks"');
  expect(dashboard).toContain("pending · ${card.completed} completed");
  expect(dashboard).toContain("task-count");
});

test("Home recent tasks shows two pending meeting groups with the tasks list card", async () => {
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  const page = await Bun.file(join(import.meta.dir, "../app/(app)/page.tsx")).text();
  const recent = dashboard.slice(
    dashboard.indexOf("function RecentTasks("),
    dashboard.indexOf("export function HomeCanvas"),
  );
  expect(dashboard).toContain("Recent tasks");
  expect(dashboard).toContain("TaskGroupCard");
  expect(dashboard).toContain("HOME_RECENT_TASK_GROUPS");
  expect(dashboard).toContain('listActions(1, HOME_RECENT_TASK_GROUPS, "pending")');
  expect(dashboard).toContain('tasksHref("pending")');
  expect(dashboard).toContain("View more tasks");
  expect(dashboard).toContain("initialActions");
  expect(recent).toContain("@container");
  expect(recent).toContain("grid-cols-1");
  expect(recent).toContain("@4xl:grid-cols-2");
  expect(recent.includes("md:grid-cols-2")).toBe(false);
  expect(recent).toContain("query.data.total === 0");
  expect(recent).toContain("return null");
  expect(dashboard.includes("No pending tasks")).toBe(false);
  expect(page).toContain("listActions");
  expect(page).toContain("HOME_RECENT_TASK_GROUPS");
  expect(page).toContain("initialActions");
});

test("Home insight cards show icon and metric on mobile, title and body from md", async () => {
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  const skeleton = await Bun.file(join(import.meta.dir, "../components/skeleton.tsx")).text();
  const card = dashboard.slice(
    dashboard.indexOf("function staggerClass"),
    dashboard.indexOf("function ViewMoreLink"),
  );
  const bone = skeleton.slice(
    skeleton.indexOf("function InsightCardBone"),
    skeleton.indexOf("function MeetingCardBone"),
  );
  expect(card).toContain("text-2xl font-semibold tabular-nums");
  expect(card).toContain("flex-col gap-2");
  expect(card).toContain("shadow-none");
  expect(card).toContain("ring-line");
  expect(card).toContain("hover:bg-wash");
  expect(card).toContain("rise-in");
  expect(card).toContain("sr-only md:hidden");
  expect(card).toContain("${copy.title}: ${copy.body}");
  expect(card).toContain("hidden min-w-0 md:block");
  expect(card.includes("surface-card-hover")).toBe(false);
  expect(card.includes("flex-row items-center justify-center")).toBe(false);
  expect(bone.includes("surface-card")).toBe(false);
  expect(bone).toContain("ring-line");
  expect(bone).toContain("hidden h-4 w-16 rounded-md md:block");
  expect(bone).toContain("hidden h-3 w-full rounded-md md:block");
  const css = await Bun.file(join(import.meta.dir, "../app/globals.css")).text();
  const hover = css.slice(
    css.indexOf("@utility surface-card-hover"),
    css.indexOf("@keyframes rise-in"),
  );
  expect(hover.includes("box-shadow")).toBe(false);
  expect(hover.includes("transform")).toBe(false);
  expect(hover).toContain("background-color");
});

test("Home content is centered with a max width", async () => {
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  const skeleton = await Bun.file(join(import.meta.dir, "../components/skeleton.tsx")).text();
  expect(dashboard).toContain("mx-auto");
  expect(dashboard).toContain("max-w-5xl");
  expect(dashboard).toContain("w-full");
  expect(skeleton).toContain("mx-auto");
  expect(skeleton).toContain("max-w-5xl");
});

test("Home lists the last meetings in a two-column grid with view more beside the title", async () => {
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  const frame = await Bun.file(join(import.meta.dir, "../components/app-frame.tsx")).text();
  const row = await Bun.file(join(import.meta.dir, "../components/meeting-row.tsx")).text();
  expect(dashboard).toContain("Last meetings");
  expect(dashboard).toContain('href="/meetings"');
  expect(dashboard).toContain("view more");
  expect(dashboard).toContain("md:grid-cols-2");
  expect(dashboard.includes("HomeTabs")).toBe(false);
  expect(dashboard.includes('label: "All"')).toBe(false);
  expect(dashboard.includes("MeetingSearch")).toBe(false);
  expect(frame.includes("MeetingSearch")).toBe(false);
  expect(frame.includes("Search meetings")).toBe(false);
  const cardClass = row.slice(row.indexOf('case "card":'), row.indexOf('case "row":'));
  expect(cardClass.includes("px-2.5")).toBe(false);
  expect(cardClass.includes("hover:bg-paper")).toBe(false);
  expect(row).toContain("{meeting.name}");
  expect(row.includes("{meeting.sourceId}")).toBe(false);
});

test("meeting title clamps to one line", async () => {
  const row = await Bun.file(join(import.meta.dir, "../components/meeting-row.tsx")).text();
  const heading = row.slice(row.indexOf("<h2"), row.indexOf("</h2>"));
  expect(row.includes("flex-wrap")).toBe(false);
  expect(heading).toContain("min-w-0 flex-1");
  expect(heading).toContain("line-clamp-1");
});

test("Home skeleton uses stacked meeting cards, not list rows", async () => {
  const skeleton = await Bun.file(join(import.meta.dir, "../components/skeleton.tsx")).text();
  const home = skeleton.slice(
    skeleton.indexOf("export function HomeDashboardSkeleton"),
    skeleton.indexOf("export function MeetingDetailSkeleton"),
  );
  const list = skeleton.slice(
    skeleton.indexOf("export function MeetingsListSkeleton"),
    skeleton.indexOf("export function HomeDashboardSkeleton"),
  );
  expect(home).toContain("MeetingCardBone");
  expect(home.includes("MeetingRowBone")).toBe(false);
  expect(home).toContain("md:grid-cols-2");
  expect(home.includes("TaskGroupBone")).toBe(false);
  expect(home.includes("Recent tasks")).toBe(false);
  expect(list).toContain("MeetingCardBone");
  const cardBone = skeleton.slice(
    skeleton.indexOf("function MeetingCardBone"),
    skeleton.indexOf("export function TranscriptSkeleton"),
  );
  expect(cardBone).toContain("aspect-video");
  expect(cardBone.includes("lg:grid-cols-[240px")).toBe(false);
  expect(cardBone).toContain("max-md:hidden");
});

test("Home skeleton keeps Last meetings and omits Recent tasks", async () => {
  const skeleton = await Bun.file(join(import.meta.dir, "../components/skeleton.tsx")).text();
  const home = skeleton.slice(
    skeleton.indexOf("export function HomeDashboardSkeleton"),
    skeleton.indexOf("export function MeetingDetailSkeleton"),
  );
  expect(home).toContain("Last meetings");
  expect(home.includes("Recent tasks")).toBe(false);
  expect(home).toContain("view more");
  expect(home).toContain('href="/meetings"');
  expect(home.includes("tasksHref")).toBe(false);
});

test("last meeting cards show summary on mobile, hide status, and use a compact thumb", async () => {
  const row = await Bun.file(join(import.meta.dir, "../components/meeting-row.tsx")).text();
  expect(row).toContain('layout === "card"');
  expect(row).toContain("max-md:hidden");
  expect(row).toContain("max-md:size-16");
  expect(row).toContain("md:aspect-video");
  expect(row).toContain("md:w-full");
  expect(row).toContain("md:items-start");
  expect(row).toContain("md:min-h-[3.75rem]");
  expect(row).toContain("line-clamp-2");
  expect(row).toContain("md:line-clamp-3");
  expect(row.includes("md:size-auto")).toBe(false);
  expect(row.includes("md:items-stretch")).toBe(false);
  const summary = row.slice(row.indexOf("<p className="), row.indexOf("<When"));
  expect(summary.includes("max-md:hidden")).toBe(false);
  expect(summary.includes("? (")).toBe(false);
});

test("audio meeting preview uses a larger mic on mobile", async () => {
  const row = await Bun.file(join(import.meta.dir, "../components/meeting-row.tsx")).text();
  const preview = row.slice(
    row.indexOf("function MeetingPreview"),
    row.indexOf("export function MeetingRow"),
  );
  expect(preview).toContain("size={32}");
  expect(preview).toContain("size-8");
  expect(preview).toContain("md:size-12");
  expect(preview.includes("size={20}")).toBe(false);
});

test("Home empty library prompts capture and upload instead of a blank last-meetings line", async () => {
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  const empty = await Bun.file(join(import.meta.dir, "../components/meetings-empty.tsx")).text();
  const list = await Bun.file(
    join(import.meta.dir, "../app/(app)/meetings/meetings-list.tsx"),
  ).text();
  expect(dashboard).toContain("MeetingsEmpty");
  expect(dashboard).toContain("Recent tasks");
  expect(dashboard.includes("No meetings in this view.")).toBe(false);
  expect(empty).toContain("Capture your first meeting");
  expect(empty).toContain("No meetings yet. Capture or upload a file to start.");
  expect(empty).toContain("Capture a meeting");
  expect(empty).toContain("Upload a recording");
  expect(empty).toContain("requestCaptureIntent");
  expect(list).toContain("MeetingsEmpty");
});

test("AppFrame and AskFred overlay follow pushAppUrl so tab stays in the header href", async () => {
  const frame = await Bun.file(join(import.meta.dir, "../components/app-frame.tsx")).text();
  const host = await Bun.file(join(import.meta.dir, "../components/assistant-host.tsx")).text();
  expect(frame).toContain("subscribeAppUrl");
  expect(host).toContain("pushAppUrl");
});

test("AssistantHost mounts from AppFrame, not the app layout", async () => {
  const frame = await Bun.file(join(import.meta.dir, "../components/app-frame.tsx")).text();
  const layout = await Bun.file(join(import.meta.dir, "../app/(app)/layout.tsx")).text();
  expect(frame).toContain("AssistantHost");
  expect(layout.includes("AssistantHost")).toBe(false);
});

test("AppFrame and sidebar AskFred intercept clicks with isPlainLeftClick", async () => {
  const frame = await Bun.file(join(import.meta.dir, "../components/app-frame.tsx")).text();
  const nav = await Bun.file(join(import.meta.dir, "../components/nav.tsx")).text();
  expect(frame).toContain("isPlainLeftClick");
  expect(frame).toContain("pushAppUrl");
  expect(frame).toContain("preventDefault");
  expect(frame.includes("assistantOpenClickKind")).toBe(false);
  expect(nav).toContain("isPlainLeftClick");
  expect(nav).toContain("pushAppUrl");
  expect(nav.includes("assistantOpenClickKind")).toBe(false);
});

test("AskFred close lives on the host and omits fred", async () => {
  const host = await Bun.file(join(import.meta.dir, "../components/assistant-host.tsx")).text();
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  expect(host).toContain("assistantCloseHref");
  expect(host).toContain("pushAppUrl");
  expect(host).toContain("useChat");
  expect(host.includes('fred: "closed"')).toBe(false);
  expect(dashboard.includes("AssistantOverlay")).toBe(false);
  expect(dashboard.includes("AskFredPanel")).toBe(false);
  expect(dashboard.includes("useChat")).toBe(false);
});

test("AskFred sheet uses full-travel slide and Home has no dock", async () => {
  const overlay = await Bun.file(
    join(import.meta.dir, "../components/assistant-overlay.tsx"),
  ).text();
  const host = await Bun.file(join(import.meta.dir, "../components/assistant-host.tsx")).text();
  const canvas = await Bun.file(join(import.meta.dir, "../components/workspace-canvas.tsx")).text();
  const sheet = await Bun.file(join(import.meta.dir, "../components/ui/sheet.tsx")).text();
  expect(overlay).toContain('slideTravel="full"');
  expect(overlay).toContain("data-[side=right]:data-open:slide-in-from-right");
  expect(overlay).toContain("data-[side=right]:data-closed:slide-out-to-right");
  expect(overlay.includes("slide-in-from-right-10")).toBe(false);
  expect(overlay.includes("transition-[width]")).toBe(false);
  expect(overlay.includes("xl:block")).toBe(false);
  expect(overlay.includes("dockHidden")).toBe(false);
  expect(overlay.includes("xl:hidden")).toBe(false);
  expect(overlay.includes("overlayClassName")).toBe(false);
  expect(host).toContain("AssistantOverlay");
  expect(host).toContain("open ?");
  expect(host.includes("transition-[width]")).toBe(false);
  expect(host.includes("xl:block")).toBe(false);
  expect(host.includes("dockHidden")).toBe(false);
  expect(canvas.includes("transition-[width]")).toBe(false);
  expect(canvas.includes("xl:block")).toBe(false);
  expect(canvas.includes("dockHidden")).toBe(false);
  expect(overlay.includes("animate-in fade-in-0 slide-in-from-right")).toBe(false);
  expect(sheet).toContain("data-[side=right]:data-open:slide-in-from-right ");
  expect(sheet).toContain("data-[side=right]:data-open:slide-in-from-right-10");
});

function meeting(input: {
  id: string;
  sourceId: string;
  createdAt: string;
  status: Meeting["status"];
  text?: string;
  tasks?: Meeting["tasks"];
}): Meeting {
  return {
    _id: input.id,
    sourceId: input.sourceId,
    name: meetingName(input.sourceId),
    createdAt: input.createdAt,
    status: input.status,
    summary: input.text === undefined ? undefined : { text: input.text, takeaways: [] },
    tasks: input.tasks,
    blob: { kind: "video", url: "/v", thumbnailUrl: "/t", durationInSeconds: 1 },
  };
}

const now = new Date(2026, 8, 1, 12, 0, 0);

const ready = meeting({
  id: "1",
  sourceId: "Eng. Class - Davi",
  createdAt: "2026-09-01T04:10:00.000Z",
  status: "ready",
  text: "class recap",
  tasks: [
    {
      _id: "t1",
      text: "review notes",
      status: "pending",
      updatedAt: "2026-09-01T04:10:00.000Z",
    },
    {
      _id: "t2",
      text: "send recap",
      status: "completed",
      updatedAt: "2026-09-01T04:12:00.000Z",
    },
  ],
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

test("toHomeModel tags busy and task cards with sample coverage", () => {
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
    kind: "task-count",
    pending: 1,
    completed: 1,
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
    "task-count",
  ]);
});

test("toHomeModel keeps the newest preview rows and ignores tab", () => {
  expect(HOME_PREVIEW_COUNT).toBe(3);
  const page = pageOf([ready, processing, queued, failed]);
  const model = toHomeModel({
    page,
    view: { tab: "busy", query: "" },
    now,
    workspaceName: "Davi",
  });
  expect(model.rows.map((row) => row._id)).toEqual(["3", "4", "1"]);

  const search = toHomeModel({
    page,
    view: { tab: "all", query: "class" },
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

test("pushHomeUrl keeps AskFred open via applyAssistantPresence", async () => {
  const home = await Bun.file(join(import.meta.dir, "../lib/home.ts")).text();
  expect(home).toContain("applyAssistantPresence");
  expect(home).toContain("parseAssistantOpen");
  expect(home).toContain("pushAppUrl");
  expect(home.includes("assistantOpen")).toBe(false);
  expect(home.includes("subscribeHomeUrl")).toBe(false);
});

test("Home RSC fetches meetings on the server and hydrates the client dashboard", async () => {
  const page = await Bun.file(join(import.meta.dir, "../app/(app)/page.tsx")).text();
  const dashboard = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  expect(page).toContain('from "@lib/backend"');
  expect(page).toContain("listMeetings");
  expect(page).toContain("Promise.all");
  expect(page).toContain("initialPage");
  expect(dashboard).toContain("initialData:");
  expect(dashboard).toContain("props.initialPage");
});
