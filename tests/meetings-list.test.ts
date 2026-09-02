import { expect, test } from "bun:test";
import { join } from "node:path";

test("Meetings list uses underline status tabs and keeps them while rows skeleton", async () => {
  const list = await Bun.file(
    join(import.meta.dir, "../app/(app)/meetings/meetings-list.tsx"),
  ).text();
  const skeleton = await Bun.file(join(import.meta.dir, "../components/skeleton.tsx")).text();
  const page = list.slice(list.indexOf("export function MeetingsList"));
  const bones = skeleton.slice(
    skeleton.indexOf("export function MeetingsListSkeleton"),
    skeleton.indexOf("export function HomeDashboardSkeleton"),
  );
  expect(page).toContain("FilterTab");
  expect(page).toContain('label="All"');
  expect(page).toContain('label="Ready"');
  expect(page).toContain('label="Processing"');
  expect(page).toContain('label="Failed"');
  expect(list).toContain("MeetingsListSkeleton");
  expect(bones.includes("border-b border-line")).toBe(false);
  expect(bones.includes("mb-px")).toBe(false);
});

test("Meetings list is a one-column card grid on mobile", async () => {
  const list = await Bun.file(
    join(import.meta.dir, "../app/(app)/meetings/meetings-list.tsx"),
  ).text();
  const skeleton = await Bun.file(join(import.meta.dir, "../components/skeleton.tsx")).text();
  const bones = skeleton.slice(
    skeleton.indexOf("export function MeetingsListSkeleton"),
    skeleton.indexOf("export function HomeDashboardSkeleton"),
  );
  expect(list).toContain("grid-cols-1");
  expect(list).toContain("md:grid-cols-2");
  expect(list).toContain("xl:grid-cols-3");
  expect(list).toContain('layout="card"');
  expect(list.includes('layout="aside"')).toBe(false);
  expect(bones).toContain("MeetingCardBone");
  expect(bones).toContain("grid-cols-1");
  expect(bones).toContain("xl:grid-cols-3");
  expect(bones.includes("MeetingAsideBone")).toBe(false);
});

test("Meetings BFF forwards status", async () => {
  const route = await Bun.file(join(import.meta.dir, "../app/api/meetings/route.ts")).text();
  expect(route).toContain("parseMeetingStatus");
  expect(route).toContain("listMeetings(page, limit, status)");
});

test("Meetings and Tasks pagers sit on the right", async () => {
  const meetings = await Bun.file(
    join(import.meta.dir, "../app/(app)/meetings/meetings-list.tsx"),
  ).text();
  const tasks = await Bun.file(join(import.meta.dir, "../app/(app)/tasks/tasks-list.tsx")).text();
  const pager = await Bun.file(join(import.meta.dir, "../components/list-pager.tsx")).text();
  expect(meetings).toContain("ListPager");
  expect(tasks).toContain("ListPager");
  expect(pager).toContain("justify-end");
  expect(pager).toContain("Previous");
  expect(pager).toContain("Next");
  expect(pager).toContain("Page {props.page} of {props.pageCount}");
});
