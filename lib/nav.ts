export type AppRoute = "/" | "/meetings" | "/tasks";

export type NavIcon =
  | "home"
  | "meetings"
  | "askfred"
  | "tasks"
  | "skills"
  | "analytics"
  | "voice"
  | "integrations"
  | "settings";

export type RouteNavItem = {
  kind: "route";
  href: AppRoute;
  label: string;
  icon: NavIcon;
  active: "exact" | "meetings-tree";
};

export type PlaceholderNavItem = {
  kind: "placeholder";
  label: string;
  icon: NavIcon;
};

export type HomeAssistantNavItem = {
  kind: "home-assistant";
  label: "AskFred";
  icon: "askfred";
};

export type NavItem = RouteNavItem | PlaceholderNavItem | HomeAssistantNavItem;

export const NAV_ITEMS: NavItem[] = [
  { kind: "route", href: "/", label: "Home", icon: "home", active: "exact" },
  {
    kind: "route",
    href: "/meetings",
    label: "Meetings",
    icon: "meetings",
    active: "meetings-tree",
  },
  { kind: "home-assistant", label: "AskFred", icon: "askfred" },
  { kind: "route", href: "/tasks", label: "Tasks", icon: "tasks", active: "exact" },
  { kind: "placeholder", label: "AI Apps", icon: "skills" },
  { kind: "placeholder", label: "Analytics", icon: "analytics" },
  { kind: "placeholder", label: "Voice Agents", icon: "voice" },
  { kind: "placeholder", label: "Integrations", icon: "integrations" },
  { kind: "placeholder", label: "Settings", icon: "settings" },
];

export function isRouteActive(item: RouteNavItem, pathname: string): boolean {
  if (item.active === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
