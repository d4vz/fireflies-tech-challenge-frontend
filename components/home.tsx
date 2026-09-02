"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { AskFredProps } from "@components/ask-fred";
import { useQuery } from "@tanstack/react-query";
import { LayoutList, ListChecks, Loader, Sparkles, X } from "@animateicons/react/lucide";
import dynamic from "next/dynamic";
import type { IconHandle } from "@animateicons/react";
import Link from "next/link";
import { useEffect, useRef, useState, type Ref } from "react";
import { MeetingRow } from "@components/meeting-row";
import { MeetingsEmpty } from "@components/meetings-empty";
import { HomeDashboardSkeleton, TaskGroupBone } from "@components/skeleton";
import { TaskGroupCard } from "@components/task-group";
import { WorkspaceCanvas } from "@components/workspace-canvas";
import { Button } from "@/components/ui/button";
import { handleHover } from "@lib/handle-hover";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  type HomeView,
  type InsightCard,
  type InsightCoverage,
} from "@lib/home";
import { listActions, listMeetings } from "@lib/api";
import {
  HOME_RECENT_TASK_GROUPS,
  actionsListKey,
  tasksHref,
  type ActionListPage,
} from "@lib/actions";
import { HOME_DASHBOARD_LIMIT, isBusy, meetingsListKey, type MeetingListPage } from "@lib/meetings";

export type HomeDashboardProps = {
  view: HomeView;
  initialPage: MeetingListPage | undefined;
  initialActions: ActionListPage | undefined;
  displayName: string;
};

export type HomeCanvasProps = {
  model: HomeModel;
  fred: FredParam;
  initialActions: ActionListPage | undefined;
};

const AskFred = dynamic(() => import("@components/ask-fred").then((mod) => mod.AskFred), {
  ssr: false,
});

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
  switch (card.kind) {
    case "meeting-count":
      return {
        title: "Meetings",
        body: `${card.total} in the library`,
        metric: String(card.total),
      };
    case "busy-count":
      return {
        title: "In progress",
        body: `${card.count} processing`,
        metric: String(card.count),
        note: coverageNote(card.coverage),
      };
    case "task-count":
      return {
        title: "Tasks",
        body: `${card.pending} pending · ${card.completed} completed`,
        metric: String(card.pending),
        note: coverageNote(card.coverage),
      };
    default: {
      const _exhaustive: never = card;
      return _exhaustive;
    }
  }
}

function InsightIcon(props: { kind: InsightCard["kind"]; iconRef?: Ref<IconHandle> }) {
  switch (props.kind) {
    case "meeting-count":
      return <LayoutList className="text-blue-600" size={20} />;
    case "busy-count":
      return <Loader className="text-orange-600" size={20} />;
    case "task-count":
      return <ListChecks ref={props.iconRef} className="text-green-700" size={20} />;
    default: {
      const _exhaustive: never = props.kind;
      return _exhaustive;
    }
  }
}

function InsightCardView(props: { card: InsightCard }) {
  const iconRef = useRef<IconHandle>(null);
  const copy = insightCopy(props.card);
  const inner = (
    <Card className="min-w-0 bg-paper shadow-[0_1px_2px_rgba(16,18,27,0.06)] ring-line max-md:[--card-spacing:--spacing(2.5)]">
      <CardHeader className="flex min-w-0 flex-row items-center justify-center gap-2 md:justify-start md:gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-wash md:size-10">
          <InsightIcon kind={props.card.kind} iconRef={iconRef} />
        </span>
        <p className="m-0 text-lg font-semibold tabular-nums md:hidden">{copy.metric}</p>
        <p className="sr-only md:hidden">{`${copy.title}: ${copy.body}`}</p>
        <div className="hidden min-w-0 md:block">
          <CardTitle className="truncate">{copy.title}</CardTitle>
          <CardDescription className="truncate text-muted-foreground">{copy.body}</CardDescription>
          {copy.note ? (
            <p className="m-0 truncate text-xs text-muted-foreground">{copy.note}</p>
          ) : null}
        </div>
      </CardHeader>
    </Card>
  );
  if (props.card.kind !== "task-count") {
    return inner;
  }
  return (
    <Link
      className="min-w-0 text-ink no-underline"
      href="/tasks"
      onMouseEnter={(event) => handleHover(event, iconRef)}
      onMouseLeave={(event) => handleHover(event, iconRef)}
    >
      {inner}
    </Link>
  );
}

