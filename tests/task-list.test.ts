import { expect, test } from "bun:test";
import { join } from "node:path";

test("TaskChecklist uses the shadcn checkbox", async () => {
  const list = await Bun.file(join(import.meta.dir, "../components/task-list.tsx")).text();
  expect(list).toContain('from "@/components/ui/checkbox"');
  expect(list).toContain("<Checkbox");
  expect(list).toContain("inset");
  expect(list.includes('type="checkbox"')).toBe(false);
});

test("TaskGroupCard uses a thumb header, task count, and an inset checklist", async () => {
  const group = await Bun.file(join(import.meta.dir, "../components/task-group.tsx")).text();
  expect(group).toContain("taskCountLabel");
  expect(group).toContain("GroupPreview");
  expect(group).toContain("inset");
  expect(group).toContain("mediaKind");
  expect(group.includes("ring-1 ring-line hover:bg-wash")).toBe(false);
});
