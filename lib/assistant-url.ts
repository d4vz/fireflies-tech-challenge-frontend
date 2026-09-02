export type AssistantPresence = "open" | "closed";

export type AssistantLocation = {
  pathname: string;
  search: string;
  presence: AssistantPresence;
};

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
