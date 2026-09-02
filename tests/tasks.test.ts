import { expect, test } from "bun:test";
import { join } from "node:path";

test("Tasks list uses the tasks skeleton, not meeting rows", async () => {
  const list = await Bun.file(join(import.meta.dir, "../app/(app)/tasks/tasks-list.tsx")).text();
  expect(list).toContain("TasksListSkeleton");
  expect(list.includes("MeetingsListSkeleton")).toBe(false);
});

test("Tasks group preview is a small wide screen, not a square", async () => {
  const card = await Bun.file(join(import.meta.dir, "../components/task-group.tsx")).text();
  const preview = card.slice(
    card.indexOf("function GroupPreview"),
    card.indexOf("export function TaskGroupCard"),
  );
  expect(preview).toContain("aspect-video");
  expect(preview).toContain("h-8");
  expect(preview.includes("size-8")).toBe(false);
});

test("Tasks list reuses TaskGroupCard for each meeting group", async () => {
  const list = await Bun.file(join(import.meta.dir, "../app/(app)/tasks/tasks-list.tsx")).text();
  expect(list).toContain("TaskGroupCard");
  expect(list.includes("function GroupPreview")).toBe(false);
});

test("Tasks skeleton matches paper groups with a wide thumb", async () => {
  const skeleton = await Bun.file(join(import.meta.dir, "../components/skeleton.tsx")).text();
  const tasks = skeleton.slice(skeleton.indexOf("function TaskGroupBone"));
  expect(tasks).toContain("TasksListSkeleton");
  expect(tasks).toContain('aria-label="Loading tasks"');
  expect(tasks).toContain("aspect-video");
  expect(tasks).toContain("h-8");
  expect(tasks).toContain("rounded-2xl");
  expect(tasks.includes("MeetingRowBone")).toBe(false);
  expect(tasks.includes("lg:grid-cols-[240px")).toBe(false);
});

test("Tasks tabs stay real while groups skeleton", async () => {
  const list = await Bun.file(join(import.meta.dir, "../app/(app)/tasks/tasks-list.tsx")).text();
  const skeleton = await Bun.file(join(import.meta.dir, "../components/skeleton.tsx")).text();
  const tasks = skeleton.slice(skeleton.indexOf("function TaskGroupBone"));
  const page = list.slice(list.indexOf("export function TasksList"));
  expect(page).toContain("FilterTab");
  expect(page).toContain("TasksResults");
  expect(tasks.includes("border-b border-line")).toBe(false);
  expect(tasks.includes("mb-px")).toBe(false);
});
