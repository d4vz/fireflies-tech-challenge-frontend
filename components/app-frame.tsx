"use client";

import { Menu, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Capture } from "@components/capture";
import { Nav, PageTitle } from "@components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WORKSPACE_NAME } from "@lib/chrome";
import { assistantOpenHref, homeHref, parseHomeView, type HomeView } from "@lib/home";
import { NAV_ITEMS } from "@lib/nav";

export type AppFrameProps = {
  children: ReactNode;
};

function viewFromParams(params: URLSearchParams): HomeView {
  return parseHomeView({
    tab: params.get("tab") ?? undefined,
    q: params.get("q") ?? undefined,
    fred: params.get("fred") ?? undefined,
  });
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

type HeaderSearchProps = {
  pathname: string;
  view: HomeView;
};

function HeaderSearch(props: HeaderSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function hrefForQuery(nextQuery: string) {
    if (props.pathname === "/") {
      return homeHref({ ...props.view, query: nextQuery });
    }
    return homeHref({ tab: "all", query: nextQuery, fred: "unset" });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextQuery = String(data.get("q") ?? "");
    if (props.pathname === "/") {
      router.replace(hrefForQuery(nextQuery));
      return;
    }
    router.push(hrefForQuery(nextQuery));
  }

  return (
    <form className="relative min-w-0 flex-1" onSubmit={onSubmit}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <Input
        ref={inputRef}
        key={props.view.query}
        name="q"
        defaultValue={props.view.query}
        placeholder="Search by title or keyword"
        className="h-9 rounded-full border-line bg-wash pr-14 pl-9"
        aria-label="Search meetings"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line bg-paper px-1.5 text-[0.7rem] text-muted">
        ⌘K
      </kbd>
    </form>
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
  const view = viewFromParams(searchParams);
  const homeView = pathname === "/" ? view : null;
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <TooltipProvider>
      <div className="grid h-screen overflow-hidden md:grid-cols-[232px_1fr]">
        <aside className="hidden min-h-0 flex-col gap-6 overflow-y-auto border-r border-line bg-paper px-3.5 py-[1.15rem] md:flex">
          <NavPane pathname={pathname} view={homeView} />
        </aside>
        <div className="grid min-h-0 min-w-0 grid-rows-[64px_1fr]">
          <header className="flex items-center gap-3 border-b border-line bg-paper px-4 md:gap-4 md:px-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setNavOpen(true)}
            >
              <Menu />
            </Button>
            <PageTitle />
            <HeaderSearch pathname={pathname} view={view} />
            <Button asChild variant="ghost" size="sm" className="xl:hidden">
              <Link href={assistantOpenHref({ current: homeView })}>
                <Sparkles />
                AskFred
              </Link>
            </Button>
            <Capture />
          </header>
          <div className="min-h-0 overflow-hidden">{props.children}</div>
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
