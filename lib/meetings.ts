export type MeetingStatus = "queued" | "processing" | "ready" | "failed";

export type Meeting = {
  _id: string;
  sourceId: string;
  createdAt: string;
  status: MeetingStatus;
  error?: string;
  summary?: {
    text: string;
    takeaways: string[];
    actionItems: string[];
  };
  blob: {
    url: string;
    thumbnailUrl: string;
    durationInSeconds: number;
  };
};

export type TranscriptChunk = {
  index: number;
  text: string;
};

export type MeetingListPage = {
  items: Meeting[];
  total: number;
  page: number;
  limit: number;
};

export const meetingsKey = ["meetings"] as const;
export const MEETINGS_PAGE_SIZE = 5;
export const HOME_MEETINGS_LIMIT = 3;

export function meetingsListKey(page: number, limit: number) {
  return ["meetings", "list", page, limit] as const;
}

export function meetingKey(id: string) {
  return ["meetings", id] as const;
}

export function transcriptsKey(id: string) {
  return ["meetings", id, "transcripts"] as const;
}

export function parsePage(value: string | null | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return page;
}

export function parseLimit(value: string | null | undefined, fallback: number) {
  const limit = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(limit) || limit < 1) {
    return fallback;
  }
  return limit;
}

export function meetingId(meeting: Meeting) {
  return String(meeting._id);
}

export function isBusy(status: MeetingStatus) {
  return status === "queued" || status === "processing";
}

export function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toPublicMeeting(meeting: Meeting): Meeting {
  const id = meetingId(meeting);
  return {
    ...meeting,
    status: meeting.status ?? "ready",
    blob: {
      ...meeting.blob,
      url: `/api/meetings/${id}/video`,
      thumbnailUrl: `/api/meetings/${id}/thumbnail`,
    },
  };
}
