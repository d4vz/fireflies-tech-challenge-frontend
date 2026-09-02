import type { TranscriptTurn } from "@lib/meetings";

export type TranscriptView =
  | { kind: "pending" }
  | { kind: "turns"; value: TranscriptTurn[] }
  | { kind: "empty" };

type TranscriptQueryInput = {
  turns: TranscriptTurn[] | undefined;
  meetingFailed: boolean;
  queryError: boolean;
};

export function toTranscriptView(input: TranscriptQueryInput): TranscriptView {
  if (input.turns) {
    if (input.turns.length === 0) {
      return { kind: "empty" };
    }
    return { kind: "turns", value: input.turns };
  }
  if (input.meetingFailed || input.queryError) {
    return { kind: "empty" };
  }
  return { kind: "pending" };
}
