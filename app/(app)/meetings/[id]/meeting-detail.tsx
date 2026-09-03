"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Clip } from "@components/clip";
import { DetailCanvas } from "@components/detail-canvas";
import { MeetingDetailSkeleton, MeetingTasksSkeleton, SummarySkeleton } from "@components/skeleton";
import { StatusLabel } from "@components/status-label";
import { TaskChecklist } from "@components/task-list";
import { When } from "@components/when";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { type Meeting, type MeetingTask } from "@lib/meetings";
import { toMeetingNotesView, type MeetingNotesView } from "@lib/meeting-notes-view";
import { meetingQuery, transcriptsQuery } from "@lib/query-policy";
import { toTranscriptView } from "@lib/transcript-view";

type MeetingDetailBodyProps = {
  meeting: Meeting;
};

function MeetingDetailBody(props: MeetingDetailBodyProps) {
  const meeting = props.meeting;
  const notes = toMeetingNotesView(meeting);
  return (
    <article className="grid gap-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/meetings">Meetings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[min(100%,24rem)] truncate">
              {meeting.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="overflow-hidden rounded-[14px] bg-neutral-200">
        <Clip blob={meeting.blob} className="block w-full" />
      </div>
      <div>
        <h1 className="m-0 break-words text-[1.35rem] md:text-[1.6rem]">{meeting.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.85rem] text-muted-foreground">
          <When value={meeting.createdAt} />
          <StatusLabel status={meeting.status} />
        </p>
        {meeting.error ? (
          <Alert className="mt-3" variant="destructive">
            <AlertDescription>{meeting.error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
      <NotesBlock meetingId={meeting._id} notes={notes} />
    </article>
  );
}

function NotesBlock(props: { meetingId: string; notes: MeetingNotesView }) {
  switch (props.notes.kind) {
    case "pending":
      return (
        <>
          <section>
            <h2 className="mb-1.5 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
              Summary
            </h2>
            <SummarySkeleton />
          </section>
          <MeetingTasksSkeleton />
        </>
      );
    case "ready":
      return (
        <>
          <section>
            <h2 className="mb-1.5 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
              Summary
            </h2>
            {props.notes.summaryText ? (
              <p className="leading-7">{props.notes.summaryText}</p>
            ) : (
              <p className="text-muted-foreground italic leading-7">(no summary)</p>
            )}
          </section>
          <ReadyTasks meetingId={props.meetingId} tasks={props.notes.tasks} />
        </>
      );
    default: {
      const _exhaustive: never = props.notes;
      return _exhaustive;
    }
  }
}

function ReadyTasks(props: { meetingId: string; tasks: MeetingTask[] }) {
  const tasks = props.tasks;
  if (tasks.length === 0) {
    return null;
  }
  const completed = tasks.filter((task) => task.status === "completed").length;
  const progress = (completed / tasks.length) * 100;
  return (
    <section className="surface-card min-w-0 overflow-hidden">
      <header className="flex min-w-0 items-center justify-between gap-3 px-5 py-3.5">
        <h2 className="m-0 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
          Tasks
        </h2>
        <span className="shrink-0 text-[0.8rem] text-muted-foreground">
          {completed}/{tasks.length}
        </span>
      </header>
      <div className="h-0.5 bg-line" aria-hidden="true">
        <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
      </div>
      <div className="border-t border-line">
        <TaskChecklist inset meetingId={props.meetingId} tasks={tasks} />
      </div>
    </section>
  );
}

type MeetingDetailProps = {
  id: string;
};

export function MeetingDetail(props: MeetingDetailProps) {
  const id = props.id;
  const meetingState = useQuery(meetingQuery(id));
  const transcriptState = useQuery({
    ...transcriptsQuery(id),
    enabled: meetingState.data?.status === "ready",
  });

  if (meetingState.error) {
    return (
      <main className="h-full overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <Alert variant="destructive">
          <AlertDescription>{meetingState.error.message}</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (meetingState.isPending || !meetingState.data) {
    return <MeetingDetailSkeleton />;
  }

  const meeting = meetingState.data;
  const transcript = toTranscriptView({
    turns: transcriptState.data,
    meetingFailed: meeting.status === "failed",
    queryError: transcriptState.isError,
  });

  return (
    <DetailCanvas meeting={meeting} transcript={transcript}>
      <MeetingDetailBody meeting={meeting} />
    </DetailCanvas>
  );
}
