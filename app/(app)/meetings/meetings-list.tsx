"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyNote } from "@components/empty-note";
import { FilterTab } from "@components/filter-tab";
import { ListPager } from "@components/list-pager";
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
    return (
      <Alert variant="destructive">
        <AlertDescription>{props.error.message}</AlertDescription>
      </Alert>
    );
  }
  if (props.page === undefined) {
    return <MeetingsListSkeleton />;
  }
  if (props.page.total === 0) {
    const empty = emptyCopy(props.status);
    if (empty === null) {
      return <MeetingsEmpty />;
    }
    return <EmptyNote title={empty.title} body={empty.body} />;
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
        <ListPager
          page={props.page}
          pageCount={pageCount}
          prevHref={meetingsHref(props.status, props.page - 1)}
          nextHref={meetingsHref(props.status, props.page + 1)}
        />
      ) : null}
    </main>
  );
}
