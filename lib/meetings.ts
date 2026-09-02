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
  blob:
    | {
        kind: "video";
        url: string;
        thumbnailUrl: string;
        durationInSeconds: number;
      }
    | {
        kind: "audio";
        url: string;
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
export const HOME_DASHBOARD_LIMIT = 20;

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
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type StoredPublicBlob = {
  kind?: "video" | "audio";
  url: string;
  durationInSeconds: number;
  thumbnailUrl?: string;
};

type StoredPublicMeeting = {
  _id: string;
  sourceId: string;
  createdAt: string;
  status?: MeetingStatus;
  error?: string;
  summary?: Meeting["summary"];
  blob: StoredPublicBlob;
};

function parsePublicBlob(raw: StoredPublicBlob): Meeting["blob"] {
  if (raw.kind === "audio") {
    return { kind: "audio", url: raw.url, durationInSeconds: raw.durationInSeconds };
  }
  if (raw.thumbnailUrl === undefined) {
    throw new Error("invalid meeting blob");
  }
  return {
    kind: "video",
    url: raw.url,
    thumbnailUrl: raw.thumbnailUrl,
    durationInSeconds: raw.durationInSeconds,
  };
}

export function parsePublicMeeting(raw: StoredPublicMeeting): Meeting {
  return {
    _id: raw._id,
    sourceId: raw.sourceId,
    createdAt: raw.createdAt,
    status: raw.status ?? "ready",
    error: raw.error,
    summary: raw.summary,
    blob: parsePublicBlob(raw.blob),
  };
}

export function toPublicMeeting(meeting: Meeting): Meeting {
  const id = meetingId(meeting);
  const url = `/api/meetings/${id}/video`;
  switch (meeting.blob.kind) {
    case "video":
      return {
        ...meeting,
        blob: {
          ...meeting.blob,
          url,
          thumbnailUrl: `/api/meetings/${id}/thumbnail`,
        },
      };
    case "audio":
      return {
        ...meeting,
        blob: {
          ...meeting.blob,
          url,
        },
      };
    default: {
      const _exhaustive: never = meeting.blob;
      return _exhaustive;
    }
  }
}
