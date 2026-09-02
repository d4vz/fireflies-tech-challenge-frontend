"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MeetingRow } from "@components/meeting-row";
import { MeetingsListSkeleton } from "@components/skeleton";
import { listMeetings } from "@lib/api";
import { isBusy, meetingsListKey, MEETINGS_PAGE_SIZE } from "@lib/meetings";

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
      <main className="h-full overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <p className="text-[0.85rem] text-danger">{query.error.message}</p>
      </main>
    );
  }

  if (query.isPending || !query.data) {
    return <MeetingsListSkeleton />;
  }

  const { items, total, limit } = query.data;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  if (total === 0) {
    return (
      <main className="h-full overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <p className="mt-1 text-[0.85rem] text-muted-foreground">
          No meetings yet. Capture or upload a file to start.
        </p>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-8 md:px-8">
        <div className="grid max-w-190 gap-3">
          {items.map((meeting) => (
            <MeetingRow key={meeting._id} meeting={meeting} />
          ))}
        </div>
      </div>
      <nav className="flex shrink-0 items-center gap-3 border-t border-line bg-wash px-4 py-3 text-[0.85rem] md:px-8">
        {page > 1 ? (
          <Link
            className="font-semibold text-accent"
            href={page === 2 ? "/meetings" : `/meetings?page=${page - 1}`}
          >
            Previous
          </Link>
        ) : (
          <span className="text-muted-foreground">Previous</span>
        )}
        <span className="text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        {page < pageCount ? (
          <Link className="font-semibold text-accent" href={`/meetings?page=${page + 1}`}>
            Next
          </Link>
        ) : (
          <span className="text-muted-foreground">Next</span>
        )}
      </nav>
    </main>
  );
}
