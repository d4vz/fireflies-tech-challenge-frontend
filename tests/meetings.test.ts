import { expect, test } from "bun:test";
import { parsePublicMeeting, toPublicMeeting } from "@lib/meetings";

test("toPublicMeeting rewrites video urls and thumbnail", () => {
  const meeting = toPublicMeeting({
    _id: "abc",
    sourceId: "clip.mp4",
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

test("parsePublicMeeting treats audio even when thumbnailUrl is present", () => {
  const meeting = parsePublicMeeting({
    _id: "abc",
    sourceId: "talk.mp3",
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
