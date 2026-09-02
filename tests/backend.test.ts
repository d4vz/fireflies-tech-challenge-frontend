import { expect, test } from "bun:test";
import { createBackendGateway, type BackendGatewayDeps } from "@lib/backend-gateway";
import type { StoredActionGroup } from "@lib/actions";
import type { StoredPublicMeeting, TranscriptChunk } from "@lib/meetings";

type FetchCall = {
  url: string;
  method: string;
  authorization: string | null;
};

type GatewayErrorBody = { error: string };

type MeetingListFixture = {
  items: StoredPublicMeeting[];
  total: number;
  page: number;
  limit: number;
};

type ActionListFixture = {
  items: StoredActionGroup[];
  total: number;
  page: number;
  limit: number;
};

type GatewayJson =
  | StoredPublicMeeting
  | MeetingListFixture
  | ActionListFixture
  | GatewayErrorBody
  | TranscriptChunk[];

function jsonResponse(status: number, body: GatewayJson): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function videoMeeting(id: string): StoredPublicMeeting {
  return {
    _id: id,
    sourceId: "clip.mp4",
    name: "Standup",
    createdAt: "2026-09-01T00:00:00.000Z",
    status: "ready",
    blob: {
      kind: "video",
      url: "http://blob/video",
      durationInSeconds: 12,
      thumbnailUrl: "http://blob/thumb",
    },
  };
}

function gatewayOf(fetchImpl: BackendGatewayDeps["fetch"], token: string | null = "tok") {
  return createBackendGateway({
    fetch: fetchImpl,
    getToken: async () => token,
    baseUrl: "http://api.test/",
  });
}

function recordingFetch(status: number, body: GatewayJson) {
  const calls: FetchCall[] = [];
  return {
    calls,
    fetch: async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      calls.push({
        url,
        method: init?.method ?? "GET",
        authorization: headers.get("Authorization"),
      });
      return jsonResponse(status, body);
    },
  };
}

test("throws unauthorized and does not fetch when the token is missing", async () => {
  let fetches = 0;
  const gateway = gatewayOf(async () => {
    fetches += 1;
    return jsonResponse(200, { error: "unused" });
  }, null);
  await expect(gateway.listMeetings(1, 5)).rejects.toThrow("unauthorized");
  expect(fetches).toBe(0);
});

test("stamps Bearer and strips the trailing slash from the base URL", async () => {
  const { calls, fetch } = recordingFetch(200, { items: [], total: 0, page: 1, limit: 5 });
  await gatewayOf(fetch).listMeetings(1, 5);
  expect(calls).toEqual([
    {
      url: "http://api.test/meetings?page=1&limit=5",
      method: "GET",
      authorization: "Bearer tok",
    },
  ]);
});

test("listMeetings forwards status when it is not all and rewrites media URLs", async () => {
  const { calls, fetch } = recordingFetch(200, {
    items: [videoMeeting("abc")],
    total: 1,
    page: 1,
    limit: 5,
  });
  const page = await gatewayOf(fetch).listMeetings(1, 5, "ready");
  expect(calls[0]?.url).toBe("http://api.test/meetings?page=1&limit=5&status=ready");
  expect(page.items[0]?.name).toBe("Standup");
  expect(page.items[0]?.blob).toEqual({
    kind: "video",
    url: "/api/meetings/abc/video",
    thumbnailUrl: "/api/meetings/abc/thumbnail",
    durationInSeconds: 12,
  });
});

test("listMeetings maps a failed response", async () => {
  const { fetch } = recordingFetch(502, { error: "nope" });
  await expect(gatewayOf(fetch).listMeetings(1, 5)).rejects.toThrow("could not load meetings");
});

test("getMeeting returns null on 404 and rewrites audio URLs", async () => {
  const missing = recordingFetch(404, { error: "missing" });
  expect(await gatewayOf(missing.fetch).getMeeting("gone")).toBeNull();

  const audio = videoMeeting("abc");
  audio.blob = { kind: "audio", url: "http://blob/audio", durationInSeconds: 3 };
  const found = recordingFetch(200, audio);
  const meeting = await gatewayOf(found.fetch).getMeeting("abc");
  expect(meeting?.blob).toEqual({
    kind: "audio",
    url: "/api/meetings/abc/video",
    durationInSeconds: 3,
  });
});

