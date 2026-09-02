import "server-only";

import { auth } from "@clerk/nextjs/server";
import {
  parsePublicMeeting,
  toPublicMeeting,
  type Meeting,
  type MeetingListFilter,
  type MeetingListPage,
  type MeetingTask,
  type TaskStatus,
  type TranscriptChunk,
} from "@lib/meetings";
import { parseActionGroup, type ActionListPage, type ActionStatusFilter } from "@lib/actions";

type BackendInit = RequestInit & { duplex?: "half" };

export function backendUrl(path: string) {
  const base = (process.env.API_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export async function backendFetch(path: string, init?: BackendInit): Promise<Response> {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    throw new Error("unauthorized");
  }
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return await fetch(backendUrl(path), { ...init, headers });
}

export async function listMeetings(
  page: number,
  limit: number,
  status: MeetingListFilter = "all",
): Promise<MeetingListPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status !== "all") {
    params.set("status", status);
  }
  const res = await backendFetch(`/meetings?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("could not load meetings");
  }
  const body: MeetingListPage = await res.json();
  return {
    ...body,
    items: body.items.map((item) => toPublicMeeting(parsePublicMeeting(item))),
  };
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  const res = await backendFetch(`/meetings/${id}`, { cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("could not load meeting");
  }
  const meeting: Meeting = await res.json();
  return toPublicMeeting(parsePublicMeeting(meeting));
}

export async function proxyUpload(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const filename = incoming.searchParams.get("filename") ?? "video";
  const name = incoming.searchParams.get("name") ?? filename;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  const init: BackendInit = {
    method: "POST",
    headers,
    body: request.body,
    duplex: "half",
  };
  const res = await backendFetch(
    `/meetings/upload?filename=${encodeURIComponent(filename)}&name=${encodeURIComponent(name)}`,
    init,
  );
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}

const UI_MESSAGE_STREAM_HEADER = "x-vercel-ai-ui-message-stream";

export async function proxyAskFred(request: Request): Promise<Response> {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  const uiStream = request.headers.get(UI_MESSAGE_STREAM_HEADER);
  if (uiStream) {
    headers.set(UI_MESSAGE_STREAM_HEADER, uiStream);
  }
  const init: BackendInit = {
    method: "POST",
    headers,
    body: request.body,
    duplex: "half",
  };
  const res = await backendFetch("/ask-fred", init);
  const out = new Headers();
  out.set("Content-Type", res.headers.get("Content-Type") ?? "text/event-stream");
  const responseStream = res.headers.get(UI_MESSAGE_STREAM_HEADER);
  if (responseStream) {
    out.set(UI_MESSAGE_STREAM_HEADER, responseStream);
  }
  return new Response(res.body, {
    status: res.status,
    headers: out,
  });
}

export async function getTranscripts(id: string): Promise<TranscriptChunk[]> {
  const res = await backendFetch(`/meetings/${id}/transcripts`, { cache: "no-store" });
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
  const res = await backendFetch(`/actions?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("could not load tasks");
  }
  const body: ActionListPage = await res.json();
  return {
    ...body,
    items: body.items.map(parseActionGroup),
  };
}

export async function patchTask(
  meetingId: string,
  taskId: string,
  status: TaskStatus,
): Promise<MeetingTask> {
  const res = await backendFetch(`/meetings/${meetingId}/tasks/${taskId}`, {
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

export async function proxyStoredObject(path: string, fallbackType: string): Promise<Response> {
  const res = await backendFetch(path, { cache: "no-store" });
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? fallbackType,
    },
  });
}
