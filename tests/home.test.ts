import { expect, test } from "bun:test";
import {
  assistantChrome,
  assistantOpenHref,
  homeHref,
  parseHomeView,
  type HomeView,
} from "@lib/home";

const defaults: HomeView = { tab: "all", query: "", fred: "unset" };

test("parseHomeView uses defaults for empty params", () => {
  expect(parseHomeView({})).toEqual(defaults);
});

test("parseHomeView keeps the first string when Next passes an array", () => {
  expect(parseHomeView({ tab: ["ready", "failed"], q: ["alpha", "beta"], fred: ["1"] })).toEqual({
    tab: "ready",
    query: "alpha",
    fred: "open",
  });
});

test("parseHomeView falls back on unknown tab and fred", () => {
  expect(parseHomeView({ tab: "upcoming", fred: "yes", q: "eng" })).toEqual({
    tab: "all",
    query: "eng",
    fred: "unset",
  });
});

test("parseHomeView maps fred 1 and 0", () => {
  expect(parseHomeView({ fred: "1" }).fred).toBe("open");
  expect(parseHomeView({ fred: "0" }).fred).toBe("closed");
});

test("homeHref drops default fields so home stays /", () => {
  expect(homeHref(defaults)).toBe("/");
});

test("homeHref writes only non-default fields", () => {
  expect(homeHref({ tab: "ready", query: "eng", fred: "open" })).toBe("/?tab=ready&q=eng&fred=1");
  expect(homeHref({ tab: "all", query: "", fred: "closed" })).toBe("/?fred=0");
});

test("assistantOpenHref keeps Home tab and query", () => {
  expect(assistantOpenHref({ current: { tab: "busy", query: "eng", fred: "unset" } })).toBe(
    "/?tab=busy&q=eng&fred=1",
  );
});

test("assistantOpenHref is /?fred=1 off Home", () => {
  expect(assistantOpenHref({ current: null })).toBe("/?fred=1");
});

test("assistantChrome maps fred without reading the viewport", () => {
  expect(assistantChrome("unset")).toEqual({ sheetOpen: false, dockHidden: false });
  expect(assistantChrome("open")).toEqual({ sheetOpen: true, dockHidden: false });
  expect(assistantChrome("closed")).toEqual({ sheetOpen: false, dockHidden: true });
});
