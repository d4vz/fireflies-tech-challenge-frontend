"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { homeHref, parseHomeView, type AssistantChrome } from "@lib/home";

export type AssistantRail = {
  kind: "assistant";
  chrome: AssistantChrome;
  panel: ReactNode;
};

export type TranscriptRail = {
  kind: "transcript";
  sheetOpen: boolean;
  panel: ReactNode;
  onSheetOpenChange: (open: boolean) => void;
};

export type Rail = AssistantRail | TranscriptRail;

export type WorkspaceCanvasProps = {
  rail: Rail;
  children: ReactNode;
};

function closeFredHref(params: URLSearchParams): string {
  const view = parseHomeView({
    tab: params.get("tab") ?? undefined,
    q: params.get("q") ?? undefined,
    fred: params.get("fred") ?? undefined,
  });
  return homeHref({ ...view, fred: "closed" });
}

type AssistantWorkspaceProps = {
  rail: AssistantRail;
  children: ReactNode;
};

function AssistantWorkspace(props: AssistantWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chrome = props.rail.chrome;
  const dockClass = chrome.dockHidden
    ? "grid h-full min-h-0 grid-cols-1"
    : "grid h-full min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]";

  return (
    <>
      <div className={dockClass}>
        <div className="min-h-0 overflow-y-auto">{props.children}</div>
        {chrome.dockHidden ? null : (
          <aside className="hidden min-h-0 overflow-hidden border-l border-line bg-paper xl:flex xl:flex-col">
            {props.rail.panel}
          </aside>
        )}
      </div>
      <Sheet
        open={chrome.sheetOpen}
        onOpenChange={(open) => {
          if (open) {
            return;
          }
          router.replace(closeFredHref(searchParams));
        }}
      >
        <SheetContent side="right" className="w-[360px] p-0 sm:max-w-[360px] xl:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>AskFred</SheetTitle>
          </SheetHeader>
          <div className="flex h-full min-h-0 flex-col">{props.rail.panel}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

type TranscriptWorkspaceProps = {
  rail: TranscriptRail;
  children: ReactNode;
};

function TranscriptWorkspace(props: TranscriptWorkspaceProps) {
  return (
    <>
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-h-0 overflow-y-auto">{props.children}</div>
        <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-paper lg:block">
          {props.rail.panel}
        </aside>
      </div>
      <Sheet open={props.rail.sheetOpen} onOpenChange={props.rail.onSheetOpenChange}>
        <SheetContent side="right" className="w-[340px] p-0 sm:max-w-[340px] lg:hidden">
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
  if (props.rail.kind === "assistant") {
    return <AssistantWorkspace rail={props.rail}>{props.children}</AssistantWorkspace>;
  }
  return <TranscriptWorkspace rail={props.rail}>{props.children}</TranscriptWorkspace>;
}
