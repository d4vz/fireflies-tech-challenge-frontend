"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Dropzone({
  accept,
  disabled,
  className,
  children,
  onDrop,
}: {
  accept?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onDrop: (files: File[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);

  function takeFiles(list: FileList | null | undefined) {
    if (!list || disabled) {
      return;
    }
    onDrop(Array.from(list));
  }

  return (
    <div
      data-slot="dropzone"
      data-active={dragActive ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      className={cn(
        "flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground transition-colors",
        dragActive && "border-ring ring-3 ring-ring/50",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        className,
      )}
      onClick={() => {
        if (!disabled) {
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) {
          setDragActive(true);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setDragActive(true);
        }
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node)) {
          return;
        }
        setDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        takeFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={(event) => {
          takeFiles(event.target.files);
          event.target.value = "";
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      />
      {children}
    </div>
  );
}

export { Dropzone };
