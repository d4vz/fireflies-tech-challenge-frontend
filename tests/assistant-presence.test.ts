import { expect, test } from "bun:test";
import { parseAssistantLocation } from "@lib/assistant-url";
import { assistantPresenceOf, onAssistantPresenceClick } from "@lib/assistant-presence";

test("assistantPresenceOf exposes open, openHref, and closeHref", () => {
  expect(assistantPresenceOf("/meetings", "?page=2&fred=1")).toEqual({
    open: true,
    openHref: "/meetings?page=2&fred=1",
    closeHref: "/meetings?page=2",
  });
  expect(assistantPresenceOf("/meetings", "")).toEqual({
    open: false,
    openHref: "/meetings?fred=1",
    closeHref: "/meetings",
  });
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
