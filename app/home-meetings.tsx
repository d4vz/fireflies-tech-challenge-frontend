"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StatusLabel } from "@components/status-label";
import { HomeMeetingsSkeleton } from "@components/skeleton";
import { Thumb } from "@components/thumb";
import { When } from "@components/when";
import { listMeetings } from "@lib/api";
import { HOME_MEETINGS_LIMIT, isBusy, meetingId, meetingsListKey } from "@lib/meetings";

export function HomeMeetings() {
  const query = useQuery({
    queryKey: meetingsListKey(1, HOME_MEETINGS_LIMIT),
    queryFn: () => listMeetings(1, HOME_MEETINGS_LIMIT),
    refetchInterval: (current) => {
      const items = current.state.data?.items;
      if (!items) {
        return false;
      }
      return items.some((meeting) => isBusy(meeting.status)) ? 2000 : false;
    },
  });

  if (query.error) {
    return <p className="text-[0.85rem] text-danger">{query.error.message}</p>;
  }

  if (query.isPending || !query.data) {
    return <HomeMeetingsSkeleton />;
  }

  if (query.data.items.length === 0) {
    return (
      <p className="mt-1 text-[0.85rem] text-muted">No meetings yet. Capture a video to start.</p>
    );
  }

  return (
    <div className="grid max-w-240 grid-cols-3 gap-4">
      {query.data.items.map((meeting) => {
        const id = meetingId(meeting);
        return (
          <Link
            className="overflow-hidden rounded-[14px] bg-paper shadow-[0_1px_2px_rgba(16,18,27,0.06)] hover:shadow-[0_8px_24px_rgba(16,18,27,0.08)]"
            href={`/meetings/${id}`}
            key={id}
          >
            <div className="aspect-video overflow-hidden bg-neutral-200">
              <Thumb
                className="pointer-events-none size-full object-cover"
                src={meeting.blob.thumbnailUrl}
              />
            </div>
            <div className="grid gap-1.5 p-3.5">
              <h3 className="m-0 truncate text-[0.9rem] font-semibold">{meeting.sourceId}</h3>
              {meeting.summary?.text ? (
                <p className="m-0 line-clamp-3 text-[0.8rem] leading-5 text-muted">
                  {meeting.summary.text}
                </p>
              ) : null}
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <StatusLabel status={meeting.status} />
                <When className="text-[0.8rem] text-muted" value={meeting.createdAt} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
