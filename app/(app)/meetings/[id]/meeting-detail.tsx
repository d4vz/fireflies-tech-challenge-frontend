"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Clip } from "@components/clip";
import { DetailCanvas, type TranscriptView } from "@components/detail-canvas";
import { MeetingDetailSkeleton } from "@components/skeleton";
import { StatusLabel } from "@components/status-label";
import { TaskChecklist } from "@components/task-list";
import { When } from "@components/when";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getMeeting, getTranscripts } from "@lib/api";
import { isBusy, meetingKey, transcriptsKey, type Meeting } from "@lib/meetings";

type TranscriptQueryInput = {
  chunks: { text: string }[] | undefined;
  meetingFailed: boolean;
  queryError: boolean;
};

function toTranscriptView(input: TranscriptQueryInput): TranscriptView {
  if (input.chunks) {
    if (input.chunks.length === 0) {
      return { kind: "empty" };
    }
    return { kind: "text", value: input.chunks.map((chunk) => chunk.text).join("") };
  }
  if (input.meetingFailed || input.queryError) {
    return { kind: "empty" };
  }
  return { kind: "pending" };
}

type MeetingDetailBodyProps = {
  meeting: Meeting;
};

function MeetingDetailBody(props: MeetingDetailBodyProps) {
  const meeting = props.meeting;
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
          {meeting.error ? <span className="text-danger">{meeting.error}</span> : null}
        </p>
      </div>
      <section>
        <h2 className="mb-1.5 text-base">Summary</h2>
        <p>{meeting.summary?.text || "(no summary)"}</p>
      </section>
      <section>
        <h2 className="mb-1.5 text-base">Takeaways</h2>
        <ul className="m-0 pl-[1.1rem]">
          {(meeting.summary?.takeaways ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section aria-label="Action items">
        <TaskChecklist meetingId={meeting._id} tasks={meeting.tasks ?? []} />
      </section>
    </article>
  );
}

type MeetingDetailProps = {
  id: string;
};

export function MeetingDetail(props: MeetingDetailProps) {
  const id = props.id;
  const meetingQuery = useQuery({
    queryKey: meetingKey(id),
    queryFn: () => getMeeting(id),
    enabled: Boolean(id),
    refetchInterval: (current) => {
      const status = current.state.data?.status;
      if (!status || !isBusy(status)) {
        return false;
      }
      return 2000;
    },
  });
  const transcriptsQuery = useQuery({
    queryKey: transcriptsKey(id),
    queryFn: () => getTranscripts(id),
    enabled: meetingQuery.data?.status === "ready",
  });

  if (meetingQuery.error) {
    return (
      <main className="h-full overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <p className="text-[0.85rem] text-danger">{meetingQuery.error.message}</p>
      </main>
    );
  }

  if (meetingQuery.isPending || !meetingQuery.data) {
    return <MeetingDetailSkeleton />;
  }

  const meeting = meetingQuery.data;
  const transcript = toTranscriptView({
    chunks: transcriptsQuery.data,
    meetingFailed: meeting.status === "failed",
    queryError: transcriptsQuery.isError,
  });

  return (
    <DetailCanvas meeting={meeting} transcript={transcript}>
      <MeetingDetailBody meeting={meeting} />
    </DetailCanvas>
  );
}
