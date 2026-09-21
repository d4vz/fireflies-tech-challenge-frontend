"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { meetingsSearchTarget, parseMeetingTextQuery } from "@lib/meetings";

export function MeetingSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = parseMeetingTextQuery(searchParams.get("q"));
  const [draft, setDraft] = useState(pathname === "/meetings" ? q : "");

  useEffect(() => {
    if (pathname === "/meetings") {
      setDraft(q);
    }
  }, [pathname, q]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(meetingsSearchTarget(pathname, searchParams.get("status"), draft));
  }

  return (
    <form className="min-w-0 max-w-xl flex-1" onSubmit={onSearch}>
      <Input
        aria-label="Search meetings"
        className="h-9"
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search titles and summaries"
        type="search"
        value={draft}
      />
    </form>
  );
}
