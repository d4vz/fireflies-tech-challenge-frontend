"use client";

import { Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Capture } from "@components/capture";
import { MeetingSearch } from "@components/meeting-search";
import { Nav, PageTitle } from "@components/nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WORKSPACE_NAME } from "@lib/chrome";
import {
  assistantOpenHref,
  parseHomeViewFromSearch,
  subscribeHomeUrl,
  type HomeView,
} from "@lib/home";
import { NAV_ITEMS } from "@lib/nav";

export type AppFrameProps = {
  children: ReactNode;
};

function homeSearchSnapshot(): string {
  return window.location.search;
}

function WorkspaceMark() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 text-ink">
      <span className="grid size-7 place-items-center rounded-full bg-process-wash text-xs font-bold text-accent">
        {WORKSPACE_NAME.slice(0, 1)}
      </span>
      <span className="text-[0.95rem] font-semibold">{WORKSPACE_NAME}</span>
    </div>
  );
}

type NavPaneProps = {
  pathname: string;
  view: HomeView | null;
};

function NavPane(props: NavPaneProps) {
  return (
    <>
      <WorkspaceMark />
      <Nav items={NAV_ITEMS} pathname={props.pathname} view={props.view} />
    </>
  );
}

export function AppFrame(props: AppFrameProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const liveSearch = useSyncExternalStore(
    subscribeHomeUrl,
    homeSearchSnapshot,
    () => `?${searchParams.toString()}`,
  );
  const view = parseHomeViewFromSearch(liveSearch);
  const homeView = pathname === "/" ? view : null;
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <TooltipProvider>
      <div className="grid h-screen min-w-0 overflow-hidden md:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col gap-6 overflow-y-auto border-r border-line bg-paper px-3.5 py-[1.15rem] md:flex">
          <NavPane pathname={pathname} view={homeView} />
        </aside>
        <div className="grid min-h-0 min-w-0 grid-rows-[64px_minmax(0,1fr)]">
          <header className="flex min-w-0 items-center gap-2 border-b border-line bg-paper px-3 md:gap-4 md:px-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              aria-label="Open navigation"
              onClick={() => setNavOpen(true)}
            >
              <Menu />
            </Button>
            <PageTitle />
            <div className="min-w-0 flex-1" />
            <MeetingSearch
              className="hidden min-w-0 w-full max-w-sm md:block"
              hotkey={true}
              view={view}
            />
            <Link
              href={assistantOpenHref({ current: homeView })}
              aria-label="AskFred"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-line bg-paper px-3 py-2 font-semibold text-ink hover:bg-nav"
            >
              <Sparkles className="size-4 text-accent" />
              AskFred
            </Link>
            <Capture />
          </header>
          <div className="min-h-0 min-w-0 overflow-hidden">{props.children}</div>
        </div>
      </div>
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-[232px] p-0 sm:max-w-[232px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-col gap-6 overflow-y-auto px-3.5 py-[1.15rem]">
            <NavPane pathname={pathname} view={homeView} />
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
