import { toPublicMeeting, type Meeting } from "@lib/meetings";

type SseEvent = {
  event: string;
  data: ReturnType<typeof JSON.parse>;
};

function parseSseBlock(block: string): SseEvent | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }
  if (dataLines.length === 0) {
    return null;
  }
  return { event, data: JSON.parse(dataLines.join("\n")) };
}

async function* readSse(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    return;
  }
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      return;
    }
    buffer += decoder.decode(chunk.value, { stream: true });
    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const parsed = parseSseBlock(buffer.slice(0, sep));
      buffer = buffer.slice(sep + 2);
      if (parsed) {
        yield parsed;
      }
      sep = buffer.indexOf("\n\n");
    }
  }
}

export async function listMeetings(): Promise<Meeting[]> {
  const res = await fetch("/api/meetings");
  if (!res.ok) {
    throw new Error("could not load meetings");
  }
  const meetings: Meeting[] = await res.json();
  return meetings;
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

export async function uploadVideo(file: File, onStage: (stage: string) => void): Promise<Meeting> {
  const res = await fetch(`/api/meetings/upload?filename=${encodeURIComponent(file.name)}`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body: { error?: string } = await res.json();
    throw new Error(body.error || "upload failed");
  }
  let meeting: Meeting | null = null;
  for await (const item of readSse(res)) {
    if (item.event === "progress") {
      onStage(item.data.stage);
    }
    if (item.event === "done") {
      meeting = toPublicMeeting(item.data);
    }
    if (item.event === "error") {
      throw new Error(item.data.error);
    }
  }
  if (!meeting) {
    throw new Error("upload ended without a meeting");
  }
  return meeting;
}
