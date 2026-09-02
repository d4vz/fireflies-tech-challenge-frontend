"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type Ref } from "react";
import {
  ChartBar,
  House,
  LayoutGrid,
  ListChecks,
  Mic,
  Settings,
  Sparkles,
  Star,
  Video,
} from "@animateicons/react/lucide";
import type { IconHandle } from "@animateicons/react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { handleHover } from "@lib/handle-hover";
import { useAssistantPresence } from "@/hooks/use-assistant-presence";
import {
  isRouteActive,
  type AssistantNavItem,
  type NavIcon,
  type NavItem,
  type PlaceholderNavItem,
  type RouteNavItem,
} from "@lib/nav";

type NavGlyphIcon = typeof House;

const NAV_ICONS = {
  home: House,
  meetings: Video,
  askfred: Sparkles,
  tasks: ListChecks,
  skills: Star,
  analytics: ChartBar,
  voice: Mic,
  integrations: LayoutGrid,
  settings: Settings,
} as const satisfies Record<NavIcon, NavGlyphIcon>;

function navClass(active: boolean) {
  if (active) {
    return "relative flex w-full items-center gap-2.5 rounded-[10px] bg-nav px-2.5 py-2 text-left font-semibold text-ink before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-accent";
  }
  return "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-gray-600 transition-colors hover:bg-nav/70 hover:text-ink";
}

function NavGlyph(props: { icon: NavIcon; iconRef: Ref<IconHandle> }) {
  const Icon = NAV_ICONS[props.icon];
  return (
    <Icon
      ref={props.iconRef}
      className={cn("shrink-0", props.icon === "askfred" && "text-accent")}
      size={18}
    />
  );
}

export type NavProps = {
  items: NavItem[];
  pathname: string;
};

function RouteLink(props: { item: RouteNavItem; pathname: string }) {
  const iconRef = useRef<IconHandle>(null);
  const [prefetch, setPrefetch] = useState(false);
  const active = isRouteActive(props.item, props.pathname);
  return (
    <Link
      href={props.item.href}
      prefetch={prefetch ? null : false}
      className={navClass(active)}
      aria-current={active ? "page" : undefined}
      onMouseEnter={(event) => {
        setPrefetch(true);
        handleHover(event, iconRef);
      }}
      onMouseLeave={(event) => handleHover(event, iconRef)}
    >
      <NavGlyph icon={props.item.icon} iconRef={iconRef} />
      {props.item.label}
    </Link>
  );
}

function PlaceholderItem(props: { item: PlaceholderNavItem }) {
  const iconRef = useRef<IconHandle>(null);
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={navClass(false)}
        aria-disabled="true"
        onMouseEnter={(event) => handleHover(event, iconRef)}
        onMouseLeave={(event) => handleHover(event, iconRef)}
      >
        <NavGlyph icon={props.item.icon} iconRef={iconRef} />
        {props.item.label}
      </TooltipTrigger>
      <TooltipContent side="right">Coming soon</TooltipContent>
    </Tooltip>
  );
}

function AssistantLink(props: { item: AssistantNavItem }) {
  const iconRef = useRef<IconHandle>(null);
  const assistant = useAssistantPresence();
  return (
    <Link
      href={assistant.openHref}
      className={navClass(false)}
      onMouseEnter={(event) => handleHover(event, iconRef)}
      onMouseLeave={(event) => handleHover(event, iconRef)}
      onClick={assistant.onOpenClick}
    >
      <NavGlyph icon={props.item.icon} iconRef={iconRef} />
      {props.item.label}
    </Link>
  );
}

function NavItemView(props: { item: NavItem; pathname: string }) {
  const item = props.item;
  switch (item.kind) {
    case "route":
      return <RouteLink item={item} pathname={props.pathname} />;
    case "placeholder":
      return <PlaceholderItem item={item} />;
    case "assistant":
      return <AssistantLink item={item} />;
    default: {
      const _exhaustive: never = item;
      return _exhaustive;
    }
  }
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
            <NavItemView item={item} pathname={props.pathname} />
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
    if (pathname.startsWith("/meetings")) {
      setTitle("Meetings");
      return;
    }
    if (pathname.startsWith("/tasks")) {
      setTitle("Tasks");
      return;
    }
    setTitle("Home");
  }, [pathname]);
  return (
    <h1 className="m-0 hidden min-w-0 shrink-0 truncate text-[1.05rem] font-semibold md:block">
      {title}
    </h1>
  );
}
