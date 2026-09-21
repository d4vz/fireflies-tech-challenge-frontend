"use client";

import Link from "next/link";
import { ChevronRight, Mic } from "@animateicons/react/lucide";
import type { IconHandle } from "@animateicons/react";
import { StatusLabel } from "@components/status-label";
import { SummarySkeleton } from "@components/skeleton";
import { Thumb } from "@components/thumb";
import { When } from "@components/when";
import { handleHover } from "@lib/handle-hover";
import { toMeetingNotesView } from "@lib/meeting-notes-view";
import { meetingId, type Meeting } from "@lib/meetings";
import { useRef, type Ref } from "react";

export type MeetingRowLayout = "row" | "card" | "menu";

export type MeetingRowProps = {
  meeting: Meeting;
  layout?: MeetingRowLayout;
  ref?: Ref<HTMLAnchorElement>;
};

function rowClass(layout: MeetingRowLayout): string {
  switch (layout) {
    case "card":
      return "group grid w-full min-w-0 grid-cols-1 items-start gap-3 surface-card-hover";
    case "row":
      return "grid min-w-0 items-start gap-3 rounded-xl px-2.5 py-2.5 hover:bg-paper hover:shadow-[0_1px_2px_rgba(16,18,27,0.06)] max-lg:grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_auto]";
    case "menu":
      return "group grid h-[4.5rem] w-full min-w-0 grid-cols-[8rem_minmax(0,1fr)] grid-rows-[4.5rem] items-stretch gap-3 overflow-hidden rounded-lg";
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}

function thumbClass(layout: MeetingRowLayout): string {
  switch (layout) {
    case "menu":
      return "relative aspect-video h-full w-full min-w-0 shrink-0 overflow-hidden rounded-lg bg-neutral-200";
    case "card":
    case "row":
      return "relative aspect-video w-full min-w-0 shrink-0 overflow-hidden rounded-[14px] bg-neutral-200";
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}

function copyClass(layout: MeetingRowLayout): string {
  switch (layout) {
    case "menu":
      return "grid min-h-0 min-w-0 content-center gap-1 overflow-hidden";
    case "card":
    case "row":
      return "grid min-w-0 gap-1.5 pt-0.5";
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}

function titleClass(layout: MeetingRowLayout): string {
  switch (layout) {
    case "menu":
      return "m-0 min-w-0 flex-1 text-[0.85rem] font-semibold leading-4 line-clamp-1";
    case "card":
    case "row":
      return "m-0 min-w-0 flex-1 text-[0.95rem] font-semibold leading-5 line-clamp-1";
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}

function micClass(layout: MeetingRowLayout): string {
  switch (layout) {
    case "menu":
      return "size-6";
    case "card":
    case "row":
      return "size-8 md:size-12";
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}

function MeetingPreview(props: { blob: Meeting["blob"]; layout: MeetingRowLayout }) {
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
          <Mic
            aria-hidden="true"
            className={micClass(props.layout)}
            size={props.layout === "menu" ? 24 : 32}
          />
          <span className="sr-only">Audio recording</span>
        </div>
      );
    default: {
      const _exhaustive: never = props.blob;
      return _exhaustive;
    }
  }
}

function summaryPending(layout: MeetingRowLayout) {
  switch (layout) {
    case "menu":
      return (
        <div aria-busy="true" aria-label="Loading summary" className="grid gap-1 overflow-hidden">
          <div className="h-2.5 w-full animate-pulse rounded-md bg-line" />
          <div className="h-2.5 w-4/5 animate-pulse rounded-md bg-line" />
        </div>
      );
    case "card":
    case "row":
      return (
        <div className="md:min-h-[3.75rem]">
          <SummarySkeleton />
        </div>
      );
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}

function summaryReadyClass(layout: MeetingRowLayout): string {
  switch (layout) {
    case "menu":
      return "m-0 line-clamp-2 overflow-hidden text-[0.75rem] leading-4 text-muted-foreground";
    case "card":
    case "row":
      return "m-0 line-clamp-2 text-[0.85rem] leading-5 text-muted-foreground md:min-h-[3.75rem] md:line-clamp-3";
    default: {
      const _exhaustive: never = layout;
      return _exhaustive;
    }
  }
}

function MeetingSummary(props: { meeting: Meeting; layout: MeetingRowLayout }) {
  const notes = toMeetingNotesView(props.meeting);
  switch (notes.kind) {
    case "pending":
      return summaryPending(props.layout);
    case "ready":
      return <p className={summaryReadyClass(props.layout)}>{notes.summaryText ?? ""}</p>;
    default: {
      const _exhaustive: never = notes;
      return _exhaustive;
    }
  }
}

export function MeetingRow(props: MeetingRowProps) {
  const meeting = props.meeting;
  const layout = props.layout ?? "row";
  const id = meetingId(meeting);
  const statusOnThumb = layout === "card" || layout === "menu";
  const iconRef = useRef<IconHandle>(null);
  return (
    <Link
      className={rowClass(layout)}
      href={`/meetings/${id}`}
      onMouseEnter={(event) => handleHover(event, iconRef)}
      onMouseLeave={(event) => handleHover(event, iconRef)}
      ref={props.ref}
    >
      <div className={thumbClass(layout)}>
        <div className="size-full transition-transform motion-safe:group-hover:scale-[1.03]">
          <MeetingPreview blob={meeting.blob} layout={layout} />
        </div>
        {statusOnThumb ? (
          <span className={layout === "menu" ? "absolute top-1 right-1" : "absolute top-2 right-2"}>
            <StatusLabel status={meeting.status} />
          </span>
        ) : null}
      </div>
      <div className={copyClass(layout)}>
        <div className="flex min-w-0 items-center gap-2">
          <h2 className={titleClass(layout)}>{meeting.name}</h2>
          {statusOnThumb ? null : (
            <span>
              <StatusLabel status={meeting.status} />
            </span>
          )}
        </div>
        <MeetingSummary layout={layout} meeting={meeting} />
        {layout === "menu" ? null : (
          <When className="text-[0.8rem] text-muted-foreground" value={meeting.createdAt} />
        )}
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
