import { expect, test } from "bun:test";
import { join } from "node:path";
import { isRouteActive, NAV_ITEMS, type RouteNavItem } from "@lib/nav";

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

test("app chrome icons come from animateicons lucide", async () => {
  const files = [
    "../components/nav.tsx",
    "../components/app-frame.tsx",
    "../components/home.tsx",
    "../components/assistant-host.tsx",
    "../components/ask-fred.tsx",
    "../components/capture.tsx",
    "../components/detail-canvas.tsx",
    "../components/empty-note.tsx",
    "../components/list-pager.tsx",
    "../components/meetings-empty.tsx",
    "../components/clip.tsx",
  ];
  for (const relative of files) {
    const source = await Bun.file(join(import.meta.dir, relative)).text();
    expect(source).toContain("@animateicons/react/lucide");
    expect(source.includes('from "lucide-react"')).toBe(false);
  }
});

test("AskFred nav item kind is assistant", async () => {
  expect(NAV_ITEMS).toContainEqual({
    kind: "assistant",
    label: "AskFred",
    icon: "askfred",
  });
  const source = await Bun.file(join(import.meta.dir, "../lib/nav.ts")).text();
  expect(source.includes("home-assistant")).toBe(false);
});

test("sidebar lists only shipped destinations", () => {
  expect(NAV_ITEMS.map((item) => item.label)).toEqual(["Home", "Meetings", "AskFred", "Tasks"]);
});

test("Tasks is a real route", () => {
  expect(NAV_ITEMS).toContainEqual({
    kind: "route",
    href: "/tasks",
    label: "Tasks",
    icon: "tasks",
    active: "exact",
  });
});

test("exact Tasks is active only on /tasks", () => {
  const tasks: RouteNavItem = {
    kind: "route",
    href: "/tasks",
    label: "Tasks",
    icon: "tasks",
    active: "exact",
  };
  expect(isRouteActive(tasks, "/tasks")).toBe(true);
  expect(isRouteActive(tasks, "/meetings")).toBe(false);
  expect(isRouteActive(home, "/tasks")).toBe(false);
});

test("PageTitle treats /tasks as Tasks", async () => {
  const nav = await Bun.file(join(import.meta.dir, "../components/nav.tsx")).text();
  expect(nav).toContain('pathname.startsWith("/tasks")');
  expect(nav).toContain('setTitle("Tasks")');
});

test("sidebar route links prefetch on hover", async () => {
  const nav = await Bun.file(join(import.meta.dir, "../components/nav.tsx")).text();
  expect(nav).toContain("prefetch={prefetch ? null : false}");
  expect(nav).toContain("setPrefetch(true)");
});
