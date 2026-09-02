"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyNote } from "@components/empty-note";
import { FilterTab } from "@components/filter-tab";
import { ListPager } from "@components/list-pager";
import { MeetingsEmpty } from "@components/meetings-empty";
import { TaskGroupCard } from "@components/task-group";
import { TasksListSkeleton } from "@components/skeleton";
import {
  ACTIONS_PAGE_SIZE,
  tasksHref,
  type ActionListPage,
  type ActionStatusFilter,
} from "@lib/actions";
import { actionsListQuery } from "@lib/query-policy";

type TasksListProps = {
  page: number;
  status: ActionStatusFilter;
};

type EmptyCopy = {
  title: string;
  body: string;
};

function emptyCopy(status: ActionStatusFilter): EmptyCopy {
  switch (status) {
    case "pending":
      return { title: "No pending tasks", body: "Completed items stay on All and Completed." };
    case "completed":
      return { title: "No completed tasks", body: "Check an item on a meeting or on All." };
    case "all":
      return {
        title: "No action items yet",
        body: "They appear here when a meeting is ready.",
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function TasksResults(props: {
  status: ActionStatusFilter;
  error: Error | null;
  page: ActionListPage | undefined;
}) {
  if (props.error !== null) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{props.error.message}</AlertDescription>
      </Alert>
    );
  }
  if (props.page === undefined) {
    return <TasksListSkeleton />;
  }
  if (props.page.total === 0) {
    if (props.status === "all") {
      return <MeetingsEmpty />;
    }
    const empty = emptyCopy(props.status);
    return <EmptyNote title={empty.title} body={empty.body} />;
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {props.page.items.map((group) => (
        <TaskGroupCard key={group.meetingId} group={group} />
      ))}
    </div>
  );
}

export function TasksList(props: TasksListProps) {
  const query = useQuery(actionsListQuery(props.page, ACTIONS_PAGE_SIZE, props.status));
  const page = query.data;
  const pageCount = page === undefined ? 1 : Math.max(1, Math.ceil(page.total / page.limit));

  return (
    <main className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <div className="mb-6 flex gap-6 border-b border-line">
          <FilterTab active={props.status === "all"} href={tasksHref("all")} label="All" />
          <FilterTab
            active={props.status === "pending"}
            href={tasksHref("pending")}
            label="Pending"
          />
          <FilterTab
            active={props.status === "completed"}
            href={tasksHref("completed")}
            label="Completed"
          />
        </div>
        <TasksResults error={query.error} page={page} status={props.status} />
      </div>
      {page !== undefined && page.total > 0 ? (
        <ListPager
          page={props.page}
          pageCount={pageCount}
          prevHref={tasksHref(props.status, props.page - 1)}
          nextHref={tasksHref(props.status, props.page + 1)}
        />
      ) : null}
    </main>
  );
}
