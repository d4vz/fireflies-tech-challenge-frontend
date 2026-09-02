import { expect, test } from "bun:test";
import type { MeetingTask } from "@lib/meetings";
import { toMeetingNotesView } from "@lib/meeting-notes-view";

const task: MeetingTask = {
  _id: "t1",
  text: "Ship it",
  status: "pending",
  updatedAt: "2026-09-02T12:00:00.000Z",
};

test("queued and processing meetings are pending notes", () => {
  expect(toMeetingNotesView({ status: "queued" })).toEqual({ kind: "pending" });
  expect(toMeetingNotesView({ status: "processing" })).toEqual({ kind: "pending" });
});

test("ready meetings keep summary text and tasks", () => {
  expect(
    toMeetingNotesView({
      status: "ready",
      summary: { text: "We talked about beer." },
      tasks: [task],
    }),
  ).toEqual({
    kind: "ready",
    summaryText: "We talked about beer.",
    tasks: [task],
  });
});

test("ready and failed meetings with no tasks hide the list", () => {
  expect(toMeetingNotesView({ status: "ready" })).toEqual({
    kind: "ready",
    summaryText: undefined,
    tasks: [],
  });
  expect(toMeetingNotesView({ status: "failed" })).toEqual({
    kind: "ready",
    summaryText: undefined,
    tasks: [],
  });
});
