"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, LayoutList, ListChecks, Loader } from "@animateicons/react/lucide";
import type { IconHandle } from "@animateicons/react";
import Link from "next/link";
import { useEffect, useRef, useState, type Ref } from "react";
import { MeetingRow } from "@components/meeting-row";
import { MeetingsEmpty } from "@components/meetings-empty";
import { HomeDashboardSkeleton, TaskGroupBone } from "@components/skeleton";
import { TaskGroupCard } from "@components/task-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { handleHover } from "@lib/handle-hover";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  parseHomeViewFromSearch,
  toHomeModel,
  type HomeModel,
  type HomeView,
  type InsightCard,
  type InsightCoverage,
} from "@lib/home";
import { subscribeAppUrl } from "@lib/assistant-url";
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
  now: Date;
  initialActions: ActionListPage | undefined;
};

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

function staggerClass(index: number): string {
  switch (index) {
    case 0:
      return "rise-in [--stagger:0]";
    case 1:
      return "rise-in [--stagger:1]";
    default:
      return "rise-in [--stagger:2]";
  }
}

function InsightCardView(props: { card: InsightCard; index: number }) {
  const iconRef = useRef<IconHandle>(null);
  const copy = insightCopy(props.card);
  const inner = (
    <Card
      className={`min-w-0 bg-paper shadow-none ring-1 ring-line max-md:[--card-spacing:--spacing(2.5)]${props.card.kind === "task-count" ? " hover:bg-wash" : ""}`}
    >
      <CardHeader className="flex min-w-0 flex-col gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-wash md:size-10">
          <InsightIcon kind={props.card.kind} iconRef={iconRef} />
        </span>
        <p className="m-0 text-2xl font-semibold tabular-nums md:text-3xl">{copy.metric}</p>
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
    return <div className={staggerClass(props.index)}>{inner}</div>;
  }
  return (
    <Link
      className={`min-w-0 text-ink no-underline ${staggerClass(props.index)}`}
      href="/tasks"
      onMouseEnter={(event) => handleHover(event, iconRef)}
      onMouseLeave={(event) => handleHover(event, iconRef)}
    >
      {inner}
    </Link>
  );
}

function ViewMoreLink(props: { href: string; label?: string }) {
  return (
    <Link
      aria-label={props.label}
      className="inline-flex items-center gap-0.5 text-sm font-semibold text-accent hover:underline"
      href={props.href}
    >
      view more
      <ChevronRight size={16} />
    </Link>
  );
}

function LastMeetingsHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="m-0 text-[1.05rem] font-semibold tracking-tight">Last meetings</h3>
      <ViewMoreLink href="/meetings" />
    </div>
  );
}

function RecentTasksHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="m-0 text-[1.05rem] font-semibold tracking-tight">Recent tasks</h3>
      <ViewMoreLink href={tasksHref("pending")} label="View more tasks" />
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
        <Alert variant="destructive">
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
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

export function HomeCanvas(props: HomeCanvasProps) {
  const model = props.model;
  return (
    <main className="home-empty h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-12 md:px-8">
        <h2 className="m-0 text-[1.5rem] font-semibold tracking-tight md:text-[1.75rem]">
          {greetingTitle(model)}
        </h2>
        <p className="mt-1 mb-0 text-sm text-muted-foreground">
          {props.now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="mt-6 grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
          {model.insights.map((card, index) => (
            <InsightCardView key={card.kind} card={card} index={index} />
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
    </main>
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
    return subscribeAppUrl(() => {
      setView(parseHomeViewFromSearch(window.location.search));
    });
  }, []);

  if (query.error) {
    return (
      <main className="home-empty h-full w-full overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-12 md:px-8">
          <Alert variant="destructive">
            <AlertDescription>{query.error.message}</AlertDescription>
          </Alert>
        </div>
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
  return <HomeCanvas initialActions={props.initialActions} model={model} now={now} />;
}
