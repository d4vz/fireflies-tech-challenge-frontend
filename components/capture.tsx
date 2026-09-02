"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { uploadVideo } from "@lib/api";
import { meetingsKey } from "@lib/meetings";
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

export function Capture() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const recordingRef = useRef<ScreenRecording | null>(null);
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      const node = event.target;
      if (node instanceof Node && captureRef.current?.contains(node)) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function onFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setError("");
    setOpen(false);
    setStage("uploading");
    try {
      await uploadVideo(file);
      setStage("");
      await queryClient.invalidateQueries({ queryKey: meetingsKey });
      router.push("/meetings");
    } catch (caught) {
      setStage("");
      setError(caught instanceof Error ? caught.message : "upload failed");
    }
  }

  async function onRecord() {
    setError("");
    setOpen(false);
    try {
      const session = await startScreenRecording();
      recordingRef.current = session;
      setRecording(true);
      setStage("recording");
      const file = await session.done;
      recordingRef.current = null;
      setRecording(false);
      await onFile(file);
    } catch (caught) {
      recordingRef.current = null;
      setRecording(false);
      setStage("");
      if (caught instanceof DOMException && caught.name === "NotAllowedError") {
        return;
      }
      setError(caught instanceof Error ? caught.message : "recording failed");
    }
  }

  function onStopRecording() {
    recordingRef.current?.stop();
  }

  const uploading = stage === "uploading";

  return (
    <div className="relative flex items-center gap-3">
      {stage ? <span className="text-[0.85rem] text-muted">{stage}</span> : null}
      {error ? <span className="text-[0.85rem] text-danger">{error}</span> : null}
      {recording ? (
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-0 bg-danger px-3.5 py-2 font-semibold text-white"
          type="button"
          onClick={onStopRecording}
        >
          Stop
        </button>
      ) : (
        <div className="relative" ref={captureRef}>
          <div className="inline-flex overflow-hidden rounded-[10px]">
            <button
              aria-busy={uploading}
              className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-accent px-3.5 py-2 font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-accent"
              disabled={uploading}
              type="button"
              onClick={onRecord}
            >
              {uploading ? <Spinner /> : <CameraIcon />}
              Capture
            </button>
            <button
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label="Upload video"
              className="inline-flex cursor-pointer items-center border-0 border-l border-white/25 bg-accent px-2 text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-accent"
              disabled={uploading}
              type="button"
              onClick={() => setOpen((value) => !value)}
            >
              <ChevronIcon />
            </button>
          </div>
          {open ? (
            <div className="absolute top-[calc(100%+0.4rem)] right-0 z-10 min-w-45 rounded-xl border border-line bg-paper p-1.5 shadow-[0_10px_30px_rgba(16,18,27,0.1)]">
              <button
                className="block w-full cursor-pointer rounded-lg border-0 bg-transparent px-2.5 py-2 text-left hover:bg-nav"
                type="button"
                onClick={() => {
                  setOpen(false);
                  inputRef.current?.click();
                }}
              >
                Upload video
              </button>
            </div>
          ) : null}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-m4v,.mp4,.webm,.mov,.mkv,.m4v"
        hidden
        disabled={uploading}
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
