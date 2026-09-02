import {
  assistantHref,
  parseAssistantLocation,
  type AssistantLocation,
  type AssistantPresence,
} from "@lib/assistant-url";

export type ClickModifiers = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

export type AssistantPresenceView = {
  open: boolean;
  openHref: string;
  closeHref: string;
};

const APP_URL_EVENT = "fireflies-app-url";

let historyPatched = false;
let notifyQueued = false;

function notifyAppUrl(): void {
  if (notifyQueued) {
    return;
  }
  notifyQueued = true;
  queueMicrotask(() => {
    notifyQueued = false;
    window.dispatchEvent(new Event(APP_URL_EVENT));
  });
}

function patchHistory(): void {
  if (historyPatched) {
    return;
  }
  historyPatched = true;
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  history.pushState = (data, unused, url) => {
    push(data, unused, url);
    notifyAppUrl();
  };
  history.replaceState = (data, unused, url) => {
    replace(data, unused, url);
    notifyAppUrl();
  };
}

export function assistantPresenceOf(pathname: string, search: string): AssistantPresenceView {
  const location = parseAssistantLocation(pathname, search);
  return {
    open: location.presence === "open",
    openHref: assistantHref(location, "open"),
    closeHref: assistantHref(location, "closed"),
  };
}

export function pushAppUrl(href: string): void {
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === href) {
    return;
  }
  window.history.pushState(null, "", href);
  window.dispatchEvent(new Event(APP_URL_EVENT));
}

export function subscribeAppUrl(onChange: () => void): () => void {
  patchHistory();
  window.addEventListener("popstate", onChange);
  window.addEventListener(APP_URL_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(APP_URL_EVENT, onChange);
  };
}

export function onAssistantPresenceClick(
  event: ClickModifiers & { preventDefault(): void },
  location: AssistantLocation,
  presence: AssistantPresence,
): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  pushAppUrl(assistantHref(location, presence));
}
