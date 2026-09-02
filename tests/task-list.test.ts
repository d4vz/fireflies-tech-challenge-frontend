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
  expect(group).toContain("{group.name}");
  expect(group.includes("{group.sourceId}")).toBe(false);
});

test("Home recent task text clamps to two lines and the Tasks page does not", async () => {
  const home = await Bun.file(join(import.meta.dir, "../components/home.tsx")).text();
  const group = await Bun.file(join(import.meta.dir, "../components/task-group.tsx")).text();
  const list = await Bun.file(join(import.meta.dir, "../components/task-list.tsx")).text();
  const tasks = await Bun.file(join(import.meta.dir, "../app/(app)/tasks/tasks-list.tsx")).text();
  const recent = home.slice(
    home.indexOf("function RecentTasksResults"),
    home.indexOf("function AskFredPanel"),
  );
  expect(recent).toContain("clampLines={2}");
  expect(group).toContain("clampLines");
  expect(list).toContain("line-clamp-2");
  expect(tasks.includes("clampLines")).toBe(false);
});
