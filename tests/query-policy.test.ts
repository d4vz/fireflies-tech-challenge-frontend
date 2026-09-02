import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { actionsKey } from "@lib/actions";
import { meetingKey, meetingsKey } from "@lib/meetings";
import {
  actionsListQuery,
  busyRefetchInterval,
  invalidateMeetingData,
  meetingQuery,
  meetingsListQuery,
  transcriptsQuery,
} from "@lib/query-policy";

test("busyRefetchInterval polls every 2s while any status is queued or processing", () => {
  expect(busyRefetchInterval([])).toBe(false);
  expect(busyRefetchInterval(["ready"])).toBe(false);
  expect(busyRefetchInterval(["failed", "ready"])).toBe(false);
  expect(busyRefetchInterval(["queued"])).toBe(2000);
  expect(busyRefetchInterval(["processing"])).toBe(2000);
  expect(busyRefetchInterval(["ready", "processing", "failed"])).toBe(2000);
});

test("query factories bundle the list, meeting, transcript, and actions keys", () => {
  expect(JSON.stringify(meetingsListQuery(2, 5, "ready").queryKey)).toBe(
    JSON.stringify(["meetings", "list", 2, 5, "ready"]),
  );
  expect(JSON.stringify(meetingsListQuery(1, 20).queryKey)).toBe(
    JSON.stringify(["meetings", "list", 1, 20, "all"]),
  );
  expect(JSON.stringify(meetingQuery("abc").queryKey)).toBe(JSON.stringify(["meetings", "abc"]));
  expect(JSON.stringify(transcriptsQuery("abc").queryKey)).toBe(
    JSON.stringify(["meetings", "abc", "transcripts"]),
  );
  expect(JSON.stringify(actionsListQuery(1, 2, "pending").queryKey)).toBe(
    JSON.stringify(["actions", "list", 1, 2, "pending"]),
  );
});

test("invalidateMeetingData invalidates meeting lists and actions", async () => {
  const client = new QueryClient();
  client.setQueryData(meetingsKey, "meetings");
  client.setQueryData(actionsKey, "actions");
  client.setQueryData(meetingKey("kept"), "kept");

  await invalidateMeetingData(client);

  expect(client.getQueryState(meetingsKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(actionsKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(meetingKey("kept"))?.isInvalidated).toBe(true);
});

test("invalidateMeetingData with a meeting id also targets that meeting query", async () => {
  const client = new QueryClient();
  client.setQueryData(meetingKey("abc"), "abc");
  client.setQueryData(actionsKey, "actions");

  await invalidateMeetingData(client, "abc");

  expect(client.getQueryState(meetingKey("abc"))?.isInvalidated).toBe(true);
  expect(client.getQueryState(actionsKey)?.isInvalidated).toBe(true);
});
