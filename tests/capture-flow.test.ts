import { expect, test } from "bun:test";
import { createCaptureFlow } from "@lib/capture-flow";
import type { CaptureSession } from "@lib/capture-session";
import type { Meeting } from "@lib/meetings";

function meetingOf(id: string): Meeting {
  return {
    _id: id,
    sourceId: "screen-recording.webm",
    name: "Standup",
    createdAt: "2026-09-01T00:00:00.000Z",
    status: "queued",
    blob: { kind: "video", url: "/v", thumbnailUrl: "/t", durationInSeconds: 1 },
  };
}

function recordingFile(): File {
  return new File(["ok"], "screen-recording.webm", { type: "video/webm" });
}

function deferredFile() {
  let resolve!: (file: File) => void;
  const done = new Promise<File>((res) => {
    resolve = res;
  });
  return { done, resolve };
}

function flowOf(input: {
  record?: () => Promise<{ stop: () => void; done: Promise<File> }>;
  upload?: (file: File, filename: string, name: string) => Promise<Meeting>;
}) {
  const sessions: CaptureSession[] = [];
  const uploaded: Meeting[] = [];
  const uploads: { filename: string; name: string }[] = [];
  const flow = createCaptureFlow({
    record: input.record ?? (async () => ({ stop() {}, done: Promise.resolve(recordingFile()) })),
    upload:
      input.upload ??
      (async (_file, filename, name) => {
        uploads.push({ filename, name });
        return meetingOf("m1");
      }),
    onChange: (session) => {
      sessions.push(session);
    },
    onUploaded: (meeting) => {
      uploaded.push(meeting);
    },
  });
  return { flow, sessions, uploaded, uploads };
}

test("permission denial silently resets without uploading", async () => {
  const { flow, sessions, uploaded } = flowOf({
    record: async () => {
      throw new DOMException("Permission denied", "NotAllowedError");
    },
  });
  flow.startCapture();
  flow.setName("Standup");
  await flow.confirm();
  expect(sessions.at(-1)).toEqual({ kind: "idle" });
  expect(uploaded).toEqual([]);
});

test("a recorder error fails the session", async () => {
  const { flow, sessions, uploaded } = flowOf({
    record: async () => {
      throw new Error("device busy");
    },
  });
  flow.startCapture();
  flow.setName("Standup");
  await flow.confirm();
  expect(sessions.at(-1)).toEqual({ kind: "failed", message: "device busy" });
  expect(uploaded).toEqual([]);
});

test("upload failure fails the session", async () => {
  const { flow, sessions, uploaded } = flowOf({
    upload: async () => {
      throw new Error("upload failed");
    },
  });
  flow.startCapture();
  flow.setName("Standup");
  await flow.confirm();
  expect(sessions.at(-1)).toEqual({ kind: "failed", message: "upload failed" });
  expect(uploaded).toEqual([]);
});

test("cancel while recording resets and skips upload", async () => {
  const pending = deferredFile();
  let stopped = 0;
  let releaseRecord!: () => void;
  const recordStarted = new Promise<void>((resolve) => {
    releaseRecord = resolve;
  });
  const { flow, sessions, uploaded } = flowOf({
    record: async () => {
      releaseRecord();
      return {
        stop() {
          stopped += 1;
        },
        done: pending.done,
      };
    },
  });
  flow.startCapture();
  flow.setName("Standup");
  const confirm = flow.confirm();
  await recordStarted;
  flow.cancel();
  pending.resolve(recordingFile());
  await confirm;
  expect(stopped).toBe(1);
  expect(sessions.at(-1)).toEqual({ kind: "idle" });
  expect(uploaded).toEqual([]);
});

test("a finished recording uploads and notifies", async () => {
  const { flow, uploaded, uploads, sessions } = flowOf({});
  flow.startCapture();
  flow.setName("Standup");
  await flow.confirm();
  expect(uploads).toEqual([{ filename: "Standup.webm", name: "Standup" }]);
  expect(uploaded).toEqual([meetingOf("m1")]);
  expect(sessions.at(-1)).toEqual({ kind: "idle" });
});
