"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Thumb } from "@components/thumb";
import { listMeetings } from "@lib/api";
import { meetingId, meetingsKey } from "@lib/meetings";

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MeetingsList() {
  const query = useQuery({
    queryKey: meetingsKey,
    queryFn: listMeetings,
  });

  if (query.error) {
    return (
      <main className="px-8 pt-8 pb-12">
        <p className="text-[0.85rem] text-danger">{query.error.message}</p>
      </main>
    );
  }

  if (query.isPending) {
    return (
      <main className="px-8 pt-8 pb-12">
        <p className="mt-1 text-[0.85rem] text-muted">Loading…</p>
      </main>
    );
  }

  if (query.data.length === 0) {
    return (
      <main className="px-8 pt-8 pb-12">
        <p className="mt-1 text-[0.85rem] text-muted">No meetings yet. Capture a video to start.</p>
      </main>
    );
  }

  return (
    <main className="px-8 pt-8 pb-12">
      <div className="grid max-w-[760px] gap-1.5">
        {query.data.map((meeting) => {
          const id = meetingId(meeting);
          return (
            <Link
              className="grid grid-cols-[56px_1fr] items-center gap-3.5 rounded-xl px-2.5 py-2.5 hover:bg-paper hover:shadow-[0_1px_2px_rgba(16,18,27,0.06)]"
              href={`/meetings/${id}`}
              key={id}
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-[10px] bg-neutral-200">
                <Thumb
                  className="pointer-events-none size-full object-cover"
                  src={meeting.blob.thumbnailUrl}
                />
              </div>
              <div>
                <h2 className="m-0 text-[0.95rem] font-semibold">{meeting.sourceId}</h2>
                <p className="mt-0.5 text-[0.85rem] text-muted">{formatWhen(meeting.createdAt)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
