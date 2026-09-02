import { isBusy, type MeetingStatus, type MeetingTask } from "@lib/meetings";

export type MeetingNotesView =
  | { kind: "pending" }
  | { kind: "ready"; summaryText: string | undefined; tasks: MeetingTask[] };

type MeetingNotesInput = {
  status: MeetingStatus;
  summary?: { text: string };
  tasks?: MeetingTask[];
};

export function toMeetingNotesView(meeting: MeetingNotesInput): MeetingNotesView {
  if (isBusy(meeting.status)) {
    return { kind: "pending" };
  }
  return {
    kind: "ready",
    summaryText: meeting.summary?.text,
    tasks: meeting.tasks ?? [],
  };
}
