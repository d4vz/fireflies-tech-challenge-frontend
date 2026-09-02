"use client";

import { Monitor, Upload } from "@animateicons/react/lucide";
import type { IconHandle } from "@animateicons/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { requestCaptureIntent } from "@lib/capture-intent";
import { handleHover } from "@lib/handle-hover";

function EmptyMark() {
  return (
    <div className="relative grid size-[5.5rem] place-items-center" aria-hidden="true">
      <span className="absolute size-[5.5rem] rounded-full bg-process-wash" />
      <span className="absolute size-16 rounded-full bg-[#dce8ff]" />
      <span className="relative grid size-12 place-items-center rounded-2xl bg-accent text-white shadow-[0_10px_24px_rgba(107,77,255,0.32)]">
        <Monitor size={20} />
      </span>
    </div>
  );
}

export function MeetingsEmpty() {
  const captureRef = useRef<IconHandle>(null);
  const uploadRef = useRef<IconHandle>(null);
  return (
    <div className="flex animate-in fade-in-0 zoom-in-95 flex-col items-center rounded-2xl bg-paper px-6 py-12 text-center shadow-[0_1px_2px_rgba(16,18,27,0.06)] ring-1 ring-line duration-500 md:py-16">
      <EmptyMark />
      <h3 className="mt-5 mb-0 text-[1.15rem] font-semibold tracking-tight">
        Capture your first meeting
      </h3>
      <p className="mt-2 mb-0 max-w-md text-[0.9rem] leading-6 text-muted-foreground">
        No meetings yet. Capture or upload a file to start.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          size="lg"
          className="h-10 bg-accent px-3.5 font-semibold text-white hover:bg-accent-hover hover:text-white"
          onClick={() => requestCaptureIntent("capture")}
          onMouseEnter={(event) => handleHover(event, captureRef)}
          onMouseLeave={(event) => handleHover(event, captureRef)}
        >
          <Monitor ref={captureRef} size={16} />
          Capture a meeting
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-10 px-3.5 font-semibold"
          onClick={() => requestCaptureIntent("upload")}
          onMouseEnter={(event) => handleHover(event, uploadRef)}
          onMouseLeave={(event) => handleHover(event, uploadRef)}
        >
          <Upload ref={uploadRef} />
          Upload a recording
        </Button>
      </div>
    </div>
  );
}
