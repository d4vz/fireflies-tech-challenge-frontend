"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusLabel } from "@components/status-label";
import { Thumb } from "@components/thumb";
import { When } from "@components/when";
import { meetingId, type Meeting } from "@lib/meetings";

export type MeetingRowProps = {
  meeting: Meeting;
};

export function MeetingRow(props: MeetingRowProps) {
  const meeting = props.meeting;
  const id = meetingId(meeting);
  return (
    <Link
      className="grid items-start gap-3 rounded-xl px-2.5 py-2.5 hover:bg-paper hover:shadow-[0_1px_2px_rgba(16,18,27,0.06)] max-md:grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)_auto]"
      href={`/meetings/${id}`}
    >
      <div className="aspect-video overflow-hidden rounded-[14px] bg-neutral-200">
        <Thumb
          className="pointer-events-none size-full object-cover"
          src={meeting.blob.thumbnailUrl}
        />
      </div>
      <div className="grid min-w-0 gap-1.5 pt-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="m-0 truncate text-[0.95rem] font-semibold">{meeting.sourceId}</h2>
          <StatusLabel status={meeting.status} />
        </div>
        {meeting.summary?.text ? (
          <p className="m-0 line-clamp-3 text-[0.85rem] leading-5 text-muted">
            {meeting.summary.text}
          </p>
        ) : null}
        <When className="text-[0.8rem] text-muted" value={meeting.createdAt} />
      </div>
      <ChevronRight className="hidden size-5 shrink-0 self-center text-muted md:block" />
    </Link>
  );
}
