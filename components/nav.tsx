"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Home,
  LayoutGrid,
  ListTodo,
  Mic,
  Settings,
  Sparkles,
  Video,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { assistantOpenHref, type HomeView } from "@lib/home";
import {
  isRouteActive,
  type HomeAssistantNavItem,
  type NavIcon,
  type NavItem,
  type PlaceholderNavItem,
  type RouteNavItem,
} from "@lib/nav";

const NAV_ICONS = {
  home: Home,
  meetings: Video,
  askfred: Sparkles,
  tasks: ListTodo,
  skills: WandSparkles,
  analytics: BarChart3,
  voice: Mic,
  integrations: LayoutGrid,
  settings: Settings,
} as const satisfies Record<NavIcon, LucideIcon>;

function navClass(active: boolean) {
  if (active) {
    return "flex w-full items-center gap-2.5 rounded-[10px] bg-nav px-2.5 py-2 text-left font-semibold text-ink";
  }
  return "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-gray-600";
}

function NavGlyph(props: { icon: NavIcon }) {
  const Icon = NAV_ICONS[props.icon];
  return <Icon className={cn("size-4.5 shrink-0", props.icon === "askfred" && "text-accent")} />;
}

export type NavProps = {
  items: NavItem[];
  pathname: string;
  view: HomeView | null;
};

function RouteLink(props: { item: RouteNavItem; pathname: string }) {
  const active = isRouteActive(props.item, props.pathname);
  return (
    <Link
      href={props.item.href}
      className={navClass(active)}
      aria-current={active ? "page" : undefined}
    >
      <NavGlyph icon={props.item.icon} />
      {props.item.label}
    </Link>
  );
}

function PlaceholderItem(props: { item: PlaceholderNavItem }) {
  return (
    <Tooltip>
      <TooltipTrigger type="button" className={navClass(false)} aria-disabled="true">
        <NavGlyph icon={props.item.icon} />
        {props.item.label}
      </TooltipTrigger>
      <TooltipContent side="right">Coming soon</TooltipContent>
    </Tooltip>
  );
}

function AssistantLink(props: { item: HomeAssistantNavItem; view: HomeView | null }) {
  return (
    <Link href={assistantOpenHref({ current: props.view })} className={navClass(false)}>
      <NavGlyph icon={props.item.icon} />
      {props.item.label}
    </Link>
  );
}

function NavItemView(props: { item: NavItem; pathname: string; view: HomeView | null }) {
  const item = props.item;
  if (item.kind === "route") {
    return <RouteLink item={item} pathname={props.pathname} />;
  }
  if (item.kind === "placeholder") {
    return <PlaceholderItem item={item} />;
  }
  return <AssistantLink item={item} view={props.view} />;
}

export function Nav(props: NavProps) {
  return (
    <nav className="grid gap-0.5">
      {props.items.map((item, index) => {
        const previous = index === 0 ? undefined : props.items[index - 1];
        const showSeparator = item.icon === "integrations" && previous?.icon !== "integrations";
        return (
          <div key={`${item.kind}-${item.label}`}>
            {showSeparator ? <Separator className="my-2" /> : null}
            <NavItemView item={item} pathname={props.pathname} view={props.view} />
          </div>
        );
      })}
    </nav>
  );
}

export function PageTitle() {
  const pathname = usePathname();
  const [title, setTitle] = useState("Home");
  useEffect(() => {
    setTitle(pathname.startsWith("/meetings") ? "Meetings" : "Home");
  }, [pathname]);
  return (
    <h1 className="m-0 hidden min-w-0 shrink-0 truncate text-[1.05rem] font-semibold md:block">
      {title}
    </h1>
  );
}
