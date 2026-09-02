import "server-only";

import {
  toPublicMeeting,
  type Meeting,
  type MeetingListPage,
  type TranscriptChunk,
} from "@lib/meetings";

type StreamProxyInit = RequestInit & { duplex: "half" };

export function backendUrl(path: string) {
  const base = (process.env.API_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export async function listMeetingsFromBackend(
  page: number,
  limit: number,
): Promise<MeetingListPage> {
  const res = await fetch(backendUrl(`/meetings?page=${page}&limit=${limit}`), {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("could not load meetings");
  }
  const body: MeetingListPage = await res.json();
  return {
    ...body,
    items: body.items.map(toPublicMeeting),
  };
}

export async function getMeetingFromBackend(id: string): Promise<Meeting | null> {
  const res = await fetch(backendUrl(`/meetings/${id}`), { cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("could not load meeting");
  }
  const meeting: Meeting = await res.json();
  return toPublicMeeting(meeting);
}

export async function proxyUpload(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const filename = incoming.searchParams.get("filename") ?? "video";
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  const init: StreamProxyInit = {
    method: "POST",
    headers,
    body: request.body,
    duplex: "half",
  };
  const res = await fetch(
    backendUrl(`/meetings/upload?filename=${encodeURIComponent(filename)}`),
    init,
  );
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function getTranscriptsFromBackend(id: string): Promise<TranscriptChunk[]> {
  const res = await fetch(backendUrl(`/meetings/${id}/transcripts`), { cache: "no-store" });
  if (!res.ok) {
    throw new Error("could not load transcript");
  }
  const chunks: TranscriptChunk[] = await res.json();
  return chunks;
}

export async function proxyStoredObject(path: string, fallbackType: string): Promise<Response> {
  const res = await fetch(backendUrl(path), { cache: "no-store" });
  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? fallbackType,
    },
  });
}
