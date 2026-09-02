import { expect, test } from "bun:test";
import {
  parsePublicMeeting,
  toPublicMeeting,
  parseMeetingStatus,
  meetingsHref,
  parseMeetingsView,
} from "@lib/meetings";

test("toPublicMeeting rewrites video urls and thumbnail", () => {
  const meeting = toPublicMeeting({
    _id: "abc",
    sourceId: "clip.mp4",
    name: "clip",
    createdAt: "2026-09-01T00:00:00.000Z",
    status: "ready",
    blob: {
      kind: "video",
      url: "http://blob/video",
      thumbnailUrl: "http://blob/thumb",
      durationInSeconds: 12,
    },
  });
  expect(meeting.blob).toEqual({
    kind: "video",
    url: "/api/meetings/abc/video",
    thumbnailUrl: "/api/meetings/abc/thumbnail",
    durationInSeconds: 12,
  });
});

test("toPublicMeeting rewrites audio url and does not add thumbnailUrl", () => {
  const meeting = toPublicMeeting({
    _id: "abc",
    sourceId: "talk.mp3",
    name: "talk",
    createdAt: "2026-09-01T00:00:00.000Z",
    status: "ready",
    blob: { kind: "audio", url: "http://blob/video", durationInSeconds: 12 },
  });
  expect(meeting.blob).toEqual({
    kind: "audio",
    url: "/api/meetings/abc/video",
    durationInSeconds: 12,
  });
  expect("thumbnailUrl" in meeting.blob).toBe(false);
});

test("parsePublicMeeting maps tasks and defaults missing status to pending", () => {
  const meeting = parsePublicMeeting({
    _id: "abc",
    sourceId: "clip.mp4",
    name: "clip",
    createdAt: "2026-09-01T00:00:00.000Z",
    status: "ready",
    tasks: [
      {
        _id: "t1",
        text: "review notes",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
      {
        _id: "t2",
        text: "send recap",
        status: "completed",
        updatedAt: "2026-09-01T00:01:00.000Z",
      },
    ],
    blob: {
      kind: "video",
      url: "/v",
      durationInSeconds: 12,
      thumbnailUrl: "/t",
    },
  });
  expect(meeting.tasks).toEqual([
    {
      _id: "t1",
      text: "review notes",
      status: "pending",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
    {
      _id: "t2",
      text: "send recap",
      status: "completed",
      updatedAt: "2026-09-01T00:01:00.000Z",
    },
  ]);
});

test("parsePublicMeeting treats audio even when thumbnailUrl is present", () => {
  const meeting = parsePublicMeeting({
    _id: "abc",
    sourceId: "talk.mp3",
    name: "talk",
    createdAt: "2026-09-01T00:00:00.000Z",
    status: "ready",
    blob: {
      kind: "audio",
      url: "/v",
      durationInSeconds: 3,
      thumbnailUrl: "/t",
    },
  });
  expect(meeting.blob).toEqual({ kind: "audio", url: "/v", durationInSeconds: 3 });
});

test("parsePublicMeeting trusts the stored name and rejects a blank one", () => {
  const meeting = parsePublicMeeting({
    _id: "abc",
    sourceId: "Kevin Kelly The Inevitable Video.mp4",
    name: "Kevin Kelly The Inevitable Video",
    createdAt: "2026-09-01T00:00:00.000Z",
    status: "ready",
    blob: {
      kind: "video",
      url: "/v",
      durationInSeconds: 12,
      thumbnailUrl: "/t",
    },
  });
  expect(meeting.name).toBe("Kevin Kelly The Inevitable Video");
  expect(() =>
    parsePublicMeeting({
      _id: "abc",
      sourceId: "clip.mp4",
      name: "  ",
      createdAt: "2026-09-01T00:00:00.000Z",
      status: "ready",
      blob: {
        kind: "video",
        url: "/v",
        durationInSeconds: 12,
        thumbnailUrl: "/t",
      },
    }),
  ).toThrow("invalid meeting");
});

test("parseMeetingStatus keeps ready processing failed and queued", () => {
  expect(parseMeetingStatus("ready")).toBe("ready");
  expect(parseMeetingStatus("processing")).toBe("processing");
  expect(parseMeetingStatus("failed")).toBe("failed");
  expect(parseMeetingStatus("queued")).toBe("queued");
  expect(parseMeetingStatus("pending")).toBe("all");
  expect(parseMeetingStatus(undefined)).toBe("all");
});

test("meetingsHref drops default all and page 1", () => {
  expect(meetingsHref("all")).toBe("/meetings");
  expect(meetingsHref("ready")).toBe("/meetings?status=ready");
  expect(meetingsHref("failed", 2)).toBe("/meetings?status=failed&page=2");
  expect(meetingsHref("all", 2)).toBe("/meetings?page=2");
});

test("parseMeetingsView reads status and page", () => {
  expect(parseMeetingsView(undefined, undefined)).toEqual({ status: "all", page: 1 });
  expect(parseMeetingsView("processing", "2")).toEqual({ status: "processing", page: 2 });
  expect(parseMeetingsView("nope", "0")).toEqual({ status: "all", page: 1 });
});
