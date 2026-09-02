"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { uploadVideo } from "@lib/api";
import { meetingsKey } from "@lib/meetings";
import { startScreenRecording, type ScreenRecording } from "@lib/screen-record";

type ShellProps = {
  children: ReactNode;
};

function HomeIcon() {
  return (
    <svg
      className="size-4.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function MeetingsIcon() {
  return (
    <svg
      className="size-4.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 3v4M16 3v4M4 11h16" />
    </svg>
  );
}

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

function pageTitle(pathname: string) {
  if (pathname.startsWith("/meetings")) {
    return "Meetings";
  }
  return "Home";
}

function navClass(active: boolean) {
  if (active) {
    return "flex items-center gap-2.5 rounded-[10px] bg-nav px-2.5 py-2 font-semibold text-ink";
  }
  return "flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-gray-600";
}

export function Shell(props: ShellProps) {
  const pathname = usePathname();
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

  return (
    <div className="grid h-screen grid-cols-[232px_1fr] overflow-hidden">
      <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto border-r border-line bg-paper px-3.5 py-[1.15rem]">
        <div className="flex items-center gap-2.5 px-2 py-1.5 text-ink">
          <span className="grid size-7 place-items-center rounded-full bg-process-wash text-xs font-bold text-accent">
            D
          </span>
          <span className="text-[0.95rem] font-semibold">Davi</span>
        </div>
        <nav className="grid gap-0.5">
          <Link
            href="/"
            className={navClass(pathname === "/")}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <HomeIcon />
            Home
          </Link>
          <Link
            href="/meetings"
            className={navClass(pathname.startsWith("/meetings"))}
            aria-current={pathname.startsWith("/meetings") ? "page" : undefined}
          >
            <MeetingsIcon />
            Meetings
          </Link>
        </nav>
      </aside>
      <div className="grid min-h-0 min-w-0 grid-rows-[64px_1fr]">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-paper px-6">
          <h1 className="m-0 text-[1.05rem] font-semibold">{pageTitle(pathname)}</h1>
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
                    className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-accent px-3.5 py-2 font-semibold text-white hover:bg-accent-hover"
                    type="button"
                    onClick={onRecord}
                  >
                    <CameraIcon />
                    Capture
                  </button>
                  <button
                    aria-expanded={open}
                    aria-haspopup="menu"
                    aria-label="Upload video"
                    className="inline-flex cursor-pointer items-center border-0 border-l border-white/25 bg-accent px-2 text-white hover:bg-accent-hover"
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
              onChange={(event) => {
                onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
        </header>
        <div className="min-h-0 overflow-hidden">{props.children}</div>
      </div>
    </div>
  );
}
