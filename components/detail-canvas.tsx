"use client";

import { useState, type ReactNode } from "react";
import { TranscriptSkeleton } from "@components/skeleton";
import { WorkspaceCanvas } from "@components/workspace-canvas";
import { Button } from "@/components/ui/button";
import type { Meeting } from "@lib/meetings";

export type TranscriptView =
  | { kind: "pending" }
  | { kind: "text"; value: string }
  | { kind: "empty" };

export type DetailCanvasProps = {
  meeting: Meeting;
  transcript: TranscriptView;
  children: ReactNode;
};

function TranscriptPanel(props: { meeting: Meeting; transcript: TranscriptView }) {
  return (
    <div className="min-h-0 px-5 py-6">
      <h2 className="m-0 mb-4 text-[0.95rem] font-semibold">
        Transcript
        <span className="sr-only">{` for ${props.meeting.sourceId}`}</span>
      </h2>
      {props.transcript.kind === "pending" ? <TranscriptSkeleton /> : null}
      {props.transcript.kind === "empty" ? (
        <p className="m-0 font-sans text-[0.9rem] leading-6 text-gray-700">(empty transcript)</p>
      ) : null}
      {props.transcript.kind === "text" ? (
        <div className="font-sans text-[0.9rem] leading-6 whitespace-pre-wrap text-gray-700">
          {props.transcript.value}
        </div>
      ) : null}
    </div>
  );
}

export function DetailCanvas(props: DetailCanvasProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <WorkspaceCanvas
      rail={{
        kind: "transcript",
        sheetOpen,
        panel: <TranscriptPanel meeting={props.meeting} transcript={props.transcript} />,
        onSheetOpenChange: setSheetOpen,
      }}
    >
      <div className="px-4 pt-8 pb-12 md:px-8">
        <Button
          type="button"
          variant="outline"
          className="mb-4 lg:hidden"
          onClick={() => setSheetOpen(true)}
        >
          Transcript
        </Button>
        {props.children}
      </div>
    </WorkspaceCanvas>
  );
}
