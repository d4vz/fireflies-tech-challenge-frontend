export type AssistantOpen = boolean;

export type AppLocation = {
  pathname: string;
  search: string;
};

export type AssistantOpenClickKind = "ignore" | "push";

const APP_URL_EVENT = "fireflies-app-url";

function searchParamsOf(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

export function parseAssistantOpen(search: string): AssistantOpen {
  return searchParamsOf(search).get("fred") === "1";
}

export function appLocation(pathname: string, search: string): AppLocation {
  return { pathname, search };
}

export function locationHref(location: AppLocation, open: AssistantOpen): string {
  const params = searchParamsOf(location.search);
  if (open) {
    params.set("fred", "1");
  } else {
    params.delete("fred");
  }
  const query = params.toString();
  if (query === "") {
    return location.pathname;
  }
  return `${location.pathname}?${query}`;
}

export function assistantOpenHref(location: AppLocation): string {
  return locationHref(location, true);
}

export function assistantCloseHref(location: AppLocation): string {
  return locationHref(location, false);
}

export function assistantOpenClickKind(isPlain: boolean): AssistantOpenClickKind {
  if (!isPlain) {
    return "ignore";
  }
  return "push";
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
  window.addEventListener("popstate", onChange);
  window.addEventListener(APP_URL_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(APP_URL_EVENT, onChange);
  };
}
