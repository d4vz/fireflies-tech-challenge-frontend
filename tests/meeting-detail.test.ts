import { expect, test } from "bun:test";
import { join } from "node:path";

test("meeting detail uses shadcn breadcrumbs and the list page does not", async () => {
  const detail = await Bun.file(
    join(import.meta.dir, "../app/meetings/[id]/meeting-detail.tsx"),
  ).text();
  const list = await Bun.file(join(import.meta.dir, "../app/meetings/meetings-list.tsx")).text();
  expect(detail).toContain('from "@/components/ui/breadcrumb"');
  expect(detail).toContain("BreadcrumbPage");
  expect(detail).toContain('href="/meetings"');
  expect(list.includes("Breadcrumb")).toBe(false);
});
