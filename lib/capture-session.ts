export type CaptureSession =
  | { kind: "idle" }
  | { kind: "failed"; message: string }
  | { kind: "naming-capture"; name: string }
  | { kind: "picking-upload"; name: string }
  | { kind: "naming-upload"; name: string; file: File }
  | { kind: "recording"; name: string }
  | { kind: "uploading"; name: string };

export type NamingSession = Extract<
  CaptureSession,
  { kind: "naming-capture" | "picking-upload" | "naming-upload" }
>;

export const VIDEO_ACCEPT =
  "video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-m4v,.mp4,.webm,.mov,.mkv,.m4v";

const VIDEO_ACCEPT_TOKENS = VIDEO_ACCEPT.split(",");
const VIDEO_MIMES = VIDEO_ACCEPT_TOKENS.filter((token) => !token.startsWith("."));
const VIDEO_EXTS = VIDEO_ACCEPT_TOKENS.filter((token) => token.startsWith("."));

export const VIDEO_FORMAT_LABEL = VIDEO_EXTS.join(", ");

export const UPLOAD_PENDING_HINT =
  "The video is uploaded and stays pending while we process it. You can view it in Meetings.";

export const PROCESSING_NOTICE =
  "This video is processing. It stays pending until transcription finishes. Open the meeting to follow progress.";

export function resetSession(): Extract<CaptureSession, { kind: "idle" }> {
  return { kind: "idle" };
}

export function failSession(message: string): Extract<CaptureSession, { kind: "failed" }> {
  return { kind: "failed", message };
}

export function startCaptureNaming(): Extract<CaptureSession, { kind: "naming-capture" }> {
  return { kind: "naming-capture", name: "" };
}

export function startPickingUpload(): Extract<CaptureSession, { kind: "picking-upload" }> {
  return { kind: "picking-upload", name: "" };
}

export function setSessionName<T extends NamingSession>(session: T, name: string): T {
  return { ...session, name };
}

function isAcceptedVideo(file: File): boolean {
  const mime = file.type.split(";")[0]?.trim() ?? "";
  if (mime !== "" && VIDEO_MIMES.includes(mime)) {
    return true;
  }
  const lower = file.name.toLowerCase();
  return VIDEO_EXTS.some((ext) => lower.endsWith(ext));
}

export function firstAcceptedVideo(files: ArrayLike<File>): File | undefined {
  return Array.from(files).find(isAcceptedVideo);
}

export function prefillName(file: File): string {
  const lastDot = file.name.lastIndexOf(".");
  if (lastDot <= 0) {
    return file.name;
  }
  return file.name.slice(0, lastDot);
}

export function applyUploadFile(session: CaptureSession, file: File): CaptureSession {
  if (
    !isAcceptedVideo(file) ||
    (session.kind !== "picking-upload" && session.kind !== "naming-upload")
  ) {
    return session;
  }
  const previousPrefill = session.kind === "naming-upload" ? prefillName(session.file) : "";
  const name =
    session.name.trim() === "" || session.name === previousPrefill
      ? prefillName(file)
      : session.name;
  return { kind: "naming-upload", name, file };
}

export function confirmCaptureNaming(
  session: Extract<CaptureSession, { kind: "naming-capture" }>,
): Extract<CaptureSession, { kind: "naming-capture" | "recording" }> {
  const name = session.name.trim();
  if (name === "") {
    return session;
  }
  return { kind: "recording", name };
}

export function confirmUploadNaming(session: Extract<CaptureSession, { kind: "naming-upload" }>):
  | { kind: "naming-upload"; session: Extract<CaptureSession, { kind: "naming-upload" }> }
  | {
      kind: "uploading";
      session: Extract<CaptureSession, { kind: "uploading" }>;
      file: File;
      filename: string;
    } {
  const name = session.name.trim();
  if (name === "") {
    return { kind: "naming-upload", session };
  }
  return {
    kind: "uploading",
    session: { kind: "uploading", name },
    file: session.file,
    filename: uploadFilename(name, session.file),
  };
}

export function canConfirm(session: CaptureSession): boolean {
  switch (session.kind) {
    case "naming-capture":
    case "naming-upload":
      return session.name.trim().length > 0;
    case "idle":
    case "failed":
    case "picking-upload":
    case "recording":
    case "uploading":
      return false;
  }
}

export function isNameModalOpen(session: CaptureSession): boolean {
  switch (session.kind) {
    case "naming-capture":
    case "picking-upload":
    case "naming-upload":
      return true;
    case "idle":
    case "failed":
    case "recording":
    case "uploading":
      return false;
  }
}

export function sessionLabel(session: CaptureSession): "" | "recording" | "uploading" {
  switch (session.kind) {
    case "recording":
      return "recording";
    case "uploading":
      return "uploading";
    case "idle":
    case "failed":
    case "naming-capture":
    case "picking-upload":
    case "naming-upload":
      return "";
  }
}

function hasAllowedVideoExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return VIDEO_EXTS.some((ext) => lower.endsWith(ext));
}

function fileExtension(name: string): string | undefined {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === name.length - 1) {
    return undefined;
  }
  return name.slice(lastDot);
}

/**
 * Query `filename` / stored `sourceId`. Does not copy File bytes or change File.type.
 * Recordings use codec-suffixed MIME that fails the MIME allowlist, so a name
 * with no video extension must gain the file's extension here.
 */
export function uploadFilename(displayName: string, file: File): string {
  const trimmed = displayName.trim();
  if (hasAllowedVideoExtension(trimmed)) {
    return trimmed;
  }
  const ext = fileExtension(file.name);
  if (ext === undefined) {
    return trimmed;
  }
  return `${trimmed}${ext}`;
}
