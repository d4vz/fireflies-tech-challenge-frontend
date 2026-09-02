"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MeetingsEmpty } from "@components/meetings-empty";
import { MeetingsListSkeleton } from "@components/skeleton";
import { TaskGroupCard } from "@components/task-group";
import { listActions } from "@lib/api";
import {
  ACTIONS_PAGE_SIZE,
  actionsListKey,
  tasksHref,
  type ActionStatusFilter,
} from "@lib/actions";

type TasksListProps = {
  page: number;
  status: ActionStatusFilter;
};

function FilterLink(props: {
  status: ActionStatusFilter;
  current: ActionStatusFilter;
  label: string;
}) {
  if (props.status === props.current) {
    return (
      <span className="rounded-full bg-nav px-3 py-1.5 text-sm font-semibold text-ink">
        {props.label}
      </span>
    );
  }
  return (
    <Link
      className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-wash hover:text-ink"
      href={tasksHref(props.status)}
    >
      {props.label}
    </Link>
  );
}

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

export function TasksList(props: TasksListProps) {
  const query = useQuery({
    queryKey: actionsListKey(props.page, ACTIONS_PAGE_SIZE, props.status),
    queryFn: () => listActions(props.page, ACTIONS_PAGE_SIZE, props.status),
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
  const empty = emptyCopy(props.status);

  return (
    <main className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterLink status="all" current={props.status} label="All" />
          <FilterLink status="pending" current={props.status} label="Pending" />
          <FilterLink status="completed" current={props.status} label="Completed" />
        </div>
        {total === 0 ? (
          props.status === "all" ? (
            <MeetingsEmpty />
          ) : (
            <div className="flex flex-col items-center rounded-2xl bg-paper px-6 py-12 text-center shadow-[0_1px_2px_rgba(16,18,27,0.06)] ring-1 ring-line md:py-16">
              <h2 className="mt-0 mb-0 text-[1.15rem] font-semibold tracking-tight">
                {empty.title}
              </h2>
              <p className="mt-2 mb-0 max-w-md text-[0.9rem] leading-6 text-muted-foreground">
                {empty.body}
              </p>
            </div>
          )
        ) : (
          <div className="grid max-w-190 gap-4">
            {items.map((group) => (
              <TaskGroupCard key={group.meetingId} group={group} />
            ))}
          </div>
        )}
      </div>
      {total > 0 ? (
        <nav className="flex shrink-0 items-center gap-3 border-t border-line bg-wash px-4 py-3 text-[0.85rem] md:px-8">
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
