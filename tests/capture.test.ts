import { expect, test } from "bun:test";
import { join } from "node:path";

test("Capture starts naming from empty-state capture and upload intents", async () => {
  const source = await Bun.file(join(import.meta.dir, "../components/capture.tsx")).text();
  expect(source).toContain("subscribeCaptureIntent");
  expect(source).toContain('case "capture":');
  expect(source).toContain('case "upload":');
  expect(source).toContain("startCapture");
  expect(source).toContain("startUpload");
});

test("screen capture modal shows mic, window, and entire screen readiness checks", async () => {
  const capture = await Bun.file(join(import.meta.dir, "../components/capture.tsx")).text();
  const readiness = await Bun.file(join(import.meta.dir, "../lib/capture-readiness.ts")).text();
  expect(capture).toContain("useCaptureReadiness");
  expect(capture).toContain("CaptureReadinessChecks");
  expect(capture).toContain('from "@/components/ui/badge"');
  expect(capture).toContain('data-icon="inline-end"');
  expect(readiness).toContain("Mic");
  expect(readiness).toContain("Window");
  expect(readiness).toContain("Entire screen");
  expect(capture).toContain("SCREEN_CAPTURE_PERMISSION_HINT");
  expect(capture).toContain("reload the app");
  expect(capture).toContain("system settings");
});

test("screen recording picker includes window and entire screen", async () => {
  const source = await Bun.file(join(import.meta.dir, "../lib/screen-record.ts")).text();
  expect(source).toContain('monitorTypeSurfaces: "include"');
  expect(source).not.toContain('displaySurface: "browser"');
});

test("naming dialog is titled Create a meeting", async () => {
  const source = await Bun.file(join(import.meta.dir, "../components/capture.tsx")).text();
  expect(source).toContain("Create a meeting");
  expect(source).toContain('aria-label="Create a meeting"');
  expect(source.includes("Meeting name")).toBe(false);
});

test("Capture shows a Sonner loading toast while the file uploads", async () => {
  const source = await Bun.file(join(import.meta.dir, "../components/capture.tsx")).text();
  expect(source).toContain("toast.loading");
  expect(source).toContain("UPLOAD_LOADING");
});

test("Capture split control is the same height as the header user button", async () => {
  const source = await Bun.file(join(import.meta.dir, "../components/capture.tsx")).text();
  expect(source).toContain("h-9");
});

test("header stacks above the page so the upload menu is not behind transcript", async () => {
  const frame = await Bun.file(join(import.meta.dir, "../components/app-frame.tsx")).text();
  const capture = await Bun.file(join(import.meta.dir, "../components/capture.tsx")).text();
  expect(frame).toContain("relative z-20 flex min-w-0 items-center");
  expect(capture).toContain("absolute top-[calc(100%+0.4rem)] right-0 z-10");
  expect(capture).toContain('className={props.menuOpen ? "rotate-180" : undefined}');
});

test("capture alerts keep a wrapped icon beside the title", async () => {
  const alert = await Bun.file(join(import.meta.dir, "../components/ui/alert.tsx")).text();
  expect(alert).toContain("has-[svg]:grid-cols-[auto_1fr]");
  expect(alert).toContain("group-has-[svg]/alert:col-start-2");
  expect(alert.includes("has-[>svg]:grid-cols")).toBe(false);
});
