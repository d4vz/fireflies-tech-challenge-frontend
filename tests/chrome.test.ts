import { expect, test } from "bun:test";
import { displayNameFrom, periodAt } from "@lib/chrome";

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

test("displayNameFrom prefers a trimmed first name", () => {
  expect(displayNameFrom("Ada", "ada@example.com")).toBe("Ada");
  expect(displayNameFrom("  Ada  ", "ada@example.com")).toBe("Ada");
});

test("displayNameFrom uses the email local-part when first name is missing", () => {
  expect(displayNameFrom(null, "ada@example.com")).toBe("ada");
  expect(displayNameFrom("", "ada@example.com")).toBe("ada");
  expect(displayNameFrom("   ", "ada@example.com")).toBe("ada");
});

test("displayNameFrom is there when name and email are missing", () => {
  expect(displayNameFrom(null, null)).toBe("there");
  expect(displayNameFrom(undefined, undefined)).toBe("there");
  expect(displayNameFrom("", "")).toBe("there");
});
