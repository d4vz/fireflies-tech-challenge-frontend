"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { assistantPanelSlot, homeHref, parseHomeView, type AssistantChrome } from "@lib/home";

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
  return homeHref({ ...view, fred: "unset" });
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const chrome = props.rail.chrome;
  const isXl = useSyncExternalStore(subscribeXl, xlSnapshot, () => true);
  const slot = assistantPanelSlot(isXl, chrome.sheetOpen);
  const dockClass =
    slot === "dock"
      ? "grid h-full min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_360px]"
      : "grid h-full min-h-0 min-w-0 grid-cols-1";

  return (
    <>
      <div className={dockClass}>
        <div className="min-h-0 min-w-0 overflow-y-auto">{props.children}</div>
        {slot === "dock" ? (
          <aside className="flex min-h-0 flex-col overflow-hidden border-l border-line bg-paper">
            {props.rail.panel}
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
          router.replace(closeFredHref(searchParams));
        }}
      >
        <SheetContent
          side="right"
          overlayClassName="xl:hidden"
          className="w-full p-0 sm:max-w-[360px] xl:hidden"
          showCloseButton={false}
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
