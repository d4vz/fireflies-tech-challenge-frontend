"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StatusLabel } from "@components/status-label";
import { Thumb } from "@components/thumb";
import { When } from "@components/when";
import { listMeetings } from "@lib/api";
import { isBusy, meetingId, meetingsListKey, MEETINGS_PAGE_SIZE } from "@lib/meetings";

type MeetingsListProps = {
  page: number;
};

export function MeetingsList(props: MeetingsListProps) {
  const page = props.page;
  const query = useQuery({
    queryKey: meetingsListKey(page, MEETINGS_PAGE_SIZE),
    queryFn: () => listMeetings(page, MEETINGS_PAGE_SIZE),
    refetchInterval: (current) => {
      const items = current.state.data?.items;
      if (!items) {
        return false;
      }
      return items.some((meeting) => isBusy(meeting.status)) ? 2000 : false;
    },
  });

  if (query.error) {
    return (
      <main className="px-8 pt-8 pb-12">
        <p className="text-[0.85rem] text-danger">{query.error.message}</p>
      </main>
    );
  }

  if (query.isPending || !query.data) {
    return (
      <main className="px-8 pt-8 pb-12">
        <p className="mt-1 text-[0.85rem] text-muted">Loading…</p>
      </main>
    );
  }

  const { items, total, limit } = query.data;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  if (total === 0) {
    return (
      <main className="px-8 pt-8 pb-12">
        <p className="mt-1 text-[0.85rem] text-muted">No meetings yet. Capture a video to start.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col px-8 pt-8 pb-6">
      <div className="grid max-w-[760px] gap-3">
        {items.map((meeting) => {
          const id = meetingId(meeting);
          return (
            <Link
              className="grid grid-cols-[240px_1fr] items-start gap-4 rounded-xl px-2.5 py-2.5 hover:bg-paper hover:shadow-[0_1px_2px_rgba(16,18,27,0.06)]"
              href={`/meetings/${id}`}
              key={id}
            >
              <div className="aspect-video overflow-hidden rounded-[14px] bg-neutral-200">
                <Thumb
                  className="pointer-events-none size-full object-cover"
                  src={meeting.blob.thumbnailUrl}
                />
              </div>
              <div className="grid min-w-0 gap-1.5 pt-0.5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="m-0 text-[0.95rem] font-semibold">{meeting.sourceId}</h2>
                  <StatusLabel status={meeting.status} />
                </div>
                {meeting.summary?.text ? (
                  <p className="m-0 line-clamp-3 text-[0.85rem] leading-5 text-muted">
                    {meeting.summary.text}
                  </p>
                ) : null}
                <When className="text-[0.8rem] text-muted" value={meeting.createdAt} />
              </div>
            </Link>
          );
        })}
      </div>
      {total > 0 ? (
        <nav className="mt-auto flex items-center gap-3 pt-6 text-[0.85rem]">
          {page > 1 ? (
            <Link
              className="font-semibold text-accent"
              href={page === 2 ? "/meetings" : `/meetings?page=${page - 1}`}
            >
              Previous
            </Link>
          ) : (
            <span className="text-muted">Previous</span>
          )}
          <span className="text-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link className="font-semibold text-accent" href={`/meetings?page=${page + 1}`}>
              Next
            </Link>
          ) : (
            <span className="text-muted">Next</span>
          )}
        </nav>
      ) : null}
    </main>
  );
}
