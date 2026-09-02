import { expect, test } from "bun:test";
import { join } from "node:path";
import type { IconHandle } from "@animateicons/react";
import type { RefObject } from "react";
import { handleHover } from "@lib/handle-hover";

test("handleHover starts on mouseenter and stops on mouseleave", () => {
  const calls: string[] = [];
  const ref: RefObject<IconHandle | null> = {
    current: {
      startAnimation: () => {
        calls.push("start");
      },
      stopAnimation: () => {
        calls.push("stop");
      },
    },
  };
  handleHover({ type: "mouseenter" }, ref);
  handleHover({ type: "mouseleave" }, ref);
  expect(calls).toEqual(["start", "stop"]);
});

test("icon buttons and links use handleHover", async () => {
  const files = [
    "../components/nav.tsx",
    "../components/app-frame.tsx",
    "../components/home.tsx",
    "../components/ask-fred.tsx",
    "../components/capture.tsx",
    "../components/meeting-row.tsx",
    "../components/meetings-empty.tsx",
  ];
  for (const relative of files) {
    const source = await Bun.file(join(import.meta.dir, relative)).text();
    expect(source).toContain("handleHover");
    expect(source).toContain('from "@lib/handle-hover"');
  }
});
