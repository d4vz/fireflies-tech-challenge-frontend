"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  assistantPanelSlot,
  parseHomeViewFromSearch,
  pushHomeUrl,
  type AssistantChrome,
} from "@lib/home";

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

function closeFredView() {
  return { ...parseHomeViewFromSearch(window.location.search), fred: "unset" as const };
}

const XL_QUERY = "(min-width: 1280px)";

function subscribeXl(onStoreChange: () => void): () => void {
  const mq = window.matchMedia(XL_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function xlSnapshot(): boolean {
  return window.matchMedia(XL_QUERY).matches;
}

type AssistantWorkspaceProps = {
  rail: AssistantRail;
  children: ReactNode;
};

function AssistantWorkspace(props: AssistantWorkspaceProps) {
  const chrome = props.rail.chrome;
  const isXl = useSyncExternalStore(subscribeXl, xlSnapshot, () => true);
  const slot = assistantPanelSlot(isXl, chrome.sheetOpen);
  const dockOpen = slot === "dock";

  return (
    <>
      <div className="grid h-full min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-h-0 min-w-0 overflow-y-auto">{props.children}</div>
        {isXl ? (
          <aside
            className={cn(
              "min-h-0 overflow-hidden transition-[width] duration-300 ease-in-out",
              dockOpen ? "w-[420px]" : "w-0",
            )}
          >
            <div className="flex h-full w-[420px] min-w-[420px] flex-col border-l border-line bg-paper">
              {dockOpen ? props.rail.panel : null}
            </div>
          </aside>
        ) : null}
      </div>
      <Sheet
        open={slot === "sheet"}
        modal={false}
        onOpenChange={(open) => {
          if (open) {
            return;
          }
          pushHomeUrl(closeFredView());
        }}
      >
        <SheetContent
          side="right"
          overlayClassName="xl:hidden"
          className="w-full p-0 sm:max-w-[420px] xl:hidden data-[side=right]:data-open:slide-in-from-right data-[side=right]:data-closed:slide-out-to-right"
          showCloseButton={false}
          slideTravel="full"
          onInteractOutside={(event) => {
            event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>AskFred</SheetTitle>
          </SheetHeader>
          <div className="flex h-full min-h-0 flex-col">
            {slot === "sheet" ? props.rail.panel : null}
          </div>
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
  if (props.rail.kind === "assistant") {
    return <AssistantWorkspace rail={props.rail}>{props.children}</AssistantWorkspace>;
  }
  return <TranscriptWorkspace rail={props.rail}>{props.children}</TranscriptWorkspace>;
}
