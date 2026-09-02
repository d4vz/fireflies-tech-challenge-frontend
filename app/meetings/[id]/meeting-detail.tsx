"use client";

import { useQuery } from "@tanstack/react-query";
import { Clip } from "@components/clip";
import { MeetingDetailSkeleton, TranscriptSkeleton } from "@components/skeleton";
import { StatusLabel } from "@components/status-label";
import { When } from "@components/when";
import { getMeeting, getTranscripts } from "@lib/api";
import { isBusy, meetingKey, transcriptsKey, type Meeting } from "@lib/meetings";

function transcriptText(chunks: { text: string }[]) {
  if (chunks.length === 0) {
    return "(empty transcript)";
  }
  return chunks.map((chunk) => chunk.text).join("");
}

type MeetingDetailBodyProps = {
  meeting: Meeting;
};

function MeetingDetailBody(props: MeetingDetailBodyProps) {
  const meeting = props.meeting;
  return (
    <article className="grid gap-5">
      <div className="overflow-hidden rounded-[14px] bg-neutral-200">
        <Clip className="block w-full" src={meeting.blob.url} poster={meeting.blob.thumbnailUrl} />
      </div>
      <div>
        <h1 className="m-0 text-[1.6rem]">{meeting.sourceId}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.85rem] text-muted">
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
      <section>
        <h2 className="mb-1.5 text-base">Action items</h2>
        <ul className="m-0 pl-[1.1rem]">
          {(meeting.summary?.actionItems ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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
      <main className="h-full overflow-y-auto px-8 pt-8 pb-12">
        <p className="text-[0.85rem] text-danger">{meetingQuery.error.message}</p>
      </main>
    );
  }

  if (meetingQuery.isPending || !meetingQuery.data) {
    return <MeetingDetailSkeleton />;
  }

  const meeting = meetingQuery.data;
  const transcript = transcriptsQuery.data
    ? transcriptText(transcriptsQuery.data)
    : meeting.status === "failed" || transcriptsQuery.isError
      ? "(empty transcript)"
      : null;

  return (
    <main className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-h-0 overflow-y-auto px-8 pt-8 pb-12">
        <MeetingDetailBody meeting={meeting} />
      </div>
      <aside
        aria-busy={transcript ? undefined : true}
        className="min-h-0 overflow-y-auto border-l border-line bg-paper px-5 py-6"
      >
        <h2 className="m-0 mb-4 text-[0.95rem] font-semibold">Transcript</h2>
        {transcript ? (
          <div className="font-sans text-[0.9rem] leading-6 whitespace-pre-wrap text-gray-700">
            {transcript}
          </div>
        ) : (
          <TranscriptSkeleton />
        )}
      </aside>
    </main>
  );
}
