import { expect, test } from "bun:test";
import { applyAssistantPresence, assistantHref, parseAssistantLocation } from "@lib/assistant-url";

test("parseAssistantLocation reads open fred on the current pathname", () => {
  expect(parseAssistantLocation("/meetings", "?fred=1")).toEqual({
    pathname: "/meetings",
    search: "",
    presence: "open",
  });
});

test("parseAssistantLocation is closed when the fred param is missing or not 1", () => {
  expect(parseAssistantLocation("/meetings", "").presence).toBe("closed");
  expect(parseAssistantLocation("/meetings", "?fred=0").presence).toBe("closed");
  expect(parseAssistantLocation("/meetings", "?fred=garbage").presence).toBe("closed");
  expect(parseAssistantLocation("/", "?tab=busy").presence).toBe("closed");
});

test("parseAssistantLocation strips fred from page search", () => {
  expect(parseAssistantLocation("/", "?tab=busy&fred=1")).toEqual({
    pathname: "/",
    search: "?tab=busy",
    presence: "open",
  });
  expect(parseAssistantLocation("/meetings", "?status=ready&page=2&fred=1")).toEqual({
    pathname: "/meetings",
    search: "?status=ready&page=2",
    presence: "open",
  });
});

test("assistantHref open keeps the current pathname and never rehomes to /", () => {
  const meetings = parseAssistantLocation("/meetings", "");
  expect(assistantHref(meetings, "open")).toBe("/meetings?fred=1");
  expect(assistantHref(meetings, "open").startsWith("/?")).toBe(false);

  const homeLoc = parseAssistantLocation("/", "?tab=busy&q=eng");
  expect(assistantHref(homeLoc, "open")).toBe("/?tab=busy&q=eng&fred=1");
});

test("assistantHref closed omits fred", () => {
  const meetingsOpen = parseAssistantLocation("/meetings", "?fred=1");
  expect(assistantHref(meetingsOpen, "closed")).toBe("/meetings");
  expect(assistantHref(meetingsOpen, "closed").includes("fred")).toBe(false);

  const homeOpen = parseAssistantLocation("/", "?tab=busy&fred=1");
  expect(assistantHref(homeOpen, "closed")).toBe("/?tab=busy");
});

test("assistantHref preserves status and page when toggling fred", () => {
  const closed = parseAssistantLocation("/meetings", "?status=ready&page=2");
  expect(assistantHref(closed, "open")).toBe("/meetings?status=ready&page=2&fred=1");

  const open = parseAssistantLocation("/meetings", "?status=ready&page=2&fred=1");
  expect(assistantHref(open, "closed")).toBe("/meetings?status=ready&page=2");
});

test("applyAssistantPresence patches fred onto an existing href", () => {
  expect(applyAssistantPresence("/?tab=busy", "open")).toBe("/?tab=busy&fred=1");
  expect(applyAssistantPresence("/meetings?fred=1", "closed")).toBe("/meetings");
  expect(applyAssistantPresence("/meetings", "open")).toBe("/meetings?fred=1");
});
