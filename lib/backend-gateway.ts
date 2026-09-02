import {
  parseActionGroup,
  type ActionListPage,
  type ActionStatusFilter,
  type StoredActionGroup,
} from "@lib/actions";
import {
  parseMeetingTask,
  parsePublicMeeting,
  toPublicMeeting,
  type Meeting,
  type MeetingListFilter,
  type MeetingListPage,
  type MeetingTask,
  type StoredPublicMeeting,
  type StoredPublicTask,
  type TaskStatus,
  type TranscriptTurn,
} from "@lib/meetings";

export type BackendInit = RequestInit & { duplex?: "half" };

export type BackendGatewayDeps = {
  fetch: (url: string, init?: BackendInit) => Promise<Response>;
  getToken: () => Promise<string | null>;
  baseUrl: string;
};

const UI_MESSAGE_STREAM_HEADER = "x-vercel-ai-ui-message-stream";

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

type StoredMeetingListPage = {
  items: StoredPublicMeeting[];
  total: number;
  page: number;
  limit: number;
};

type StoredActionListPage = {
  items: StoredActionGroup[];
  total: number;
  page: number;
  limit: number;
};

function pageQuery(page: number, limit: number, status: string): string {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status !== "all") {
    params.set("status", status);
  }
  return params.toString();
}

function proxyResponse(res: Response, fallbackType: string, extra?: Headers): Response {
  const headers = extra ?? new Headers();
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", res.headers.get("Content-Type") ?? fallbackType);
  }
  return new Response(res.body, {
    status: res.status,
    headers,
  });
}

export function createBackendGateway(deps: BackendGatewayDeps) {
  async function request(path: string, init?: BackendInit): Promise<Response> {
    const token = await deps.getToken();
    if (!token) {
      throw new Error("unauthorized");
    }
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return await deps.fetch(joinUrl(deps.baseUrl, path), { ...init, headers });
  }

  async function listMeetings(
    page: number,
    limit: number,
    status: MeetingListFilter = "all",
  ): Promise<MeetingListPage> {
    const res = await request(`/meetings?${pageQuery(page, limit, status)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("could not load meetings");
    }
    const body: StoredMeetingListPage = await res.json();
    return {
      ...body,
      items: body.items.map((item) => toPublicMeeting(parsePublicMeeting(item))),
    };
  }

  async function getMeeting(id: string): Promise<Meeting | null> {
    const res = await request(`/meetings/${id}`, { cache: "no-store" });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error("could not load meeting");
    }
    const meeting: StoredPublicMeeting = await res.json();
    return toPublicMeeting(parsePublicMeeting(meeting));
  }

  async function getTranscripts(id: string): Promise<TranscriptTurn[]> {
    const res = await request(`/meetings/${id}/transcripts`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("could not load transcript");
    }
    const turns: TranscriptTurn[] = await res.json();
    return turns.map((turn) => ({
      index: turn.index,
      speaker: turn.speaker,
      start: turn.start,
      end: turn.end,
      text: turn.text,
    }));
  }

  async function listActions(
    page: number,
    limit: number,
    status: ActionStatusFilter,
  ): Promise<ActionListPage> {
    const res = await request(`/actions?${pageQuery(page, limit, status)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("could not load tasks");
    }
    const body: StoredActionListPage = await res.json();
    return {
      ...body,
      items: body.items.map(parseActionGroup),
    };
  }

  async function patchTask(
    meetingId: string,
    taskId: string,
    status: TaskStatus,
  ): Promise<MeetingTask> {
    const res = await request(`/meetings/${meetingId}/tasks/${taskId}`, {
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
    const task: StoredPublicTask = await res.json();
    return parseMeetingTask(task);
  }

  async function proxyUpload(incoming: Request): Promise<Response> {
    const url = new URL(incoming.url);
    const filename = url.searchParams.get("filename") ?? "video";
    const name = url.searchParams.get("name") ?? filename;
    const headers = new Headers();
    const contentType = incoming.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    const res = await request(
      `/meetings/upload?filename=${encodeURIComponent(filename)}&name=${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers,
        body: incoming.body,
        duplex: "half",
      },
    );
    if (!res.ok) {
      return proxyResponse(res, "application/json");
    }
    const meeting: StoredPublicMeeting = await res.json();
    return Response.json(toPublicMeeting(parsePublicMeeting(meeting)), { status: res.status });
  }

  async function proxyAskFred(incoming: Request): Promise<Response> {
    const headers = new Headers();
    const contentType = incoming.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    const uiStream = incoming.headers.get(UI_MESSAGE_STREAM_HEADER);
    if (uiStream) {
      headers.set(UI_MESSAGE_STREAM_HEADER, uiStream);
    }
    const res = await request("/ask-fred", {
      method: "POST",
      headers,
      body: incoming.body,
      duplex: "half",
    });
    const out = new Headers();
    const responseStream = res.headers.get(UI_MESSAGE_STREAM_HEADER);
    if (responseStream) {
      out.set(UI_MESSAGE_STREAM_HEADER, responseStream);
    }
    return proxyResponse(res, "text/event-stream", out);
  }

  async function proxyStoredObject(path: string, fallbackType: string): Promise<Response> {
    const res = await request(path, { cache: "no-store" });
    return proxyResponse(res, fallbackType);
  }

  return {
    listMeetings,
    getMeeting,
    getTranscripts,
    listActions,
    patchTask,
    proxyUpload,
    proxyAskFred,
    proxyStoredObject,
  };
}
