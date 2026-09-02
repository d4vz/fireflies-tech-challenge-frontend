"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { uploadVideo } from "@lib/api";
import { meetingId, meetingsKey } from "@lib/meetings";

type ShellProps = {
  children: ReactNode;
};

function HomeIcon() {
  return (
    <svg
      className="size-[18px]"
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
      className="size-[18px]"
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
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setError("");
    setOpen(false);
    setStage("uploading");
    try {
      const meeting = await uploadVideo(file, setStage);
      setStage("");
      await queryClient.invalidateQueries({ queryKey: meetingsKey });
      router.push(`/meetings/${meetingId(meeting)}`);
    } catch (caught) {
      setStage("");
      setError(caught instanceof Error ? caught.message : "upload failed");
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-[232px_1fr]">
      <aside className="flex flex-col gap-6 border-r border-line bg-paper px-3.5 py-[1.15rem]">
        <div className="flex items-center gap-2.5 px-2 py-1.5 text-ink">
          <span className="grid size-7 place-items-center rounded-full bg-[#efeaff] text-xs font-bold text-accent">
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
      <div className="grid min-w-0 grid-rows-[64px_1fr]">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-paper px-6">
          <h1 className="m-0 text-[1.05rem] font-semibold">{pageTitle(pathname)}</h1>
          <div className="relative flex items-center gap-3">
            {stage ? <span className="text-[0.85rem] text-muted">{stage}</span> : null}
            {error ? <span className="text-[0.85rem] text-danger">{error}</span> : null}
            <button
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border-0 bg-accent px-3.5 py-2 font-semibold text-white hover:bg-accent-hover"
              type="button"
              onClick={() => setOpen((value) => !value)}
            >
              <CameraIcon />
              Capture
            </button>
            {open ? (
              <div className="absolute top-[calc(100%+0.4rem)] right-0 z-10 min-w-[180px] rounded-xl border border-line bg-paper p-1.5 shadow-[0_10px_30px_rgba(16,18,27,0.1)]">
                <button
                  className="block w-full cursor-pointer rounded-lg border-0 bg-transparent px-2.5 py-2 text-left hover:bg-nav"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  Upload video
                </button>
              </div>
            ) : null}
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              hidden
              onChange={(event) => {
                onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
        </header>
        {props.children}
      </div>
    </div>
  );
}
