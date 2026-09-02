import { expect, test } from "bun:test";
import { join } from "node:path";

test("meeting detail uses shadcn breadcrumbs and the list page does not", async () => {
  const detail = await Bun.file(
    join(import.meta.dir, "../app/(app)/meetings/[id]/meeting-detail.tsx"),
  ).text();
  const list = await Bun.file(
    join(import.meta.dir, "../app/(app)/meetings/meetings-list.tsx"),
  ).text();
  expect(detail).toContain('from "@/components/ui/breadcrumb"');
  expect(detail).toContain("BreadcrumbPage");
  expect(detail).toContain('href="/meetings"');
  expect(list.includes("Breadcrumb")).toBe(false);
});

test("meeting detail action items are a checkbox list from meeting.tasks", async () => {
  const detail = await Bun.file(
    join(import.meta.dir, "../app/(app)/meetings/[id]/meeting-detail.tsx"),
  ).text();
  expect(detail).toContain(">Tasks<");
  expect(detail).toContain("{completed}/{tasks.length}");
  expect(detail).toContain("bg-paper");
  expect(detail).toContain("rounded-2xl");
  expect(detail).toContain("inset");
  expect(detail).toContain("Summary");
  expect(detail.includes("Takeaways")).toBe(false);
  expect(detail.includes(">Action items<")).toBe(false);
  expect(detail).toContain("TaskChecklist");
  expect(detail).toContain("meeting.tasks");
  expect(detail).toContain("{meeting.name}");
  expect(detail.includes("{meeting.sourceId}")).toBe(false);
  expect(detail.includes("actionItems")).toBe(false);
});
