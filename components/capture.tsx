"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropzone } from "@/components/ui/dropzone";
import { Input } from "@/components/ui/input";
import { useCaptureReadiness } from "@/hooks/use-capture-readiness";
import type { CaptureReadinessItem, CaptureReadinessStatus } from "@lib/capture-readiness";
import { uploadVideo } from "@lib/api";
import {
  PROCESSING_NOTICE,
  UPLOAD_PENDING_HINT,
  MEDIA_ACCEPT,
  MEDIA_FORMAT_LABEL,
  applyUploadFile,
  canConfirm,
  confirmCaptureNaming,
  confirmUploadNaming,
  failSession,
  firstAcceptedMedia,
  isNameModalOpen,
  resetSession,
  sessionLabel,
  setSessionName,
  startCaptureNaming,
  startPickingUpload,
  uploadFilename,
  type CaptureSession,
  type NamingSession,
} from "@lib/capture-session";
import { subscribeCaptureIntent, type CaptureIntent } from "@lib/capture-intent";
import { meetingId, meetingsKey, type Meeting } from "@lib/meetings";
import { actionsKey } from "@lib/actions";
import { startScreenRecording, type ScreenRecording } from "@lib/screen-record";

function CameraIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.8" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isNaming(session: CaptureSession): session is NamingSession {
  return (
    session.kind === "naming-capture" ||
    session.kind === "picking-upload" ||
    session.kind === "naming-upload"
  );
}

function sessionFromIntent(
  intent: CaptureIntent,
): Extract<CaptureSession, { kind: "naming-capture" | "picking-upload" }> {
  switch (intent) {
    case "capture":
      return startCaptureNaming();
    case "upload":
      return startPickingUpload();
    default: {
      const exhaustive: never = intent;
      return exhaustive;
    }
  }
}

type SessionSetter = Dispatch<SetStateAction<CaptureSession>>;

type AfterUpload = (meeting: Meeting) => void;

async function recordThenUpload(
  current: Extract<CaptureSession, { kind: "naming-capture" }>,
  recordingRef: { current: ScreenRecording | null },
  setSession: SessionSetter,
  afterUpload: AfterUpload,
) {
  const next = confirmCaptureNaming(current);
  setSession(next);
  if (next.kind !== "recording") {
    return;
  }
  try {
    const handle = await startScreenRecording();
    recordingRef.current = handle;
    const file = await handle.done;
    recordingRef.current = null;
    setSession({ kind: "uploading", name: next.name });
    const meeting = await uploadVideo(file, uploadFilename(next.name, file));
    setSession(resetSession());
    afterUpload(meeting);
  } catch (caught) {
    recordingRef.current = null;
    if (caught instanceof DOMException && caught.name === "NotAllowedError") {
      setSession(resetSession());
      return;
    }
    setSession(failSession(caught instanceof Error ? caught.message : "recording failed"));
  }
}

async function uploadNamedFile(
  current: Extract<CaptureSession, { kind: "naming-upload" }>,
  setSession: SessionSetter,
  afterUpload: AfterUpload,
) {
  const confirmed = confirmUploadNaming(current);
  if (confirmed.kind !== "uploading") {
    return;
  }
  setSession(confirmed.session);
  try {
    const meeting = await uploadVideo(confirmed.file, confirmed.filename);
    setSession(resetSession());
    afterUpload(meeting);
  } catch (caught) {
    setSession(failSession(caught instanceof Error ? caught.message : "upload failed"));
  }
}

