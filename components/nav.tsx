"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

function navClass(active: boolean) {
  if (active) {
    return "flex items-center gap-2.5 rounded-[10px] bg-nav px-2.5 py-2 font-semibold text-ink";
  }
  return "flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-gray-600";
}

export function Nav() {
  const pathname = usePathname();
  return (
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
  );
}

export function PageTitle() {
  const pathname = usePathname();
  return (
    <h1 className="m-0 text-[1.05rem] font-semibold">
      {pathname.startsWith("/meetings") ? "Meetings" : "Home"}
    </h1>
  );
}
