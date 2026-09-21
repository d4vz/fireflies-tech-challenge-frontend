"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { EmptyNote } from "@components/empty-note";
import { FilterTab } from "@components/filter-tab";
import { ListPager } from "@components/list-pager";
import { MeetingRow } from "@components/meeting-row";
import { MeetingsEmpty } from "@components/meetings-empty";
import { MeetingsListSkeleton } from "@components/skeleton";
import {
  meetingsHref,
  MEETINGS_PAGE_SIZE,
  type MeetingListFilter,
  type MeetingListPage,
} from "@lib/meetings";
import { meetingsListQuery } from "@lib/query-policy";

type MeetingsListProps = {
  page: number;
  status: MeetingListFilter;
  q: string;
};

type EmptyCopy = {
  title: string;
  body: string;
};

function emptyCopy(status: MeetingListFilter, q: string): EmptyCopy | null {
  if (q !== "") {
    return {
      title: "No matching meetings",
      body: "Try another title or summary word.",
    };
  }
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
  q: string;
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
    const empty = emptyCopy(props.status, props.q);
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
  const router = useRouter();
  const [draft, setDraft] = useState(props.q);
  const query = useQuery({
    ...meetingsListQuery(props.page, MEETINGS_PAGE_SIZE, props.status, props.q),
  });
  const page = query.data;
  const pageCount = page === undefined ? 1 : Math.max(1, Math.ceil(page.total / page.limit));

  useEffect(() => {
    setDraft(props.q);
  }, [props.q]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = draft.trim();
    router.push(meetingsHref(props.status, 1, q));
  }

  return (
    <main className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <form className="mb-5 max-w-md" onSubmit={onSearch}>
          <Input
            aria-label="Search meetings"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search titles and summaries"
            type="search"
            value={draft}
          />
        </form>
        <div className="mb-6 flex gap-6 border-b border-line">
          <FilterTab
            active={props.status === "all"}
            href={meetingsHref("all", 1, props.q)}
            label="All"
          />
          <FilterTab
            active={props.status === "ready"}
            href={meetingsHref("ready", 1, props.q)}
            label="Ready"
          />
          <FilterTab
            active={props.status === "processing"}
            href={meetingsHref("processing", 1, props.q)}
            label="Processing"
          />
          <FilterTab
            active={props.status === "failed"}
            href={meetingsHref("failed", 1, props.q)}
            label="Failed"
          />
        </div>
        <MeetingsResults error={query.error} page={page} q={props.q} status={props.status} />
      </div>
      {page !== undefined && page.total > 0 ? (
        <ListPager
          page={props.page}
          pageCount={pageCount}
          prevHref={meetingsHref(props.status, props.page - 1, props.q)}
          nextHref={meetingsHref(props.status, props.page + 1, props.q)}
        />
      ) : null}
    </main>
  );
}
