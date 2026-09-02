import { expect, test } from "bun:test";
import { join } from "node:path";
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

test("AskFred sidebar glyph uses the accent color", async () => {
  const nav = await Bun.file(join(import.meta.dir, "../components/nav.tsx")).text();
  expect(nav).toContain('props.icon === "askfred"');
  expect(nav).toContain("text-accent");
});
