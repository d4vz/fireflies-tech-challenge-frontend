"use client";

import { useState, type ReactNode } from "react";
import { FileText } from "@animateicons/react/lucide";
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
    <div className="min-h-0">
      <div className="sticky top-0 z-10 border-b border-line bg-paper px-5 py-4">
        <h2 className="m-0 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
          Transcript
          <span className="sr-only">{` for ${props.meeting.name}`}</span>
        </h2>
      </div>
      <div className="px-5 py-6 leading-7 text-ink/80">
        {props.transcript.kind === "pending" ? <TranscriptSkeleton /> : null}
        {props.transcript.kind === "empty" ? (
          <p className="m-0 font-sans text-[0.9rem]">(empty transcript)</p>
        ) : null}
        {props.transcript.kind === "text" ? (
          <div className="font-sans text-[0.9rem] whitespace-pre-wrap">
            {props.transcript.value}
          </div>
        ) : null}
      </div>
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
          <FileText size={16} />
          Transcript
        </Button>
        {props.children}
      </div>
    </WorkspaceCanvas>
  );
}
