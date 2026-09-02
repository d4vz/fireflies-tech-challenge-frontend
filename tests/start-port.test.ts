import { expect, test } from "bun:test";
import { join } from "node:path";

const pkg = await Bun.file(join(import.meta.dir, "../package.json")).json();

test("start defaults to 8080 so it does not share the API port", () => {
  expect(pkg.scripts.dev).toContain("-p 8080");
  expect(pkg.scripts.start).toContain("-p ${PORT:-8080}");
  expect(pkg.scripts.start.includes("3000")).toBe(false);
});
