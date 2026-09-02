export type Meeting = {
  _id: string;
  sourceId: string;
  createdAt: string;
  transcript: { text: string };
  summary: {
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

export const meetingsKey = ["meetings"] as const;

export function meetingKey(id: string) {
  return ["meetings", id] as const;
}

export function meetingId(meeting: Meeting) {
  return String(meeting._id);
}

export function toPublicMeeting(meeting: Meeting): Meeting {
  const id = meetingId(meeting);
  return {
    ...meeting,
    blob: {
      ...meeting.blob,
      url: `/api/meetings/${id}/video`,
      thumbnailUrl: `/api/meetings/${id}/thumbnail`,
    },
  };
}