function CaptureSplitButton(props: {
  uploading: boolean;
  menuOpen: boolean;
  captureRef: { current: HTMLDivElement | null };
  onCapture: () => void;
  onToggleMenu: () => void;
  onUploadVideo: () => void;
}) {
  return (
    <div className="relative" ref={props.captureRef}>
      <div className="inline-flex overflow-hidden rounded-[10px]">
        <button
          aria-busy={props.uploading}
          className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-accent px-2.5 py-2 font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-accent md:px-3.5"
          disabled={props.uploading}
          type="button"
          onClick={props.onCapture}
        >
          {props.uploading ? <Spinner /> : <CameraIcon />}
          <span className="max-md:sr-only">Capture</span>
        </button>
        <button
          aria-expanded={props.menuOpen}
          aria-haspopup="menu"
          aria-label="Upload"
          className="inline-flex cursor-pointer items-center border-0 border-l border-white/25 bg-accent px-2 text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-accent"
          disabled={props.uploading}
          type="button"
          onClick={props.onToggleMenu}
        >
          <ChevronIcon />
        </button>
      </div>
      {props.menuOpen ? (
        <div className="absolute top-[calc(100%+0.4rem)] right-0 z-10 min-w-45 rounded-xl border border-line bg-paper p-1.5 shadow-[0_10px_30px_rgba(16,18,27,0.1)]">
          <button
            className="block w-full cursor-pointer rounded-lg border-0 bg-transparent px-2.5 py-2 text-left hover:bg-nav"
            type="button"
            onClick={props.onUploadVideo}
          >
            Upload
          </button>
        </div>
      ) : null}
    </div>
  );
}

const SCREEN_CAPTURE_COMPAT_HREF =
  "https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia#browser_compatibility";

const SCREEN_CAPTURE_PERMISSION_HINT =
  "If Window or Entire screen is empty, reload the app. You may also need to enable Screen Recording in system settings.";

function CaptureDeviceAlert() {
  return (
    <Alert variant="warning">
      <TriangleAlertIcon />
      <AlertTitle>Limited device support</AlertTitle>
      <AlertDescription>
        Screen capture does not work properly on some phones, tablets, and browsers.{" "}
        <a href={SCREEN_CAPTURE_COMPAT_HREF} target="_blank" rel="noreferrer">
          See which devices this works on
        </a>
        .
      </AlertDescription>
    </Alert>
  );
}

function UploadPendingAlert() {
  return (
    <Alert variant="info">
      <InfoIcon />
      <AlertTitle>Pending after upload</AlertTitle>
      <AlertDescription>
        {UPLOAD_PENDING_HINT.replace(/Meetings\.$/, "")}
        <Link href="/meetings">Meetings</Link>.
      </AlertDescription>
    </Alert>
  );
}

function readinessDotClass(status: CaptureReadinessStatus): string {
  switch (status) {
    case "ready":
      return "bg-ready";
    case "blocked":
      return "bg-danger";
    case "checking":
      return "bg-muted-foreground";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

type CaptureReadinessChecksProps = {
  items: readonly CaptureReadinessItem[];
};

function CaptureReadinessChecks(props: CaptureReadinessChecksProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.items.map((item) => (
        <Badge
          key={item.label}
          variant="outline"
          className="h-6 gap-1.5"
          data-icon="inline-end"
          title={item.detail}
          aria-label={`${item.label}: ${item.detail}`}
        >
          {item.label}
          <span
            className={`size-2 shrink-0 rounded-full ${readinessDotClass(item.status)}`}
            aria-hidden="true"
          />
        </Badge>
      ))}
    </div>
  );
}

