export type HomeTab = "all" | "ready" | "busy" | "failed";

export type FredParam = "unset" | "open" | "closed";

export type HomeView = {
  tab: HomeTab;
  query: string;
  fred: FredParam;
};

export type RawSearchParam = string | string[] | undefined;

export type HomeSearchParams = {
  tab?: RawSearchParam;
  q?: RawSearchParam;
  fred?: RawSearchParam;
};

export type AssistantHrefInput = {
  current: HomeView | null;
};

export type AssistantChrome = {
  sheetOpen: boolean;
  dockHidden: boolean;
};

function firstString(value: RawSearchParam): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function parseTab(value: string): HomeTab {
  if (value === "ready" || value === "busy" || value === "failed") {
    return value;
  }
  return "all";
}

function parseFred(value: string): FredParam {
  if (value === "1") {
    return "open";
  }
  if (value === "0") {
    return "closed";
  }
  return "unset";
}

export function parseHomeView(params: HomeSearchParams): HomeView {
  return {
    tab: parseTab(firstString(params.tab)),
    query: firstString(params.q),
    fred: parseFred(firstString(params.fred)),
  };
}

export function homeHref(view: HomeView): string {
  const params = new URLSearchParams();
  if (view.tab !== "all") {
    params.set("tab", view.tab);
  }
  if (view.query !== "") {
    params.set("q", view.query);
  }
  if (view.fred === "open") {
    params.set("fred", "1");
  }
  if (view.fred === "closed") {
    params.set("fred", "0");
  }
  const query = params.toString();
  if (query === "") {
    return "/";
  }
  return `/?${query}`;
}

export function assistantOpenHref(input: AssistantHrefInput): string {
  if (input.current === null) {
    return "/?fred=1";
  }
  return homeHref({ ...input.current, fred: "open" });
}

export function assistantChrome(fred: FredParam): AssistantChrome {
  return {
    sheetOpen: fred === "open",
    dockHidden: fred === "closed",
  };
}
