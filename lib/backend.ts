import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createBackendGateway } from "@lib/backend-gateway";
import type { ActionStatusFilter } from "@lib/actions";
import type { MeetingListFilter, TaskStatus } from "@lib/meetings";

function productionGateway() {
  return createBackendGateway({
    fetch: (url, init) => globalThis.fetch(url, init),
    getToken: async () => {
      const { getToken } = await auth();
      return await getToken();
    },
    baseUrl: process.env.API_URL ?? "http://localhost:3000",
  });
}

export function listMeetings(page: number, limit: number, status: MeetingListFilter = "all") {
  return productionGateway().listMeetings(page, limit, status);
}

export function getMeeting(id: string) {
  return productionGateway().getMeeting(id);
}

export function getTranscripts(id: string) {
  return productionGateway().getTranscripts(id);
}

export function listActions(page: number, limit: number, status: ActionStatusFilter) {
  return productionGateway().listActions(page, limit, status);
}

export function patchTask(meetingId: string, taskId: string, status: TaskStatus) {
  return productionGateway().patchTask(meetingId, taskId, status);
}

export function proxyUpload(request: Request) {
  return productionGateway().proxyUpload(request);
}

export function proxyAskFred(request: Request) {
  return productionGateway().proxyAskFred(request);
}

export function proxyStoredObject(path: string, fallbackType: string) {
  return productionGateway().proxyStoredObject(path, fallbackType);
}
