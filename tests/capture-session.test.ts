import { expect, test } from "bun:test";
import { join } from "node:path";
import {
  PROCESSING_NOTICE,
  UPLOAD_LOADING,
  UPLOAD_PENDING_HINT,
  MEDIA_ACCEPT,
  MEDIA_FORMAT_LABEL,
  applyUploadFile,
  canConfirm,
  confirmCaptureNaming,
  confirmUploadNaming,
  firstAcceptedMedia,
  isNameModalOpen,
  prefillName,
  setSessionName,
  startCaptureNaming,
  startPickingUpload,
  uploadContentType,
  uploadFilename,
} from "@lib/capture-session";

function video(name: string, type = "video/mp4") {
  return new File(["x"], name, { type });
}

function audio(name: string, type = "audio/mpeg") {
  return new File(["x"], name, { type });
}

test("UPLOAD_PENDING_HINT tells the user the meeting stays pending", () => {
  expect(UPLOAD_PENDING_HINT).toContain("pending");
  expect(UPLOAD_PENDING_HINT).toContain("Meetings");
  expect(UPLOAD_LOADING).toContain("Uploading");
  expect(PROCESSING_NOTICE).toContain("processing");
  expect(PROCESSING_NOTICE).toContain("pending");
  expect(PROCESSING_NOTICE).toContain("transcription");
});

test("MEDIA_FORMAT_LABEL lists every accepted extension", () => {
  for (const ext of [
    ".mp4",
    ".webm",
    ".mov",
    ".mkv",
    ".m4v",
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".ogg",
    ".flac",
  ]) {
    expect(MEDIA_ACCEPT).toContain(ext);
    expect(MEDIA_FORMAT_LABEL).toContain(ext);
  }
});

test("capture naming starts empty and cannot confirm", () => {
  const session = startCaptureNaming();
  expect(session).toEqual({ kind: "naming-capture", name: "" });
  expect(isNameModalOpen(session)).toBe(true);
  expect(canConfirm(session)).toBe(false);
});

test("upload picking starts with no file and cannot confirm", () => {
  const session = startPickingUpload();
  expect(session).toEqual({ kind: "picking-upload", name: "" });
  expect(isNameModalOpen(session)).toBe(true);
  expect(canConfirm(session)).toBe(false);
});

test("applyUploadFile prefills the filename stem", () => {
  const file = video("standup.mp4");
  const session = applyUploadFile(startPickingUpload(), file);
  expect(session).toEqual({ kind: "naming-upload", name: "standup", file });
  expect(canConfirm(session)).toBe(true);
  expect(prefillName(file)).toBe("standup");
});

test("a second file does not overwrite an edited name", () => {
  const first = video("standup.mp4");
  const second = video("other.webm", "video/webm");
  const named = applyUploadFile(startPickingUpload(), first);
  if (named.kind !== "naming-upload") {
    throw new Error("expected naming-upload");
  }
  const edited = setSessionName(named, "Q2 review");
  expect(applyUploadFile(edited, second)).toEqual({
    kind: "naming-upload",
    name: "Q2 review",
    file: second,
  });
});

test("a second file overwrites the name when it still matches the previous prefill", () => {
  const first = video("standup.mp4");
  const second = video("interview.mov", "video/quicktime");
  const named = applyUploadFile(startPickingUpload(), first);
  expect(applyUploadFile(named, second)).toEqual({
    kind: "naming-upload",
    name: "interview",
    file: second,
  });
});

test("rejected non-video leaves the session unchanged", () => {
  const picking = startPickingUpload();
  expect(applyUploadFile(picking, new File(["x"], "notes.txt", { type: "text/plain" }))).toBe(
    picking,
  );
  const named = applyUploadFile(picking, video("standup.mp4"));
  expect(applyUploadFile(named, new File(["x"], "photo.png", { type: "image/png" }))).toBe(named);
});

test("firstAcceptedMedia keeps mp3 and rejects txt", () => {
  const mp3 = audio("talk.mp3");
  expect(firstAcceptedMedia([mp3])).toBe(mp3);
  expect(
    firstAcceptedMedia([new File(["x"], "notes.txt", { type: "text/plain" })]),
  ).toBeUndefined();
});

test("uploadContentType keeps a declared audio MIME", async () => {
  expect(await uploadContentType(audio("talk.mp3"))).toBe("audio/mpeg");
  expect(await uploadContentType(audio("talk.webm", "audio/webm"))).toBe("audio/webm");
});