function CaptureNameDialog(props: {
  session: CaptureSession;
  setSession: SessionSetter;
  onConfirm: () => void;
}) {
  const session = props.session;
  const namingOpen = isNameModalOpen(session);
  const confirmEnabled = canConfirm(session);
  const confirmLabel = session.kind === "naming-capture" ? "Start capture" : "Upload";
  const name = isNaming(session) ? session.name : "";
  const showDrop = session.kind === "picking-upload" || session.kind === "naming-upload";
  const selectedFileName = session.kind === "naming-upload" ? session.file.name : undefined;
  const readiness = useCaptureReadiness(session.kind === "naming-capture");

  return (
    <Dialog
      open={namingOpen}
      onOpenChange={(open) => {
        if (!open) {
          props.setSession((current) => (isNameModalOpen(current) ? resetSession() : current));
        }
      }}
    >
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Meeting name</DialogTitle>
        </DialogHeader>
        <Input
          aria-label="Meeting name"
          value={name}
          autoFocus
          placeholder="Meeting name"
          onChange={(event) => {
            const nextName = event.target.value;
            props.setSession((current) =>
              isNaming(current) ? setSessionName(current, nextName) : current,
            );
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              props.onConfirm();
            }
          }}
        />
        {session.kind === "naming-capture" ? (
          <>
            <CaptureReadinessChecks items={readiness} />
            <CaptureDeviceAlert />
            <p className="text-xs text-muted-foreground">{SCREEN_CAPTURE_PERMISSION_HINT}</p>
          </>
        ) : null}
        {showDrop ? (
          <>
            <UploadPendingAlert />
            <Dropzone
              accept={MEDIA_ACCEPT}
              className="min-h-32 gap-1.5 sm:min-h-40"
              onDrop={(files) => {
                const file = firstAcceptedMedia(files);
                if (!file) {
                  return;
                }
                props.setSession((current) => applyUploadFile(current, file));
              }}
            >
              <span className="text-foreground">
                {selectedFileName ?? "Drop a video or audio file, or click to browse"}
              </span>
              <span>Supported files: {MEDIA_FORMAT_LABEL}</span>
            </Dropzone>
          </>
        ) : null}
        <DialogFooter>
          <Button type="button" disabled={!confirmEnabled} onClick={props.onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Capture() {
  const queryClient = useQueryClient();
  const captureRef = useRef<HTMLDivElement>(null);
  const recordingRef = useRef<ScreenRecording | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<CaptureSession>(resetSession);

  useEffect(() => {
    return subscribeCaptureIntent((intent) => {
      setMenuOpen(false);
      setSession(sessionFromIntent(intent));
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      const node = event.target;
      if (node instanceof Node && captureRef.current?.contains(node)) {
        return;
      }
      setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  function afterUpload(meeting: Meeting) {
    void queryClient.invalidateQueries({ queryKey: meetingsKey });
    void queryClient.invalidateQueries({ queryKey: actionsKey });
    const id = meetingId(meeting);
    toast(PROCESSING_NOTICE, {
      description: (
        <Link className="underline underline-offset-3" href={`/meetings/${id}`}>
          View meeting
        </Link>
      ),
    });
  }

  function onConfirm() {
    if (session.kind === "naming-capture") {
      void recordThenUpload(session, recordingRef, setSession, afterUpload);
      return;
    }
    if (session.kind === "naming-upload") {
      void uploadNamedFile(session, setSession, afterUpload);
    }
  }

  const uploading = session.kind === "uploading";
  const recording = session.kind === "recording";
  const label = sessionLabel(session);
  const error = session.kind === "failed" ? session.message : "";

  return (
    <div className="relative flex shrink-0 items-center gap-3">
      {label ? (
        <span className="hidden text-[0.85rem] text-muted-foreground md:inline">{label}</span>
      ) : null}
      {error ? (
        <span className="max-w-24 truncate text-[0.85rem] text-danger md:max-w-none">{error}</span>
      ) : null}
      {recording ? (
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-0 bg-danger px-3.5 py-2 font-semibold text-white"
          type="button"
          onClick={() => recordingRef.current?.stop()}
        >
          Stop
        </button>
      ) : (
        <CaptureSplitButton
          uploading={uploading}
          menuOpen={menuOpen}
          captureRef={captureRef}
          onCapture={() => {
            setMenuOpen(false);
            setSession(startCaptureNaming());
          }}
          onToggleMenu={() => setMenuOpen((value) => !value)}
          onUploadVideo={() => {
            setMenuOpen(false);
            setSession(startPickingUpload());
          }}
        />
      )}
      <CaptureNameDialog session={session} setSession={setSession} onConfirm={onConfirm} />
    </div>
  );
}
