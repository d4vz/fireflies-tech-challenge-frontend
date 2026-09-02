import { expect, test } from "bun:test";
import { join } from "node:path";

test("TaskChecklist uses the shadcn checkbox", async () => {
  const list = await Bun.file(join(import.meta.dir, "../components/task-list.tsx")).text();
  expect(list).toContain('from "@/components/ui/checkbox"');
  expect(list).toContain("<Checkbox");
  expect(list).toContain("inset");
  expect(list.includes('type="checkbox"')).toBe(false);
});