test("uploadContentType keeps a declared video MIME for non-webm files", async () => {
  expect(await uploadContentType(video("clip.mp4"))).toBe("video/mp4");
});

test("uploadContentType sends audio/webm for audio-only webm tagged as video/webm", async () => {
  const file = new File([new TextEncoder().encode("A_OPUS")], "talk.webm", { type: "video/webm" });
  expect(await uploadContentType(file)).toBe("audio/webm");
});

test("uploadContentType keeps video/webm when a video codec is present", async () => {
  const file = new File([new TextEncoder().encode("V_VP8A_VORBIS")], "clip.webm", {
    type: "video/webm",
  });
  expect(await uploadContentType(file)).toBe("video/webm");
});

test("uploadContentType sends audio/webm for an untyped audio-only webm", async () => {
  const file = new File([new TextEncoder().encode("A_OPUS")], "talk.webm", { type: "" });
  expect(await uploadContentType(file)).toBe("audio/webm");
});

test("uploadFilename appends mp3 when the display name has no extension", () => {
  expect(uploadFilename("talk", audio("talk.mp3"))).toBe("talk.mp3");
});

test("uploadFilename appends the file extension when the display name has none", () => {
  const webm = video("screen-recording.webm", "video/webm");
  expect(uploadFilename("Q2 review", webm)).toBe("Q2 review.webm");
  expect(uploadFilename("clip.mp4", video("clip.mp4"))).toBe("clip.mp4");
  expect(uploadFilename("  clip.MP4  ", video("other.mp4"))).toBe("clip.MP4");
});

test("confirm naming is a no-op on an empty name", () => {
  const capture = startCaptureNaming();
  expect(confirmCaptureNaming(capture)).toBe(capture);
  const whitespaceCapture = setSessionName(capture, "   ");
  expect(confirmCaptureNaming(whitespaceCapture)).toBe(whitespaceCapture);

  const named = applyUploadFile(startPickingUpload(), video("standup.mp4"));
  if (named.kind !== "naming-upload") {
    throw new Error("expected naming-upload");
  }
  const emptied = setSessionName(named, "   ");
  expect(confirmUploadNaming(emptied)).toEqual({ kind: "naming-upload", session: emptied });
});

test("confirm upload with a name moves to uploading", () => {
  const file = video("standup.mp4");
  const named = applyUploadFile(startPickingUpload(), file);
  if (named.kind !== "naming-upload") {
    throw new Error("expected naming-upload");
  }
  expect(confirmUploadNaming(named)).toEqual({
    kind: "uploading",
    session: { kind: "uploading", name: "standup" },
    file,
    filename: "standup.mp4",
  });
});

test("confirm capture with a name moves to recording", () => {
  const next = confirmCaptureNaming(setSessionName(startCaptureNaming(), " Weekly "));
  expect(next).toEqual({ kind: "recording", name: "Weekly" });
});

test("isNameModalOpen covers every naming kind", () => {
  expect(isNameModalOpen({ kind: "idle" })).toBe(false);
  expect(isNameModalOpen({ kind: "recording", name: "a" })).toBe(false);
  expect(isNameModalOpen({ kind: "uploading", name: "a" })).toBe(false);
  expect(isNameModalOpen(startCaptureNaming())).toBe(true);
  expect(isNameModalOpen(startPickingUpload())).toBe(true);
  expect(isNameModalOpen(applyUploadFile(startPickingUpload(), video("a.mp4")))).toBe(true);
});

test("upload menu item has an icon and a description", async () => {
  const capture = await Bun.file(join(import.meta.dir, "../components/capture.tsx")).text();
  expect(capture).toContain("Add a recording from your computer");
  expect(capture).toContain("w-[min(18rem,calc(100vw-1.5rem))]");
  expect(capture).toContain("<Upload");
});

test("Capture has no recording status text beside the button", async () => {
  const capture = await Bun.file(join(import.meta.dir, "../components/capture.tsx")).text();
  const session = await Bun.file(join(import.meta.dir, "../lib/capture-session.ts")).text();
  expect(capture.includes("sessionLabel")).toBe(false);
  expect(session.includes("sessionLabel")).toBe(false);
  expect(capture.includes("text-muted-foreground md:inline")).toBe(false);
});
