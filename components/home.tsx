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
import { toHomeModel, type HomeModel, type InsightCard } from "@lib/home";
import { HOME_RECENT_TASK_GROUPS, tasksHref, type ActionListPage } from "@lib/actions";
import { HOME_DASHBOARD_LIMIT, type MeetingListPage } from "@lib/meetings";
import { actionsListQuery, meetingsListQuery } from "@lib/query-policy";

export type HomeDashboardProps = {
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
  const card = props.card;
  const inner = (
    <Card
      className={`min-w-0 bg-paper shadow-none ring-1 ring-line max-md:[--card-spacing:--spacing(2.5)]${card.kind === "task-count" ? " hover:bg-wash" : ""}`}
    >
      <CardHeader className="flex min-w-0 flex-col gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-wash md:size-10">
          <InsightIcon kind={card.kind} iconRef={iconRef} />
        </span>
        <p className="m-0 text-2xl font-semibold tabular-nums md:text-3xl">{card.metric}</p>
        <p className="sr-only md:hidden">{`${card.title}: ${card.body}`}</p>
        <div className="hidden min-w-0 md:block">
          <CardTitle className="truncate">{card.title}</CardTitle>
          <CardDescription className="truncate text-muted-foreground">{card.body}</CardDescription>
          {card.note ? (
            <p className="m-0 truncate text-xs text-muted-foreground">{card.note}</p>
          ) : null}
        </div>
      </CardHeader>
    </Card>
  );
  if (card.kind !== "task-count") {
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
    ...actionsListQuery(1, HOME_RECENT_TASK_GROUPS, "pending"),
    initialData: props.initialPage,
    refetchInterval: 2000,
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
  const query = useQuery({
    ...meetingsListQuery(1, HOME_DASHBOARD_LIMIT),
    initialData: props.initialPage,
  });

  useEffect(() => {
    setNow(new Date());
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
    now,
    workspaceName: props.displayName,
  });
  return <HomeCanvas initialActions={props.initialActions} model={model} now={now} />;
}
