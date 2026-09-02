import {
  toPublicMeeting,
  type Meeting,
  type MeetingListPage,
  type TranscriptChunk,
} from "@lib/meetings";

export async function listMeetings(page: number, limit: number): Promise<MeetingListPage> {
  const res = await fetch(`/api/meetings?page=${page}&limit=${limit}`);
  if (!res.ok) {
    throw new Error("could not load meetings");
  }
  const body: MeetingListPage = await res.json();
  return body;
}

export async function getMeeting(id: string): Promise<Meeting> {
  const res = await fetch(`/api/meetings/${id}`);
  if (res.status === 404) {
    throw new Error("meeting not found");
  }
  if (!res.ok) {
    throw new Error("could not load meeting");
  }
  const meeting: Meeting = await res.json();
  return meeting;
}

export async function getTranscripts(id: string): Promise<TranscriptChunk[]> {
  const res = await fetch(`/api/meetings/${id}/transcripts`);
  if (!res.ok) {
    throw new Error("could not load transcript");
  }
  const chunks: TranscriptChunk[] = await res.json();
  return chunks;
}

export async function uploadVideo(file: File): Promise<Meeting> {
  const res = await fetch(`/api/meetings/upload?filename=${encodeURIComponent(file.name)}`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  const body: Meeting & { error?: string } = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "upload failed");
  }
  return toPublicMeeting(body);
}
