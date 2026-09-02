"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type AssistantOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function AssistantOverlay(props: AssistantOverlayProps) {
  return (
    <Sheet
      open={props.open}
      modal={false}
      onOpenChange={(open) => {
        if (open) {
          return;
        }
        props.onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-[420px] data-[side=right]:data-open:slide-in-from-right data-[side=right]:data-closed:slide-out-to-right"
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
        <div className="flex h-full min-h-0 flex-col">{props.children}</div>
      </SheetContent>
    </Sheet>
  );
}
