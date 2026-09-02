"use client";

import { useQuery } from "@tanstack/react-query";
import { ListChecks, ListVideo, Loader, Sparkles, Timer, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AskFred } from "@components/ask-fred";
import { MeetingRow } from "@components/meeting-row";
import { HomeDashboardSkeleton } from "@components/skeleton";
import { WorkspaceCanvas } from "@components/workspace-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WORKSPACE_NAME } from "@lib/chrome";
import {
  assistantChrome,
  homeHref,
  toHomeModel,
  type FredParam,
  type HomeModel,
  type HomeTab,
  type HomeView,
  type InsightCard,
  type InsightCoverage,
} from "@lib/home";
import { listMeetings } from "@lib/api";
import { HOME_DASHBOARD_LIMIT, isBusy, meetingsListKey } from "@lib/meetings";

export type HomeDashboardProps = {
  view: HomeView;
};

export type HomeCanvasProps = {
  model: HomeModel;
  fred: FredParam;
};

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

function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) {
    return `${minutes}m`;
  }
  return `${Math.round(minutes / 60)}h`;
}

type InsightCopy = {
  title: string;
  body: string;
  note?: string;
};

function insightCopy(card: InsightCard): InsightCopy {
  if (card.kind === "meeting-count") {
    return { title: "Meetings", body: `${card.total} in the library` };
  }
  if (card.kind === "busy-count") {
    return {
      title: "In progress",
      body: `${card.count} processing`,
      note: coverageNote(card.coverage),
    };
  }
  if (card.kind === "action-item-count") {
    return {
      title: "Tasks",
      body: `${card.count} action items`,
      note: coverageNote(card.coverage),
    };
  }
  return {
    title: card.meeting.sourceId,
    body: `Processing for ${formatDuration(card.processingForMs)}`,
  };
}

function InsightIcon(props: { kind: InsightCard["kind"] }) {
  if (props.kind === "meeting-count") {
    return <ListVideo className="size-5 text-blue-600" />;
  }
  if (props.kind === "busy-count") {
    return <Loader className="size-5 text-orange-600" />;
  }
  if (props.kind === "action-item-count") {
    return <ListChecks className="size-5 text-green-700" />;
  }
  return <Timer className="size-5 text-accent" />;
}

function InsightCardView(props: { card: InsightCard }) {
  const copy = insightCopy(props.card);
  return (
    <Card className="bg-paper shadow-[0_1px_2px_rgba(16,18,27,0.06)] ring-line">
      <CardHeader className="flex-row items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-wash">
          <InsightIcon kind={props.card.kind} />
        </span>
        <div className="min-w-0">
          <CardTitle className="truncate">{copy.title}</CardTitle>
          <CardDescription className="text-muted">{copy.body}</CardDescription>
          {copy.note ? <p className="m-0 text-xs text-muted">{copy.note}</p> : null}
        </div>
      </CardHeader>
    </Card>
  );
}

type HomeTabsProps = {
  model: HomeModel;
  fred: FredParam;
};

function HomeTabs(props: HomeTabsProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line">
      <nav className="flex flex-wrap gap-1">
        {HOME_TABS.map((item) => {
          const active = props.model.tab === item.tab;
          const count = props.model.tabCounts[item.tab];
          return (
            <Link
              key={item.tab}
              href={homeHref({ tab: item.tab, query: props.model.query, fred: props.fred })}
              className={
                active
                  ? "border-b-2 border-ink px-3 py-2 text-sm font-semibold text-ink"
                  : "px-3 py-2 text-sm text-muted"
              }
            >
              {item.label}
              {count > 0 ? ` ${count}` : ""}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function AskFredPanel(props: { closeHref: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-[0.95rem] font-semibold">
          <Sparkles className="size-4 text-accent" />
          AskFred
        </div>
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={props.closeHref} aria-label="Close AskFred">
            <X />
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <AskFred />
      </div>
    </div>
  );
}

export function HomeCanvas(props: HomeCanvasProps) {
  const model = props.model;
  const closeHref = homeHref({ tab: model.tab, query: model.query, fred: "closed" });
  return (
    <WorkspaceCanvas
      rail={{
        kind: "assistant",
        chrome: assistantChrome(props.fred),
        panel: <AskFredPanel closeHref={closeHref} />,
      }}
    >
      <div className="home-empty min-h-full px-6 pt-8 pb-12 md:px-8">
        <h2 className="m-0 text-[1.75rem] font-semibold tracking-tight">{greetingTitle(model)}</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {model.insights.map((card) => (
            <InsightCardView
              key={card.kind === "longest-processing" ? card.meeting._id : card.kind}
              card={card}
            />
          ))}
        </div>
        <div className="mt-8 grid gap-3">
          <HomeTabs model={model} fred={props.fred} />
          {model.rows.length === 0 ? (
            <p className="mt-1 text-[0.85rem] text-muted">
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
  const query = useQuery({
    queryKey: meetingsListKey(1, HOME_DASHBOARD_LIMIT),
    queryFn: () => listMeetings(1, HOME_DASHBOARD_LIMIT),
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

  if (query.error) {
    return (
      <main className="home-empty h-full overflow-y-auto px-8 pt-8 pb-12">
        <p className="text-[0.85rem] text-danger">{query.error.message}</p>
      </main>
    );
  }

  if (query.isPending || !query.data || now === null) {
    return <HomeDashboardSkeleton />;
  }

  const model = toHomeModel({
    page: query.data,
    view: props.view,
    now,
    workspaceName: WORKSPACE_NAME,
  });
  return <HomeCanvas model={model} fred={props.view.fred} />;
}
