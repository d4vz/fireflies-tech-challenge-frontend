import {
  applyUploadFile,
  confirmCaptureNaming,
  confirmUploadNaming,
  failSession,
  resetSession,
  setSessionName,
  startCaptureNaming,
  startPickingUpload,
  uploadFilename,
  type CaptureSession,
} from "@lib/capture-session";
import type { Meeting } from "@lib/meetings";

export type CaptureRecordHandle = {
  stop: () => void;
  done: Promise<File>;
};

export type CaptureFlowDeps = {
  record: () => Promise<CaptureRecordHandle>;
  upload: (file: File, filename: string, name: string) => Promise<Meeting>;
  onChange: (session: CaptureSession) => void;
  onUploaded: (meeting: Meeting) => void;
};

function isNaming(
  session: CaptureSession,
): session is Extract<
  CaptureSession,
  { kind: "naming-capture" | "picking-upload" | "naming-upload" }
> {
  return (
    session.kind === "naming-capture" ||
    session.kind === "picking-upload" ||
    session.kind === "naming-upload"
  );
}

export function createCaptureFlow(deps: CaptureFlowDeps) {
  let session: CaptureSession = resetSession();
  let recording: CaptureRecordHandle | null = null;
  let cancelled = false;

  function set(next: CaptureSession) {
    session = next;
    deps.onChange(next);
  }

  async function recordThenUpload() {
    if (session.kind !== "naming-capture") {
      return;
    }
    const next = confirmCaptureNaming(session);
    set(next);
    if (next.kind !== "recording") {
      return;
    }
    cancelled = false;
    try {
      const handle = await deps.record();
      if (cancelled) {
        handle.stop();
        return;
      }
      recording = handle;
      const file = await handle.done;
      recording = null;
      if (cancelled) {
        return;
      }
      set({ kind: "uploading", name: next.name });
      const meeting = await deps.upload(file, uploadFilename(next.name, file), next.name);
      set(resetSession());
      deps.onUploaded(meeting);
    } catch (caught) {
      recording = null;
      if (cancelled) {
        return;
      }
      if (caught instanceof DOMException && caught.name === "NotAllowedError") {
        set(resetSession());
        return;
      }
      set(failSession(caught instanceof Error ? caught.message : "recording failed"));
    }
  }

  async function uploadNamedFile() {
    if (session.kind !== "naming-upload") {
      return;
    }
    const confirmed = confirmUploadNaming(session);
    if (confirmed.kind !== "uploading") {
      return;
    }
    set(confirmed.session);
    try {
      const meeting = await deps.upload(confirmed.file, confirmed.filename, confirmed.session.name);
      set(resetSession());
      deps.onUploaded(meeting);
    } catch (caught) {
      set(failSession(caught instanceof Error ? caught.message : "upload failed"));
    }
  }

  return {
    startCapture() {
      set(startCaptureNaming());
    },
    startUpload() {
      set(startPickingUpload());
    },
    setName(name: string) {
      if (isNaming(session)) {
        set(setSessionName(session, name));
      }
    },
    applyFile(file: File) {
      set(applyUploadFile(session, file));
    },
    async confirm() {
      if (session.kind === "naming-capture") {
        await recordThenUpload();
        return;
      }
      if (session.kind === "naming-upload") {
        await uploadNamedFile();
      }
    },
    stopRecording() {
      recording?.stop();
    },
    cancel() {
      if (session.kind === "recording") {
        cancelled = true;
        recording?.stop();
        recording = null;
        set(resetSession());
        return;
      }
      if (isNaming(session)) {
        set(resetSession());
      }
    },
  };
}
