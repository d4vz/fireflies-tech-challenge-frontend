"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type TranscriptRail = {
  kind: "transcript";
  sheetOpen: boolean;
  panel: ReactNode;
  onSheetOpenChange: (open: boolean) => void;
};

export type WorkspaceCanvasProps = {
  rail: TranscriptRail;
  children: ReactNode;
};

type TranscriptWorkspaceProps = {
  rail: TranscriptRail;
  children: ReactNode;
};

function TranscriptWorkspace(props: TranscriptWorkspaceProps) {
  return (
    <>
      <div className="grid h-full min-h-0 min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-h-0 min-w-0 overflow-y-auto">{props.children}</div>
        <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-paper lg:block">
          {props.rail.panel}
        </aside>
      </div>
      <Sheet open={props.rail.sheetOpen} onOpenChange={props.rail.onSheetOpenChange}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[340px] lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Transcript</SheetTitle>
          </SheetHeader>
          <div className="h-full min-h-0 overflow-y-auto">{props.rail.panel}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function WorkspaceCanvas(props: WorkspaceCanvasProps) {
  return <TranscriptWorkspace rail={props.rail}>{props.children}</TranscriptWorkspace>;
}
