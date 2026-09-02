"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FilterTab } from "@components/filter-tab";
import { MeetingRow } from "@components/meeting-row";
import { MeetingsEmpty } from "@components/meetings-empty";
import { MeetingsListSkeleton } from "@components/skeleton";
import { listMeetings } from "@lib/api";
import {
  isBusy,
  meetingsHref,
  meetingsListKey,
  MEETINGS_PAGE_SIZE,
  type MeetingListFilter,
  type MeetingListPage,
} from "@lib/meetings";

type MeetingsListProps = {
  page: number;
  status: MeetingListFilter;
};

type EmptyCopy = {
  title: string;
  body: string;
};

function emptyCopy(status: MeetingListFilter): EmptyCopy | null {
  switch (status) {
    case "all":
      return null;
    case "ready":
      return { title: "No ready meetings", body: "They stay on All after processing finishes." };
    case "processing":
      return {
        title: "No processing meetings",
        body: "Uploads that are still working stay on All.",
      };
    case "queued":
      return { title: "No queued meetings", body: "New uploads stay on All until they start." };
    case "failed":
      return { title: "No failed meetings", body: "Failed uploads stay on All." };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function MeetingsResults(props: {
  status: MeetingListFilter;
  error: Error | null;
  page: MeetingListPage | undefined;
}) {
  if (props.error !== null) {
    return <p className="text-[0.85rem] text-danger">{props.error.message}</p>;
  }
  if (props.page === undefined) {
    return <MeetingsListSkeleton />;
  }
  if (props.page.total === 0) {
    const empty = emptyCopy(props.status);
    if (empty === null) {
      return <MeetingsEmpty />;
    }
    return (
      <div className="flex flex-col items-center rounded-2xl bg-paper px-6 py-12 text-center shadow-[0_1px_2px_rgba(16,18,27,0.06)] ring-1 ring-line md:py-16">
        <h2 className="mt-0 mb-0 text-[1.15rem] font-semibold tracking-tight">{empty.title}</h2>
        <p className="mt-2 mb-0 max-w-md text-[0.9rem] leading-6 text-muted-foreground">
          {empty.body}
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      {props.page.items.map((meeting) => (
        <MeetingRow key={meeting._id} layout="card" meeting={meeting} />
      ))}
    </div>
  );
}

export function MeetingsList(props: MeetingsListProps) {
  const query = useQuery({
    queryKey: meetingsListKey(props.page, MEETINGS_PAGE_SIZE, props.status),
    queryFn: () => listMeetings(props.page, MEETINGS_PAGE_SIZE, props.status),
    refetchInterval: (current) => {
      const items = current.state.data?.items;
      if (!items) {
        return false;
      }
      return items.some((meeting) => isBusy(meeting.status)) ? 2000 : false;
    },
  });
  const page = query.data;
  const pageCount = page === undefined ? 1 : Math.max(1, Math.ceil(page.total / page.limit));

  return (
    <main className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <div className="mb-6 flex gap-6 border-b border-line">
          <FilterTab active={props.status === "all"} href={meetingsHref("all")} label="All" />
          <FilterTab active={props.status === "ready"} href={meetingsHref("ready")} label="Ready" />
          <FilterTab
            active={props.status === "processing"}
            href={meetingsHref("processing")}
            label="Processing"
          />
          <FilterTab
            active={props.status === "failed"}
            href={meetingsHref("failed")}
            label="Failed"
          />
        </div>
        <MeetingsResults error={query.error} page={page} status={props.status} />
      </div>
      {page !== undefined && page.total > 0 ? (
        <nav className="flex shrink-0 items-center justify-end gap-3 border-t border-line bg-wash px-4 py-3 text-[0.85rem] md:px-8">
          {props.page > 1 ? (
            <Link
              className="font-semibold text-accent"
              href={meetingsHref(props.status, props.page - 1)}
            >
              Previous
            </Link>
          ) : (
            <span className="text-muted-foreground">Previous</span>
          )}
          <span className="text-muted-foreground">
            Page {props.page} of {pageCount}
          </span>
          {props.page < pageCount ? (
            <Link
              className="font-semibold text-accent"
              href={meetingsHref(props.status, props.page + 1)}
            >
              Next
            </Link>
          ) : (
            <span className="text-muted-foreground">Next</span>
          )}
        </nav>
      ) : null}
    </main>
  );
}
