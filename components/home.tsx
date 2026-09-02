"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { AskFredProps } from "@components/ask-fred";
import { useQuery } from "@tanstack/react-query";
import { ListChecks, ListVideo, Loader, Sparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { MeetingRow } from "@components/meeting-row";
import { MeetingSearch } from "@components/meeting-search";
import { HomeDashboardSkeleton } from "@components/skeleton";
import { WorkspaceCanvas } from "@components/workspace-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WORKSPACE_NAME } from "@lib/chrome";
import {
  assistantChrome,
  homeHref,
  isPlainLeftClick,
  parseHomeViewFromSearch,
  pushHomeUrl,
  subscribeHomeUrl,
  toHomeModel,
  type FredParam,
  type HomeModel,
  type HomeTab,
  type HomeView,
  type InsightCard,
  type InsightCoverage,
} from "@lib/home";
import { listMeetings } from "@lib/api";
import { HOME_DASHBOARD_LIMIT, isBusy, meetingsListKey, type MeetingListPage } from "@lib/meetings";

export type HomeDashboardProps = {
  view: HomeView;
  initialPage: MeetingListPage | undefined;
};

export type HomeCanvasProps = {
  model: HomeModel;
  fred: FredParam;
  onTabClick: (event: MouseEvent<HTMLAnchorElement>, tab: HomeTab) => void;
};

const AskFred = dynamic(() => import("@components/ask-fred").then((mod) => mod.AskFred), {
  ssr: false,
});

const HOME_TABS: { tab: HomeTab; label: string }[] = [
  { tab: "all", label: "All" },
  { tab: "ready", label: "Ready" },
  { tab: "busy", label: "Busy" },
  { tab: "failed", label: "Failed" },
];

function greetingTitle(model: HomeModel): string {
  const name = model.greeting.workspaceName;
  if (model.greeting.period === "morning") {
    return `Good Morning, ${name} 👋`;
  }
  if (model.greeting.period === "afternoon") {
    return `Good Afternoon, ${name} 👋`;
  }
  return `Good Evening, ${name} 👋`;
}

function coverageNote(coverage: InsightCoverage): string | undefined {
  if (coverage.kind === "complete") {
    return undefined;
  }
  return `From ${coverage.sampled} of ${coverage.total}`;
}

type InsightCopy = {
  title: string;
  body: string;
  metric: string;
  note?: string;
};

function insightCopy(card: InsightCard): InsightCopy {
  if (card.kind === "meeting-count") {
    return { title: "Meetings", body: `${card.total} in the library`, metric: String(card.total) };
  }
  if (card.kind === "busy-count") {
    return {
      title: "In progress",
      body: `${card.count} processing`,
      metric: String(card.count),
      note: coverageNote(card.coverage),
    };
  }
  return {
    title: "Tasks",
    body: `${card.count} action items`,
    metric: String(card.count),
    note: coverageNote(card.coverage),
  };
}

function InsightIcon(props: { kind: InsightCard["kind"] }) {
  if (props.kind === "meeting-count") {
    return <ListVideo className="size-5 text-blue-600" />;
  }
  if (props.kind === "busy-count") {
    return <Loader className="size-5 text-orange-600" />;
  }
  return <ListChecks className="size-5 text-green-700" />;
}

function InsightCardView(props: { card: InsightCard }) {
  const copy = insightCopy(props.card);
  return (
    <Card className="bg-paper shadow-[0_1px_2px_rgba(16,18,27,0.06)] ring-line">
      <CardHeader className="flex flex-col items-center gap-1.5 md:flex-row md:items-center md:gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-wash md:size-10">
          <InsightIcon kind={props.card.kind} />
        </span>
        <p className="m-0 text-lg font-semibold tabular-nums md:hidden">{copy.metric}</p>
        <p className="sr-only md:hidden">{`${copy.title}: ${copy.body}`}</p>
        <div className="hidden min-w-0 md:block">
          <CardTitle className="truncate">{copy.title}</CardTitle>
          <CardDescription className="text-muted-foreground">{copy.body}</CardDescription>
          {copy.note ? <p className="m-0 text-xs text-muted-foreground">{copy.note}</p> : null}
        </div>
      </CardHeader>
    </Card>
  );
}

type HomeTabsProps = {
  model: HomeModel;
  fred: FredParam;
  onTabClick: (event: MouseEvent<HTMLAnchorElement>, tab: HomeTab) => void;
};

function HomeTabs(props: HomeTabsProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line">
      <nav className="flex flex-wrap gap-1">
        {HOME_TABS.map((item) => {
          const active = props.model.tab === item.tab;
          return (
            <Link
              key={item.tab}
              href={homeHref({ tab: item.tab, query: props.model.query, fred: props.fred })}
              onClick={(event) => props.onTabClick(event, item.tab)}
              className={
                active
                  ? "border-b-2 border-ink px-3 py-2 text-sm font-semibold text-ink"
                  : "px-3 py-2 text-sm text-muted-foreground"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function AskFredPanel(props: { closeHref: string } & AskFredProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-[0.95rem] font-semibold">
          <Sparkles className="size-4 text-accent" />
          AskFred
        </div>
        <Button asChild variant="ghost" size="icon-sm">
          <Link
            href={props.closeHref}
            aria-label="Close AskFred"
            onClick={(event) => {
              if (!isPlainLeftClick(event)) {
                return;
              }
              event.preventDefault();
              pushHomeUrl({ ...parseHomeViewFromSearch(window.location.search), fred: "unset" });
            }}
          >
            <X />
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <AskFred
          error={props.error}
          messages={props.messages}
          sendMessage={props.sendMessage}
          status={props.status}
        />
      </div>
    </div>
  );
}

export function HomeCanvas(props: HomeCanvasProps) {
  const model = props.model;
  const closeHref = homeHref({ tab: model.tab, query: model.query, fred: "unset" });
  const { error, messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ask-fred" }),
  });
  return (
    <WorkspaceCanvas
      rail={{
        kind: "assistant",
        chrome: assistantChrome(props.fred),
        panel: (
          <AskFredPanel
            closeHref={closeHref}
            error={error}
            messages={messages}
            sendMessage={sendMessage}
            status={status}
          />
        ),
      }}
    >
      <div className="home-empty min-h-full px-4 pt-8 pb-12 md:px-8">
        <h2 className="m-0 text-[1.5rem] font-semibold tracking-tight md:text-[1.75rem]">
          {greetingTitle(model)}
        </h2>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {model.insights.map((card) => (
            <InsightCardView key={card.kind} card={card} />
          ))}
        </div>
        <div className="mt-8 grid gap-3">
          <MeetingSearch
            className="md:hidden"
            hotkey={false}
            view={{ tab: model.tab, query: model.query, fred: props.fred }}
          />
          <HomeTabs model={model} fred={props.fred} onTabClick={props.onTabClick} />
          {model.rows.length === 0 ? (
            <p className="mt-1 text-[0.85rem] text-muted-foreground">
              No meetings in this view.{" "}
              <Link className="font-semibold text-accent" href="/meetings">
                View all meetings
              </Link>
            </p>
          ) : (
            <div className="grid gap-1">
              {model.rows.map((meeting) => (
                <MeetingRow key={meeting._id} meeting={meeting} />
              ))}
              <Link className="mt-2 text-sm font-semibold text-accent" href="/meetings">
                View more
              </Link>
            </div>
          )}
        </div>
      </div>
    </WorkspaceCanvas>
  );
}

export function HomeDashboard(props: HomeDashboardProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [view, setView] = useState(props.view);
  const query = useQuery({
    queryKey: meetingsListKey(1, HOME_DASHBOARD_LIMIT),
    queryFn: () => listMeetings(1, HOME_DASHBOARD_LIMIT),
    initialData: props.initialPage,
    refetchInterval: (current) => {
      const items = current.state.data?.items;
      if (!items) {
        return false;
      }
      return items.some((meeting) => isBusy(meeting.status)) ? 2000 : false;
    },
  });

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    setView(props.view);
  }, [props.view]);

  useEffect(() => {
    return subscribeHomeUrl(() => {
      setView(parseHomeViewFromSearch(window.location.search));
    });
  }, []);

  function onTabClick(event: MouseEvent<HTMLAnchorElement>, tab: HomeTab) {
    if (!isPlainLeftClick(event)) {
      return;
    }
    event.preventDefault();
    if (view.tab === tab) {
      return;
    }
    const next = { ...view, tab };
    setView(next);
    pushHomeUrl(next);
  }

  if (query.error) {
    return (
      <main className="home-empty h-full overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <p className="text-[0.85rem] text-danger">{query.error.message}</p>
      </main>
    );
  }

  if (query.isPending || !query.data || now === null) {
    return <HomeDashboardSkeleton />;
  }

  const model = toHomeModel({
    page: query.data,
    view,
    now,
    workspaceName: WORKSPACE_NAME,
  });
  return <HomeCanvas model={model} fred={view.fred} onTabClick={onTabClick} />;
}
