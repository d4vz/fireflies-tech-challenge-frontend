"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Thumb } from "@components/thumb";
import { getMeeting } from "@lib/api";
import { meetingKey, type Meeting } from "@lib/meetings";

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

type MeetingDetailBodyProps = {
  meeting: Meeting;
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
        <p className="mt-1 text-[0.85rem] text-muted">{formatWhen(meeting.createdAt)}</p>
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
        <pre className="m-0 font-sans whitespace-pre-wrap text-gray-700">
          {meeting.transcript.text || "(empty transcript)"}
        </pre>
      </section>
    </article>
  );
}

export function MeetingDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useQuery({
    queryKey: meetingKey(id),
    queryFn: () => getMeeting(id),
    enabled: Boolean(id),
  });

  if (query.error) {
    return (
      <main className="px-8 pt-8 pb-12">
        <p className="text-[0.85rem] text-danger">{query.error.message}</p>
      </main>
    );
  }

  if (query.isPending || !query.data) {
    return (
      <main className="px-8 pt-8 pb-12">
        <p className="mt-1 text-[0.85rem] text-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="px-8 pt-8 pb-12">
      <MeetingDetailBody meeting={query.data} />
    </main>
  );
}
