import { expect, test } from "bun:test";
import { HOME_PREVIEW_COUNT, toHomeModel } from "@lib/home";
import type { Meeting, MeetingListPage } from "@lib/meetings";

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
    name: input.sourceId,
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

test("toHomeModel uses page.total for the meeting-count copy even on a sample", () => {
  const model = toHomeModel({
    page: pageOf([ready], 40),
    now,
    workspaceName: "Davi",
  });
  expect(model.coverage).toEqual({ kind: "sample", sampled: 1, total: 40 });
  expect(model.insights[0]).toEqual({
    kind: "meeting-count",
    title: "Meetings",
    body: "40 in the library",
    metric: "40",
  });
});

test("toHomeModel puts sample coverage into busy and task copy notes", () => {
  const model = toHomeModel({
    page: pageOf([ready, processing], 10),
    now,
    workspaceName: "Davi",
  });
  expect(model.insights).toContainEqual({
    kind: "busy-count",
    title: "In progress",
    body: "1 processing",
    metric: "1",
    note: "From 2 of 10",
  });
  expect(model.insights).toContainEqual({
    kind: "task-count",
    title: "Tasks",
    body: "1 pending · 1 completed",
    metric: "1",
    note: "From 2 of 10",
  });
});

test("toHomeModel omits coverage notes when the page is complete", () => {
  const model = toHomeModel({
    page: pageOf([ready, processing]),
    now,
    workspaceName: "Davi",
  });
  expect(model.insights[1]).toEqual({
    kind: "busy-count",
    title: "In progress",
    body: "1 processing",
    metric: "1",
  });
  expect(model.insights[2]?.note).toBeUndefined();
});

test("toHomeModel never adds a longest-processing insight card", () => {
  const model = toHomeModel({
    page: pageOf([queued, processing]),
    now,
    workspaceName: "Davi",
  });
  expect(model.insights.map((card) => card.kind)).toEqual([
    "meeting-count",
    "busy-count",
    "task-count",
  ]);
});

test("toHomeModel keeps the newest preview rows", () => {
  expect(HOME_PREVIEW_COUNT).toBe(2);
  const model = toHomeModel({
    page: pageOf([ready, processing, queued, failed]),
    now,
    workspaceName: "Davi",
  });
  expect(model.rows.map((row) => row._id)).toEqual(["3", "4"]);
});

test("toHomeModel greeting uses periodAt and the workspace name", () => {
  const model = toHomeModel({
    page: pageOf([]),
    now,
    workspaceName: "Davi",
  });
  expect(model.greeting).toEqual({ period: "afternoon", workspaceName: "Davi" });
});
