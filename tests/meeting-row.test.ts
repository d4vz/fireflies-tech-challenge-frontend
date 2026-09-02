import { expect, test } from "bun:test";
import { join } from "node:path";

test("busy meeting rows show a summary skeleton instead of empty copy", async () => {
  const row = await Bun.file(join(import.meta.dir, "../components/meeting-row.tsx")).text();
  expect(row).toContain("SummarySkeleton");
  expect(row).toContain("toMeetingNotesView");
  expect(row).toContain('case "pending"');
  expect(row.includes("No action items")).toBe(false);
});
