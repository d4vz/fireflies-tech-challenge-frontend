"use client";

import { useQuery } from "@tanstack/react-query";
import { StatusLabel } from "@components/status-label";
import { Thumb } from "@components/thumb";
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
  transcript: string;
};

function MeetingDetailBody(props: MeetingDetailBodyProps) {
  const meeting = props.meeting;
  return (
    <article className="grid max-w-[760px] gap-5">
      <div className="w-min max-w-[420px] min-w-[220px] overflow-hidden rounded-[14px] bg-neutral-200">
        <Thumb className="block w-full" src={meeting.blob.thumbnailUrl} />
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
      <section>
        <h2 className="mb-1.5 text-base">Transcript</h2>
        <pre className="m-0 font-sans whitespace-pre-wrap text-gray-700">{props.transcript}</pre>
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
      <main className="px-8 pt-8 pb-12">
        <p className="text-[0.85rem] text-danger">{meetingQuery.error.message}</p>
      </main>
    );
  }

  if (meetingQuery.isPending || !meetingQuery.data) {
    return (
      <main className="px-8 pt-8 pb-12">
        <p className="mt-1 text-[0.85rem] text-muted">Loading…</p>
      </main>
    );
  }

  const transcript = transcriptsQuery.data
    ? transcriptText(transcriptsQuery.data)
    : isBusy(meetingQuery.data.status)
      ? "Processing…"
      : "(empty transcript)";

  return (
    <main className="px-8 pt-8 pb-12">
      <MeetingDetailBody meeting={meetingQuery.data} transcript={transcript} />
    </main>
  );
}
