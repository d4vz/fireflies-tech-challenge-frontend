"use client";

import Link from "next/link";
import { ChevronRight, Mic } from "@animateicons/react/lucide";
import type { IconHandle } from "@animateicons/react";
import { StatusLabel } from "@components/status-label";
import { Thumb } from "@components/thumb";
import { When } from "@components/when";
import { handleHover } from "@lib/handle-hover";
import { meetingId, type Meeting } from "@lib/meetings";
import { useRef } from "react";

export type MeetingRowLayout = "row" | "card";

export type MeetingRowProps = {
  meeting: Meeting;
  layout?: MeetingRowLayout;
};

function rowClass(layout: MeetingRowLayout): string {
  switch (layout) {
    case "card":
      return "grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 md:grid-cols-1 md:items-stretch";
    case "row":
      return "grid min-w-0 items-start gap-3 rounded-xl px-2.5 py-2.5 hover:bg-paper hover:shadow-[0_1px_2px_rgba(16,18,27,0.06)] max-lg:grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_auto]";
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}

function MeetingPreview(props: { blob: Meeting["blob"] }) {
  switch (props.blob.kind) {
    case "video":
      return (
        <Thumb
          className="pointer-events-none size-full object-cover"
          src={props.blob.thumbnailUrl}
        />
      );
    case "audio":
      return (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Mic aria-hidden="true" size={20} />
          <span className="sr-only">Audio recording</span>
        </div>
      );
    default: {
      const _exhaustive: never = props.blob;
      return _exhaustive;
    }
  }
}

export function MeetingRow(props: MeetingRowProps) {
  const meeting = props.meeting;
  const layout = props.layout ?? "row";
  const id = meetingId(meeting);
  const compactMobile = layout === "card";
  const iconRef = useRef<IconHandle>(null);
  return (
    <Link
      className={rowClass(layout)}
      href={`/meetings/${id}`}
      onMouseEnter={(event) => handleHover(event, iconRef)}
      onMouseLeave={(event) => handleHover(event, iconRef)}
    >
      <div
        className={
          compactMobile
            ? "max-md:size-16 min-w-0 overflow-hidden rounded-[10px] bg-neutral-200 md:aspect-video md:size-auto md:rounded-[14px]"
            : "aspect-video min-w-0 overflow-hidden rounded-[14px] bg-neutral-200"
        }
      >
        <MeetingPreview blob={meeting.blob} />
      </div>
      <div className="grid min-w-0 gap-1.5 pt-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="m-0 truncate text-[0.95rem] font-semibold">{meeting.sourceId}</h2>
          <span className={compactMobile ? "max-md:hidden" : undefined}>
            <StatusLabel status={meeting.status} />
          </span>
        </div>
        {meeting.summary?.text ? (
          <p
            className={`m-0 line-clamp-3 text-[0.85rem] leading-5 text-muted-foreground${compactMobile ? " max-md:hidden" : ""}`}
          >
            {meeting.summary.text}
          </p>
        ) : null}
        <When className="text-[0.8rem] text-muted-foreground" value={meeting.createdAt} />
      </div>
      {layout === "row" ? (
        <ChevronRight
          ref={iconRef}
          className="hidden size-5 shrink-0 self-center text-muted-foreground lg:block"
          size={20}
        />
      ) : null}
    </Link>
  );
}
