import { expect, test } from "bun:test";
import { join } from "node:path";
import {
  applyAssistantPresence,
  assistantHref,
  onAssistantPresenceClick,
  parseAssistantLocation,
} from "@lib/assistant-url";

test("parseAssistantLocation reads open fred on the current pathname", () => {
  expect(parseAssistantLocation("/meetings", "?fred=1")).toEqual({
    pathname: "/meetings",
    search: "",
    presence: "open",
  });
});

test("parseAssistantLocation is closed when fred is missing", () => {
  expect(parseAssistantLocation("/meetings", "")).toEqual({
    pathname: "/meetings",
    search: "",
    presence: "closed",
  });
});

test("parseAssistantLocation treats fred=0, garbage, and missing as closed", () => {
  expect(parseAssistantLocation("/meetings", "?fred=0").presence).toBe("closed");
  expect(parseAssistantLocation("/meetings", "?fred=garbage").presence).toBe("closed");
  expect(parseAssistantLocation("/meetings", "?fred=open").presence).toBe("closed");
  expect(parseAssistantLocation("/meetings", "").presence).toBe("closed");
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
  expect(parseAssistantLocation("/meetings", "fred=1").search.includes("fred")).toBe(false);
});

test("assistantHref open keeps the current pathname and never rehomes to /", () => {
  const meetings = parseAssistantLocation("/meetings", "");
  expect(assistantHref(meetings, "open")).toBe("/meetings?fred=1");
  expect(assistantHref(meetings, "open").startsWith("/?")).toBe(false);

  const homeLoc = parseAssistantLocation("/", "?tab=busy&q=eng");
  expect(assistantHref(homeLoc, "open")).toBe("/?tab=busy&q=eng&fred=1");

  const meetingsPaged = parseAssistantLocation("/meetings", "?status=ready&page=2");
  expect(assistantHref(meetingsPaged, "open")).toBe("/meetings?status=ready&page=2&fred=1");
});

test("assistantHref closed omits fred and never writes fred=0", () => {
  const meetingsOpen = parseAssistantLocation("/meetings", "?fred=1");
  expect(assistantHref(meetingsOpen, "closed")).toBe("/meetings");
  expect(assistantHref(meetingsOpen, "closed").includes("fred")).toBe(false);
  expect(assistantHref(meetingsOpen, "closed").includes("fred=0")).toBe(false);

  const homeOpen = parseAssistantLocation("/", "?tab=busy&fred=1");
  expect(assistantHref(homeOpen, "closed")).toBe("/?tab=busy");

  const alreadyClosed = parseAssistantLocation("/meetings", "?fred=0");
  expect(assistantHref(alreadyClosed, "closed")).toBe("/meetings");
  expect(assistantHref(parseAssistantLocation("/", ""), "closed")).toBe("/");
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
  expect(applyAssistantPresence("/meetings?fred=1", "open")).toBe("/meetings?fred=1");
  expect(applyAssistantPresence("/?tab=busy&fred=1", "closed")).toBe("/?tab=busy");
});

test("assistant-url has no navigate branch", async () => {
  const source = await Bun.file(join(import.meta.dir, "../lib/assistant-url.ts")).text();
  expect(source.includes('"navigate"')).toBe(false);
  expect(source.includes("'navigate'")).toBe(false);
});

test("assistant-url uses fireflies-app-url and the new public surface", async () => {
  const source = await Bun.file(join(import.meta.dir, "../lib/assistant-url.ts")).text();
  expect(source).toContain("fireflies-app-url");
  expect(source.includes("fireflies-home-url")).toBe(false);
  expect(source.includes("AppLocation")).toBe(false);
  expect(source.includes("appLocation")).toBe(false);
  expect(source.includes("AssistantOpen")).toBe(false);
  expect(source.includes("parseAssistantOpen")).toBe(false);
  expect(source.includes("locationHref")).toBe(false);
  expect(source.includes("assistantOpenHref")).toBe(false);
  expect(source.includes("assistantCloseHref")).toBe(false);
  expect(source.includes("assistantOpenClickKind")).toBe(false);
  expect(source).toContain("history.pushState =");
  expect(source).toContain("history.replaceState =");
  expect(source).toContain("queueMicrotask");
});

function clickEvent(overrides: {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}) {
  let prevented = false;
  return {
    button: overrides.button ?? 0,
    metaKey: overrides.metaKey ?? false,
    ctrlKey: overrides.ctrlKey ?? false,
    shiftKey: overrides.shiftKey ?? false,
    altKey: overrides.altKey ?? false,
    preventDefault() {
      prevented = true;
    },
    wasPrevented() {
      return prevented;
    },
  };
}

type AppUrlWindow = {
  location: { pathname: string; search: string };
  history: {
    pushState(data: null, unused: string, url?: string): void;
  };
  dispatchEvent(event: Event): boolean;
};

test("onAssistantPresenceClick preventDefault and push on a plain left click", () => {
  const location = parseAssistantLocation("/meetings", "");
  const event = clickEvent({});
  const pushed: string[] = [];
  const dispatched: string[] = [];
  const host: { window?: AppUrlWindow } = globalThis;
  const previous = host.window;
  host.window = {
    location: { pathname: "/", search: "" },
    history: {
      pushState(_data: null, _unused: string, url?: string) {
        pushed.push(url ?? "");
      },
    },
    dispatchEvent(event: Event) {
      dispatched.push(event.type);
      return true;
    },
  };
  try {
    onAssistantPresenceClick(event, location, "open");
  } finally {
    host.window = previous;
  }
  expect(event.wasPrevented()).toBe(true);
  expect(pushed).toEqual(["/meetings?fred=1"]);
  expect(dispatched).toEqual(["fireflies-app-url"]);
});

test("onAssistantPresenceClick ignores modified clicks", () => {
  const location = parseAssistantLocation("/meetings", "");
  const event = clickEvent({ metaKey: true });
  onAssistantPresenceClick(event, location, "open");
  expect(event.wasPrevented()).toBe(false);
});