test("getTranscripts maps chunks and failed responses", async () => {
  const ok = recordingFetch(200, [{ index: 0, text: "hello" }]);
  expect(await gatewayOf(ok.fetch).getTranscripts("abc")).toEqual([{ index: 0, text: "hello" }]);
  const bad = recordingFetch(500, { error: "nope" });
  await expect(gatewayOf(bad.fetch).getTranscripts("abc")).rejects.toThrow(
    "could not load transcript",
  );
});

test("listActions forwards status and requires a stored name", async () => {
  const { calls, fetch } = recordingFetch(200, {
    items: [
      {
        meetingId: "1",
        sourceId: "clip.mp4",
        name: "Standup",
        createdAt: "2026-09-01T00:00:00.000Z",
        href: "/meetings/1",
        tasks: [],
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
  });
  const page = await gatewayOf(fetch).listActions(1, 10, "pending");
  expect(calls[0]?.url).toBe("http://api.test/actions?page=1&limit=10&status=pending");
  expect(page.items[0]?.name).toBe("Standup");
  expect(page.items[0]?.mediaKind).toBe("video");
});

test("patchTask maps 404 to task not found", async () => {
  const { calls, fetch } = recordingFetch(404, { error: "missing" });
  await expect(gatewayOf(fetch).patchTask("m", "t", "completed")).rejects.toThrow("task not found");
  expect(calls[0]?.url).toBe("http://api.test/meetings/m/tasks/t");
  expect(calls[0]?.method).toBe("PATCH");
});

test("proxyUpload parses a successful meeting and rewrites URLs", async () => {
  const { calls, fetch } = recordingFetch(201, videoMeeting("abc"));
  const res = await gatewayOf(fetch).proxyUpload(
    new Request("http://local/api/meetings/upload?filename=clip.webm&name=Standup", {
      method: "POST",
      headers: { "Content-Type": "video/webm" },
      body: "bytes",
    }),
  );
  expect(calls[0]?.url).toBe("http://api.test/meetings/upload?filename=clip.webm&name=Standup");
  expect(calls[0]?.method).toBe("POST");
  expect(res.status).toBe(201);
  const body: StoredPublicMeeting = await res.json();
  expect(body.blob).toEqual({
    kind: "video",
    url: "/api/meetings/abc/video",
    thumbnailUrl: "/api/meetings/abc/thumbnail",
    durationInSeconds: 12,
  });
});

test("proxyAskFred copies the UI stream header", async () => {
  const calls: FetchCall[] = [];
  const gateway = gatewayOf(async (url, init) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      method: init?.method ?? "GET",
      authorization: headers.get("Authorization"),
    });
    expect(headers.get("x-vercel-ai-ui-message-stream")).toBe("v1");
    return new Response("data: hi\n\n", {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "x-vercel-ai-ui-message-stream": "v1",
      },
    });
  });
  const res = await gateway.proxyAskFred(
    new Request("http://local/api/ask-fred", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vercel-ai-ui-message-stream": "v1",
      },
      body: "{}",
    }),
  );
  expect(calls[0]?.url).toBe("http://api.test/ask-fred");
  expect(res.headers.get("x-vercel-ai-ui-message-stream")).toBe("v1");
  expect(res.headers.get("Content-Type")).toBe("text/event-stream");
});

test("proxyStoredObject forwards the backend status and type", async () => {
  const gateway = gatewayOf(async (url) => {
    expect(url).toBe("http://api.test/meetings/abc/video");
    return new Response("blob", {
      status: 200,
      headers: { "Content-Type": "video/webm" },
    });
  });
  const res = await gateway.proxyStoredObject("/meetings/abc/video", "application/octet-stream");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("video/webm");
});
