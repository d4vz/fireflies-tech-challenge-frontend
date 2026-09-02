"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FilterTab } from "@components/filter-tab";
import { TaskGroupCard } from "@components/task-group";
import { TasksListSkeleton } from "@components/skeleton";
import { listActions } from "@lib/api";
import {
  ACTIONS_PAGE_SIZE,
  actionsListKey,
  tasksHref,
  type ActionListPage,
  type ActionStatusFilter,
} from "@lib/actions";

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
    return <p className="text-[0.85rem] text-danger">{props.error.message}</p>;
  }
  if (props.page === undefined) {
    return <TasksListSkeleton />;
  }
  if (props.page.total === 0) {
    const empty = emptyCopy(props.status);
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
    <div className="grid max-w-190 gap-3">
      {props.page.items.map((group) => (
        <TaskGroupCard key={group.meetingId} group={group} />
      ))}
    </div>
  );
}

export function TasksList(props: TasksListProps) {
  const query = useQuery({
    queryKey: actionsListKey(props.page, ACTIONS_PAGE_SIZE, props.status),
    queryFn: () => listActions(props.page, ACTIONS_PAGE_SIZE, props.status),
  });
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
        <nav className="flex shrink-0 items-center justify-end gap-3 border-t border-line bg-wash px-4 py-3 text-[0.85rem] md:px-8">
          {props.page > 1 ? (
            <Link
              className="font-semibold text-accent"
              href={tasksHref(props.status, props.page - 1)}
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
              href={tasksHref(props.status, props.page + 1)}
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
