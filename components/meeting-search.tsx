"use client";

import { Search } from "@animateicons/react/lucide";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { MeetingRow } from "@components/meeting-row";
import {
  meetingSearchPanel,
  MEETING_SEARCH_LIMIT,
  type MeetingSearchPanel,
} from "@lib/meeting-search";
import { parseMeetingTextQuery } from "@lib/meetings";
import { meetingsListQuery } from "@lib/query-policy";

function MeetingSearchResults(props: { panel: MeetingSearchPanel }) {
  const panel = props.panel;
  switch (panel.kind) {
    case "closed":
      return null;
    case "loading":
      return <p className="px-2 py-3 text-sm text-muted-foreground">Searching meetings</p>;
    case "empty":
      return (
        <div className="px-2 py-4 text-center">
          <p className="m-0 text-sm font-semibold text-ink">No matching meetings</p>
          <p className="mt-1 mb-0 text-sm text-muted-foreground">
            Try another title or summary word.
          </p>
        </div>
      );
    case "failed":
      return <p className="px-2 py-3 text-sm text-destructive">could not load meetings</p>;
    case "results":
      return (
        <DropdownMenuGroup className="grid gap-1">
          {panel.items.map((meeting) => (
            <DropdownMenuItem
              asChild
              className="grid h-[4.5rem] items-start gap-3 overflow-hidden p-0 focus:bg-nav"
              key={meeting._id}
            >
              <MeetingRow layout="menu" meeting={meeting} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      );
    default: {
      const _exhaustive: never = panel;
      return _exhaustive;
    }
  }
}

export function MeetingSearch() {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const q = parseMeetingTextQuery(draft);
  const query = useQuery({
    ...meetingsListQuery(1, MEETING_SEARCH_LIMIT, "all", q),
    enabled: q !== "",
  });
  const panel = meetingSearchPanel(q, open, query.data, query.error);

  function onOpenChange(next: boolean) {
    if (q === "") {
      setOpen(false);
      return;
    }
    setOpen(next);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (q !== "") {
      setOpen(true);
    }
  }

  return (
    <DropdownMenu modal={false} onOpenChange={onOpenChange} open={open}>
      <form className="min-w-0 max-w-xl flex-1" onSubmit={onSubmit}>
        <DropdownMenuTrigger asChild>
          <div className="w-full">
            <InputGroup className="h-9">
              <InputGroupInput
                aria-controls="meeting-search-results"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label="Search meetings"
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft(value);
                  setOpen(parseMeetingTextQuery(value) !== "");
                }}
                onFocus={() => {
                  if (q !== "") {
                    setOpen(true);
                  }
                }}
                onPointerDown={(event) => {
                  if (open) {
                    event.stopPropagation();
                  }
                }}
                placeholder="Search titles and summaries"
                role="combobox"
                type="search"
                value={draft}
              />
              <InputGroupAddon>
                <Search aria-hidden="true" className="size-4 opacity-50" size={16} />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </DropdownMenuTrigger>
      </form>
      <DropdownMenuContent
        align="start"
        className="w-[min(36rem,calc(100vw-1.5rem))] p-1.5"
        collisionPadding={8}
        id="meeting-search-results"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        role="listbox"
        sideOffset={8}
      >
        <MeetingSearchResults panel={panel} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
