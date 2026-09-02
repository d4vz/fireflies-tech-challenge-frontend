"use client";

import Link from "next/link";
import { Mic } from "@animateicons/react/lucide";
import { TaskChecklist } from "@components/task-list";
import { Thumb } from "@components/thumb";
import { When } from "@components/when";
import { taskCountLabel, type ActionGroup } from "@lib/actions";

function PreviewMedia(props: { group: ActionGroup }) {
  switch (props.group.mediaKind) {
    case "video":
      return (
        <Thumb
          className="size-full object-cover"
          src={`/api/meetings/${props.group.meetingId}/thumbnail`}
        />
      );
    case "audio":
      return (
        <span className="grid size-full place-items-center text-muted-foreground">
          <Mic aria-hidden="true" size={14} />
          <span className="sr-only">Audio recording</span>
        </span>
      );
    default: {
      const _exhaustive: never = props.group.mediaKind;
      return _exhaustive;
    }
  }
}

function GroupPreview(props: { group: ActionGroup }) {
  return (
    <div className="relative aspect-video h-8 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
      <PreviewMedia group={props.group} />
    </div>
  );
}

export function TaskGroupCard(props: { group: ActionGroup; clampLines?: 2 }) {
  const group = props.group;
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-paper shadow-[0_1px_2px_rgba(16,18,27,0.06)] ring-1 ring-line">
      <header className="flex min-w-0 items-center gap-3 px-5 py-3.5">
        <GroupPreview group={group} />
        <h2 className="m-0 min-w-0 flex-1 truncate text-[0.95rem] font-semibold">
          <Link className="text-ink no-underline hover:text-accent" href={group.href}>
            {group.name}
          </Link>
        </h2>
        <When
          className="hidden shrink-0 text-[0.8rem] text-muted-foreground sm:block"
          value={group.createdAt}
        />
        <span className="shrink-0 text-[0.8rem] text-muted-foreground">
          {taskCountLabel(group.tasks.length)}
        </span>
      </header>
      <div className="border-t border-line">
        <TaskChecklist
          clampLines={props.clampLines}
          inset
          meetingId={group.meetingId}
          tasks={group.tasks}
        />
      </div>
    </section>
  );
}
