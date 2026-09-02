import { expect, test } from "bun:test";
import { join } from "node:path";
import {
  appLocation,
  assistantCloseHref,
  applyAssistantPresence,
  assistantOpenHref,
  locationHref,
  parseAssistantOpen,
} from "@lib/assistant-url";

test("parseAssistantOpen is true only when fred is 1", () => {
  expect(parseAssistantOpen("?fred=1")).toBe(true);
  expect(parseAssistantOpen("fred=1")).toBe(true);
  expect(parseAssistantOpen("")).toBe(false);
  expect(parseAssistantOpen("?fred=0")).toBe(false);
  expect(parseAssistantOpen("?fred=garbage")).toBe(false);
  expect(parseAssistantOpen("?fred=open")).toBe(false);
  expect(parseAssistantOpen("?tab=busy&fred=1")).toBe(true);
});

test("assistantOpenHref keeps the current pathname", () => {
  expect(assistantOpenHref({ pathname: "/meetings", search: "" })).toBe("/meetings?fred=1");
  expect(assistantOpenHref({ pathname: "/", search: "?tab=busy&q=eng" })).toBe(
    "/?tab=busy&q=eng&fred=1",
  );
  expect(assistantOpenHref({ pathname: "/meetings", search: "?status=ready&page=2" })).toBe(
    "/meetings?status=ready&page=2&fred=1",
  );
});

test("assistantCloseHref omits fred and keeps the pathname", () => {
  expect(assistantCloseHref({ pathname: "/meetings", search: "?fred=1" })).toBe("/meetings");
  expect(assistantCloseHref({ pathname: "/", search: "?tab=busy&fred=1" })).toBe("/?tab=busy");
});

test("locationHref never writes fred=0", () => {
  expect(locationHref({ pathname: "/meetings", search: "?fred=1" }, false)).toBe("/meetings");
  expect(locationHref({ pathname: "/meetings", search: "?fred=0" }, false)).toBe("/meetings");
  expect(locationHref({ pathname: "/", search: "" }, false)).toBe("/");
  expect(assistantCloseHref({ pathname: "/meetings", search: "?fred=1" }).includes("fred=0")).toBe(
    false,
  );
  expect(locationHref({ pathname: "/meetings", search: "?fred=0" }, true)).toBe("/meetings?fred=1");
});

test("applyAssistantPresence patches fred onto an existing href", () => {
  expect(applyAssistantPresence("/?tab=busy", true)).toBe("/?tab=busy&fred=1");
  expect(applyAssistantPresence("/meetings?fred=1", false)).toBe("/meetings");
  expect(applyAssistantPresence("/meetings", true)).toBe("/meetings?fred=1");
  expect(applyAssistantPresence("/meetings?fred=1", true)).toBe("/meetings?fred=1");
  expect(applyAssistantPresence("/?tab=busy&fred=1", false)).toBe("/?tab=busy");
});

test("assistant-url has no click-kind wrapper", async () => {
  const source = await Bun.file(join(import.meta.dir, "../lib/assistant-url.ts")).text();
  expect(source.includes("assistantOpenClickKind")).toBe(false);
  expect(source.includes('"navigate"')).toBe(false);
});

test("locationHref preserves status and page", () => {
  expect(locationHref({ pathname: "/meetings", search: "?status=ready&page=2" }, true)).toBe(
    "/meetings?status=ready&page=2&fred=1",
  );
  expect(
    locationHref({ pathname: "/meetings", search: "?status=ready&page=2&fred=1" }, false),
  ).toBe("/meetings?status=ready&page=2");
});

test("appLocation stores pathname and search", () => {
  expect(appLocation("/tasks", "?q=eng")).toEqual({ pathname: "/tasks", search: "?q=eng" });
});
