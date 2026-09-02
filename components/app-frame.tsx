"use client";

import { UserButton } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Menu, Sparkles } from "@animateicons/react/lucide";
import type { IconHandle } from "@animateicons/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Capture } from "@components/capture";
import { Nav, PageTitle } from "@components/nav";
import { Button } from "@/components/ui/button";
import { handleHover } from "@lib/handle-hover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  assistantOpenClickKind,
  assistantOpenHref,
  isPlainLeftClick,
  parseHomeViewFromSearch,
  pushHomeUrl,
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

function AccountButton() {
  return (
    <div aria-label="Account" className="size-9 shrink-0">
      <UserButton
        appearance={{
          theme: shadcn,
          elements: {
            rootBox: "!size-9",
            userButtonBox: "!size-9",
            userButtonTrigger: "!size-9",
            userButtonAvatarBox: "!size-9",
            userButtonAvatarImage: "!size-9",
            avatarBox: "!size-9",
          },
        }}
        fallback={<span aria-hidden="true" className="block size-9 rounded-full bg-nav" />}
      />
    </div>
  );
}

function BrandMark() {
  return (
    <Link className="block px-2 py-1.5" href="/">
      <img
        alt="Fireflies"
        className="h-6 w-auto"
        height={24}
        src="/fireflies-logo.svg"
        width={118}
      />
    </Link>
  );
}

type NavPaneProps = {
  pathname: string;
  view: HomeView | null;
};

function NavPane(props: NavPaneProps) {
  return (
    <>
      <BrandMark />
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
  const menuRef = useRef<IconHandle>(null);
  const askFredRef = useRef<IconHandle>(null);

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
              onMouseEnter={(event) => handleHover(event, menuRef)}
              onMouseLeave={(event) => handleHover(event, menuRef)}
            >
              <Menu ref={menuRef} size={20} />
            </Button>
            <PageTitle />
            <div className="min-w-0 flex-1" />
            <Link
              href={assistantOpenHref({ current: homeView })}
              aria-label="AskFred"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-line bg-paper px-3 font-semibold text-ink hover:border-accent/30 hover:bg-process-wash"
              onMouseEnter={(event) => handleHover(event, askFredRef)}
              onMouseLeave={(event) => handleHover(event, askFredRef)}
              onClick={(event) => {
                if (assistantOpenClickKind(homeView, isPlainLeftClick(event)) !== "push") {
                  return;
                }
                if (homeView === null) {
                  return;
                }
                event.preventDefault();
                pushHomeUrl({ ...homeView, fred: "open" });
              }}
            >
              <Sparkles ref={askFredRef} className="text-accent" size={16} />
              AskFred
            </Link>
            <Capture />
            <AccountButton />
          </header>
          <div className="min-h-0 min-w-0 overflow-hidden">{props.children}</div>
        </div>
      </div>
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-[232px] p-0 sm:max-w-[232px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3.5 py-[1.15rem]">
            <NavPane pathname={pathname} view={homeView} />
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