function LastMeetingsHeader() {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="m-0 text-[1.05rem] font-semibold tracking-tight">Last meetings</h3>
      <Link className="text-sm font-semibold text-accent" href="/meetings">
        view more
      </Link>
    </div>
  );
}

function RecentTasksHeader() {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="m-0 text-[1.05rem] font-semibold tracking-tight">Recent tasks</h3>
      <Link
        aria-label="View more tasks"
        className="text-sm font-semibold text-accent"
        href={tasksHref("pending")}
      >
        view more
      </Link>
    </div>
  );
}

function RecentTasksResults(props: { page: ActionListPage }) {
  return props.page.items.map((group) => (
    <TaskGroupCard clampLines={2} key={group.meetingId} group={group} />
  ));
}

function RecentTasks(props: { initialPage: ActionListPage | undefined }) {
  const query = useQuery({
    queryKey: actionsListKey(1, HOME_RECENT_TASK_GROUPS, "pending"),
    queryFn: () => listActions(1, HOME_RECENT_TASK_GROUPS, "pending"),
    initialData: props.initialPage,
  });
  if (query.error !== null) {
    return (
      <div className="@container mt-8 grid gap-3">
        <RecentTasksHeader />
        <p className="text-[0.85rem] text-danger">{query.error.message}</p>
      </div>
    );
  }
  if (query.data === undefined) {
    return (
      <div className="@container mt-8 grid gap-3">
        <RecentTasksHeader />
        <div className="grid grid-cols-1 gap-3 @4xl:grid-cols-2">
          <TaskGroupBone />
          <TaskGroupBone />
        </div>
      </div>
    );
  }
  if (query.data.total === 0) {
    return null;
  }
  return (
    <div className="@container mt-8 grid gap-3">
      <RecentTasksHeader />
      <div className="grid grid-cols-1 gap-3 @4xl:grid-cols-2">
        <RecentTasksResults page={query.data} />
      </div>
    </div>
  );
}

function AskFredPanel(props: { closeHref: string } & AskFredProps) {
  const closeRef = useRef<IconHandle>(null);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-[0.95rem] font-semibold text-accent">
          <Sparkles size={16} />
          AskFred
        </div>
        <Button asChild variant="ghost" size="icon-sm">
          <Link
            href={props.closeHref}
            aria-label="Close AskFred"
            onMouseEnter={(event) => handleHover(event, closeRef)}
            onMouseLeave={(event) => handleHover(event, closeRef)}
            onClick={(event) => {
              if (!isPlainLeftClick(event)) {
                return;
              }
              event.preventDefault();
              pushHomeUrl({ ...parseHomeViewFromSearch(window.location.search), fred: "closed" });
            }}
          >
            <X ref={closeRef} size={16} />
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <AskFred
          displayName={props.displayName}
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
  const closeHref = homeHref({ tab: model.tab, query: model.query, fred: "closed" });
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
            displayName={model.greeting.workspaceName}
            error={error}
            messages={messages}
            sendMessage={sendMessage}
            status={status}
          />
        ),
      }}
    >
      <div className="home-empty min-h-full w-full">
        <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-12 md:px-8">
          <h2 className="m-0 text-[1.5rem] font-semibold tracking-tight md:text-[1.75rem]">
            {greetingTitle(model)}
          </h2>
          <div className="mt-6 grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
            {model.insights.map((card) => (
              <InsightCardView key={card.kind} card={card} />
            ))}
          </div>
          <div className="mt-8 grid gap-3">
            <LastMeetingsHeader />
            {model.rows.length === 0 ? (
              <MeetingsEmpty />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {model.rows.map((meeting) => (
                  <MeetingRow key={meeting._id} layout="card" meeting={meeting} />
                ))}
              </div>
            )}
          </div>
          <RecentTasks initialPage={props.initialActions} />
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

  if (query.error) {
    return (
      <main className="home-empty h-full w-full overflow-y-auto">
        <p className="mx-auto w-full max-w-5xl px-4 pt-8 pb-12 text-[0.85rem] text-danger md:px-8">
          {query.error.message}
        </p>
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
    workspaceName: props.displayName,
  });
  return <HomeCanvas fred={view.fred} initialActions={props.initialActions} model={model} />;
}
