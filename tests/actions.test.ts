import { expect, test } from "bun:test";
import { join } from "node:path";
import {
  HOME_RECENT_TASK_GROUPS,
  parseActionGroup,
  parseActionStatus,
  parseActionsView,
  taskCountLabel,
  tasksHref,
} from "@lib/actions";

test("Home recent tasks asks for two pending meeting groups", () => {
  expect(HOME_RECENT_TASK_GROUPS).toBe(2);
});

test("parseActionStatus keeps pending and completed", () => {
  expect(parseActionStatus("pending")).toBe("pending");
  expect(parseActionStatus("completed")).toBe("completed");
  expect(parseActionStatus("ready")).toBe("all");
  expect(parseActionStatus(undefined)).toBe("all");
});

test("tasksHref drops default all and page 1", () => {
  expect(tasksHref("all")).toBe("/tasks");
  expect(tasksHref("pending")).toBe("/tasks?status=pending");
  expect(tasksHref("completed", 2)).toBe("/tasks?status=completed&page=2");
  expect(tasksHref("all", 2)).toBe("/tasks?page=2");
});

test("parseActionsView reads status and page", () => {
  expect(parseActionsView(undefined, undefined)).toEqual({ status: "all", page: 1 });
  expect(parseActionsView("pending", "2")).toEqual({ status: "pending", page: 2 });
  expect(parseActionsView("nope", "0")).toEqual({ status: "all", page: 1 });
});

test("parseActionGroup keeps audio mediaKind", () => {
  expect(
    parseActionGroup({
      meetingId: "1",
      sourceId: "notes.mp3",
      name: "notes",
      createdAt: "2026-09-01T00:00:00.000Z",
      href: "/meetings/1",
      mediaKind: "audio",
      tasks: [],
    }).mediaKind,
  ).toBe("audio");
});

test("parseActionGroup treats missing mediaKind as video", () => {
  expect(
    parseActionGroup({
      meetingId: "1",
      sourceId: "clip.mp4",
      name: "clip",
      createdAt: "2026-09-01T00:00:00.000Z",
      href: "/meetings/1",
      tasks: [],
    }).mediaKind,
  ).toBe("video");
});

test("parseActionGroup trusts the stored name and rejects a blank one", () => {
  expect(
    parseActionGroup({
      meetingId: "1",
      sourceId: "clip.mp4",
      name: "Standup",
      createdAt: "2026-09-01T00:00:00.000Z",
      href: "/meetings/1",
      tasks: [],
    }).name,
  ).toBe("Standup");
  expect(() =>
    parseActionGroup({
      meetingId: "1",
      sourceId: "clip.mp4",
      name: "  ",
      createdAt: "2026-09-01T00:00:00.000Z",
      href: "/meetings/1",
      tasks: [],
    }),
  ).toThrow("invalid action group");
});

test("taskCountLabel is singular for one", () => {
  expect(taskCountLabel(1)).toBe("1 Task");
  expect(taskCountLabel(6)).toBe("6 Tasks");
  expect(taskCountLabel(0)).toBe("0 Tasks");
});

test("Tasks with no action items reuses Capture your first meeting", async () => {
  const list = await Bun.file(join(import.meta.dir, "../app/(app)/tasks/tasks-list.tsx")).text();
  expect(list).toContain("MeetingsEmpty");
  expect(list).toContain('props.status === "all"');
});
