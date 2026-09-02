import { expect, test } from "bun:test";
import { isRouteActive, type RouteNavItem } from "@lib/nav";

const home: RouteNavItem = {
  kind: "route",
  href: "/",
  label: "Home",
  icon: "home",
  active: "exact",
};

const meetings: RouteNavItem = {
  kind: "route",
  href: "/meetings",
  label: "Meetings",
  icon: "meetings",
  active: "meetings-tree",
};

test("exact Home is active only on /", () => {
  expect(isRouteActive(home, "/")).toBe(true);
  expect(isRouteActive(home, "/meetings")).toBe(false);
});

test("meetings-tree is active on the list and a detail page", () => {
  expect(isRouteActive(meetings, "/meetings")).toBe(true);
  expect(isRouteActive(meetings, "/meetings/abc")).toBe(true);
  expect(isRouteActive(meetings, "/")).toBe(false);
});
