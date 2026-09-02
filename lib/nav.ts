export type AppRoute = "/" | "/meetings" | "/tasks";

export type NavIcon = "home" | "meetings" | "askfred" | "tasks";

export type RouteNavItem = {
  kind: "route";
  href: AppRoute;
  label: string;
  icon: NavIcon;
  active: "exact" | "meetings-tree";
};

export type AssistantNavItem = {
  kind: "assistant";
  label: "AskFred";
  icon: "askfred";
};

export type NavItem = RouteNavItem | AssistantNavItem;

export const NAV_ITEMS: NavItem[] = [
  { kind: "route", href: "/", label: "Home", icon: "home", active: "exact" },
  {
    kind: "route",
    href: "/meetings",
    label: "Meetings",
    icon: "meetings",
    active: "meetings-tree",
  },
  { kind: "assistant", label: "AskFred", icon: "askfred" },
  { kind: "route", href: "/tasks", label: "Tasks", icon: "tasks", active: "exact" },
];

export function isRouteActive(item: RouteNavItem, pathname: string): boolean {
  if (item.active === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
