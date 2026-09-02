import { expect, test } from "bun:test";
import { periodAt } from "@lib/chrome";

test("periodAt is morning before noon", () => {
  expect(periodAt(new Date("2026-09-01T08:00:00"))).toBe("morning");
});

test("periodAt is afternoon from noon until 17:00", () => {
  expect(periodAt(new Date("2026-09-01T12:00:00"))).toBe("afternoon");
  expect(periodAt(new Date("2026-09-01T16:59:00"))).toBe("afternoon");
});

test("periodAt is evening from 17:00", () => {
  expect(periodAt(new Date("2026-09-01T17:00:00"))).toBe("evening");
});
