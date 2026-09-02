"use client";

import { useState, type ReactNode } from "react";
import { FileText } from "@animateicons/react/lucide";
import { TranscriptSkeleton } from "@components/skeleton";
import { WorkspaceCanvas } from "@components/workspace-canvas";
import { Button } from "@/components/ui/button";
import type { Meeting, TranscriptTurn } from "@lib/meetings";
import type { TranscriptView } from "@lib/transcript-view";

export type { TranscriptView };

export type DetailCanvasProps = {
  meeting: Meeting;
  transcript: TranscriptView;
  children: ReactNode;
};

function formatTurnStart(seconds: number) {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function TranscriptTurns(props: { turns: TranscriptTurn[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0 font-sans text-[0.9rem]">
      {props.turns.map((turn) => (
        <li key={turn.index}>
          <div className="mb-1 flex items-baseline gap-2 text-muted-foreground">
            <span className="font-semibold text-ink">{turn.speaker}</span>
            <span>{formatTurnStart(turn.start)}</span>
          </div>
          <p className="m-0 whitespace-pre-wrap">{turn.text}</p>
        </li>
      ))}
    </ol>
  );
}

function TranscriptBody(props: { transcript: TranscriptView }) {
  switch (props.transcript.kind) {
    case "pending":
      return <TranscriptSkeleton />;
    case "empty":
      return <p className="m-0 font-sans text-[0.9rem]">(empty transcript)</p>;
    case "turns":
      return <TranscriptTurns turns={props.transcript.value} />;
    default: {
      const _exhaustive: never = props.transcript;
      return _exhaustive;
    }
  }
}

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
        <TranscriptBody transcript={props.transcript} />
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
