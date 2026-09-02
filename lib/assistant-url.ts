export type AssistantPresence = "open" | "closed";

export type AssistantLocation = {
  pathname: string;
  search: string;
  presence: AssistantPresence;
};

export type ClickModifiers = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

const APP_URL_EVENT = "fireflies-app-url";

function searchParamsOf(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

function hrefFrom(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  if (query === "") {
    return pathname;
  }
  return `${pathname}?${query}`;
}

export function parseAssistantLocation(pathname: string, search: string): AssistantLocation {
  const params = searchParamsOf(search);
  const presence: AssistantPresence = params.get("fred") === "1" ? "open" : "closed";
  params.delete("fred");
  const query = params.toString();
  return {
    pathname,
    search: query === "" ? "" : `?${query}`,
    presence,
  };
}

export function assistantHref(location: AssistantLocation, presence: AssistantPresence): string {
  const params = searchParamsOf(location.search);
  params.delete("fred");
  switch (presence) {
    case "open":
      params.set("fred", "1");
      break;
    case "closed":
      break;
    default: {
      const _exhaustive: never = presence;
      return _exhaustive;
    }
  }
  return hrefFrom(location.pathname, params);
}

export function applyAssistantPresence(href: string, presence: AssistantPresence): string {
  const url = new URL(href, "http://local.invalid");
  return assistantHref(parseAssistantLocation(url.pathname, url.search), presence);
}

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
