import { expect, test } from "bun:test";
import { join } from "node:path";

const backend = await Bun.file(join(import.meta.dir, "../lib/backend.ts")).text();

function fetchCalls(source: string): string[] {
  return [...source.matchAll(/\bfetch\s*\(/g)].map((match) => match[0]);
}

test("backendFetch obtains the Clerk session JWT and stamps Bearer", () => {
  expect(backend).toContain('from "@clerk/nextjs/server"');
  expect(backend).toContain("auth()");
  expect(backend).toContain("getToken()");
  expect(backend).toContain("Authorization");
  expect(backend).toContain("Bearer ");
  expect(backend).toContain('throw new Error("unauthorized")');
  expect(backend.includes("if (token)")).toBe(false);
});

test("Hono helpers call backendFetch and do not take a token argument", () => {
  expect(backend).toContain("backendFetch(");
  expect(backend).toContain("export async function listMeetings");
  expect(backend).toContain("export async function getMeeting");
  expect(backend).toContain("export async function proxyUpload");
  expect(backend).toContain("export async function proxyAskFred");
  expect(backend).toContain("export async function getTranscripts");
  expect(backend).toContain("export async function listActions");
  expect(backend).toContain("export async function patchTask");
  expect(backend).toContain("export async function proxyStoredObject");
  expect(backend.includes("token:")).toBe(false);
  expect(backend.includes("token,")).toBe(false);
  expect(backend).toContain("backendFetch(`/meetings?page=${page}&limit=${limit}`");
  expect(backend).toContain("backendFetch(`/meetings/${id}`");
  expect(backend).toContain("`/meetings/upload?filename=${encodeURIComponent(filename)}`");
  expect(backend).toContain('backendFetch("/ask-fred"');
  expect(backend).toContain("backendFetch(`/meetings/${id}/transcripts`");
  expect(backend).toContain("backendFetch(`/actions?${params.toString()}`");
  expect(backend).toContain("backendFetch(`/meetings/${meetingId}/tasks/${taskId}`");
  expect(backend).toContain("backendFetch(path");
});

test("listActions forwards status when it is not all", () => {
  expect(backend).toContain('params.set("status", status)');
  expect(backend).toContain('status !== "all"');
});

test("only backendFetch calls fetch", () => {
  const helpers = backend.replace(/export async function backendFetch[\s\S]*?^}/m, "");
  expect(fetchCalls(helpers)).toEqual([]);
  expect(backend).toContain("await fetch(");
});
