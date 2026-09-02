"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { homeHref, type HomeView } from "@lib/home";

export type MeetingSearchProps = {
  view: HomeView;
  hotkey: boolean;
  className: string;
};

export function MeetingSearch(props: MeetingSearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!props.hotkey) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [props.hotkey]);

  function hrefForQuery(nextQuery: string) {
    if (pathname === "/") {
      return homeHref({ ...props.view, query: nextQuery });
    }
    return homeHref({ tab: "all", query: nextQuery, fred: "unset" });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextQuery = String(data.get("q") ?? "");
    if (pathname === "/") {
      router.replace(hrefForQuery(nextQuery));
      return;
    }
    router.push(hrefForQuery(nextQuery));
  }

  return (
    <form className={`relative ${props.className}`} onSubmit={onSubmit}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted" />
      <Input
        ref={inputRef}
        key={props.view.query}
        name="q"
        defaultValue={props.view.query}
        placeholder="Search by title or keyword"
        className="h-7 rounded-full border-line bg-wash pr-2 pl-8 text-sm md:pr-12 md:text-[0.8rem]"
        aria-label="Search meetings"
      />
      {props.hotkey ? (
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-md border border-line bg-paper px-1 text-[0.65rem] text-muted md:inline">
          ⌘K
        </kbd>
      ) : null}
    </form>
  );
}
