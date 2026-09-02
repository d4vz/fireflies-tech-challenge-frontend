import { expect, test } from "bun:test";
import type { TranscriptTurn } from "@lib/meetings";
import { toTranscriptView } from "@lib/transcript-view";

const turnA: TranscriptTurn = {
  index: 0,
  speaker: "A",
  start: 0,
  end: 1.2,
  text: "hello",
};

const turnB: TranscriptTurn = {
  index: 1,
  speaker: "B",
  start: 1.2,
  end: 3,
  text: "world",
};

test("toTranscriptView keeps two turns instead of joining them", () => {
  const view = toTranscriptView({
    turns: [turnA, turnB],
    meetingFailed: false,
    queryError: false,
  });
  expect(view).toEqual({ kind: "turns", value: [turnA, turnB] });
});

test("toTranscriptView maps an empty array to empty", () => {
  expect(toTranscriptView({ turns: [], meetingFailed: false, queryError: false })).toEqual({
    kind: "empty",
  });
});

test("toTranscriptView is pending until data arrives unless the meeting failed", () => {
  expect(toTranscriptView({ turns: undefined, meetingFailed: false, queryError: false })).toEqual({
    kind: "pending",
  });
  expect(toTranscriptView({ turns: undefined, meetingFailed: true, queryError: false })).toEqual({
    kind: "empty",
  });
  expect(toTranscriptView({ turns: undefined, meetingFailed: false, queryError: true })).toEqual({
    kind: "empty",
  });
});
