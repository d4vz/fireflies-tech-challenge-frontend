import { expect, test } from "bun:test";
import { join } from "node:path";

test("meeting card thumbs stay 16:9 on mobile", async () => {
  const row = await Bun.file(join(import.meta.dir, "../components/meeting-row.tsx")).text();
  const skeleton = await Bun.file(join(import.meta.dir, "../components/skeleton.tsx")).text();
  const bone = skeleton.slice(
    skeleton.indexOf("function MeetingCardBone"),
    skeleton.indexOf("export function TranscriptSkeleton"),
  );
  expect(row).toContain("aspect-video");
  expect(row.includes("max-md:size-16")).toBe(false);
  expect(row.includes("grid-cols-[4rem_")).toBe(false);
  expect(bone).toContain("aspect-video");
  expect(bone.includes("max-md:size-16")).toBe(false);
  expect(bone.includes("grid-cols-[4rem_")).toBe(false);
});

test("menu meeting cards keep a preview, title, summary, and date", async () => {
  const row = await Bun.file(join(import.meta.dir, "../components/meeting-row.tsx")).text();
  expect(row).toContain('"menu"');
  expect(row).toContain("grid-cols-[8rem_minmax(0,1fr)]");
  expect(row).toContain("grid-rows-[4.5rem]");
  expect(row).toContain("h-[4.5rem]");
  expect(row).toContain("aspect-video");
  expect(row).toContain("whenClass");
  expect(row).toContain("text-muted-foreground");
});

test("menu meeting cards keep title, summary, and date inside the thumbnail height", async () => {
  const row = await Bun.file(join(import.meta.dir, "../components/meeting-row.tsx")).text();
  const menuRow = row.slice(row.indexOf('case "menu":'), row.indexOf("default: {"));
  expect(menuRow).toContain("overflow-hidden");
  expect(menuRow).toContain("grid-rows-[4.5rem]");
  expect(menuRow).toContain("items-start");
  expect(row).toContain("content-start");
  expect(row).toContain("whenClass");
  expect(row.includes("grid-cols-[6.75rem_")).toBe(false);
  expect(row.includes("content-center")).toBe(false);
  expect(row.includes("items-stretch")).toBe(false);
  expect(row.includes('layout === "menu" ? null')).toBe(false);
});

test("busy meeting rows show a summary skeleton instead of empty copy", async () => {
  const row = await Bun.file(join(import.meta.dir, "../components/meeting-row.tsx")).text();
  expect(row).toContain("SummarySkeleton");
  expect(row).toContain("toMeetingNotesView");
  expect(row).toContain('case "pending"');
  expect(row.includes("No action items")).toBe(false);
});
