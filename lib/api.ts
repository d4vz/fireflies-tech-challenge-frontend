import {
  parsePublicMeeting,
  toPublicMeeting,
  type Meeting,
  type MeetingListPage,
  type MeetingTask,
  type TaskStatus,
  type TranscriptChunk,
} from "@lib/meetings";
import type { ActionListPage, ActionStatusFilter } from "@lib/actions";

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

export async function listActions(
  page: number,
  limit: number,
  status: ActionStatusFilter,
): Promise<ActionListPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status !== "all") {
    params.set("status", status);
  }
  const res = await fetch(`/api/actions?${params.toString()}`);
  if (!res.ok) {
    throw new Error("could not load tasks");
  }
  const body: ActionListPage = await res.json();
  return body;
}

export async function patchTask(
  meetingId: string,
  taskId: string,
  status: TaskStatus,
): Promise<MeetingTask> {
  const res = await fetch(`/api/meetings/${meetingId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (res.status === 404) {
    throw new Error("task not found");
  }
  if (!res.ok) {
    throw new Error("could not update task");
  }
  const task: MeetingTask = await res.json();
  return task;
}

export async function uploadVideo(file: File, filename = file.name): Promise<Meeting> {
  const res = await fetch(`/api/meetings/upload?filename=${encodeURIComponent(filename)}`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  const body: Meeting & { error?: string } = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "upload failed");
  }
  return toPublicMeeting(parsePublicMeeting(body));
}
