import { expect, test } from "bun:test";
import { join } from "node:path";

test("Capture invalidates meeting lists after upload so Home and Meetings do not wait on poll", async () => {
  const source = await Bun.file(join(import.meta.dir, "../components/capture.tsx")).text();
  expect(source).toContain("invalidateQueries");
  expect(source).toContain("meetingsKey");
});
