import Link from "next/link";

type BoneProps = {
  className: string;
};

function Bone(props: BoneProps) {
  return <div className={`animate-pulse bg-line ${props.className}`} />;
}

function InsightCardBone() {
  return (
    <div className="min-w-0 rounded-xl bg-paper p-2.5 ring-1 ring-line md:p-4">
      <Bone className="size-8 rounded-xl md:size-10" />
      <Bone className="mt-3 h-8 w-10 rounded-md" />
      <Bone className="mt-2 hidden h-4 w-16 rounded-md md:block" />
      <Bone className="mt-1 hidden h-3 w-full rounded-md md:block" />
    </div>
  );
}

function MeetingCardBone() {
  return (
    <div className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 md:grid-cols-1">
      <Bone className="max-md:size-16 max-md:rounded-lg aspect-video w-full rounded-[14px]" />
      <div className="grid min-w-0 gap-1.5 pt-0.5">
        <Bone className="h-4 w-48 max-w-full rounded-md" />
        <Bone className="h-3.5 w-full rounded-md" />
        <Bone className="h-3.5 w-4/5 max-md:hidden rounded-md" />
        <Bone className="h-3 w-24 rounded-md" />
      </div>
    </div>
  );
}

export function TranscriptSkeleton() {
  return (
    <div className="grid gap-2.5">
      <Bone className="h-3.5 w-full rounded-md" />
      <Bone className="h-3.5 w-11/12 rounded-md" />
      <Bone className="h-3.5 w-5/6 rounded-md" />
      <Bone className="h-3.5 w-11/12 rounded-md" />
      <Bone className="h-3.5 w-3/4 rounded-md" />
      <Bone className="h-3.5 w-5/6 rounded-md" />
      <Bone className="h-3.5 w-2/3 rounded-md" />
    </div>
  );
}

export function SummarySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading summary" className="grid max-w-prose gap-2.5">
      <Bone className="h-3.5 w-full rounded-md" />
      <Bone className="h-3.5 w-11/12 rounded-md" />
      <Bone className="h-3.5 w-4/5 rounded-md" />
    </div>
  );
}

export function MeetingTasksSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading tasks"
      className="surface-card min-w-0 overflow-hidden"
    >
      <header className="flex min-w-0 items-center justify-between gap-3 px-5 py-3.5">
        <h2 className="m-0 text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase">
          Tasks
        </h2>
        <Bone className="h-3 w-10 rounded-md" />
      </header>
      <div className="h-0.5 bg-line" aria-hidden="true" />
      <div className="grid gap-3 border-t border-line px-5 py-3.5">
        <Bone className="h-4 w-3/4 rounded-md" />
        <Bone className="h-4 w-2/3 rounded-md" />
        <Bone className="h-4 w-3/5 rounded-md" />
      </div>
    </section>
  );
}

export function MeetingsListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading meetings"
      className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
    >
      <MeetingCardBone />
      <MeetingCardBone />
      <MeetingCardBone />
      <MeetingCardBone />
      <MeetingCardBone />
      <MeetingCardBone />
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading home"
      className="home-empty h-full w-full overflow-y-auto"
    >
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-12 md:px-8">
        <Bone className="h-8 w-64 max-w-full rounded-md" />
        <Bone className="mt-2 h-4 w-40 max-w-full rounded-md" />
        <div className="mt-6 grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
          <InsightCardBone />
          <InsightCardBone />
          <InsightCardBone />
        </div>
        <div className="mt-8 grid gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="m-0 text-[1.05rem] font-semibold tracking-tight">Last meetings</h3>
            <Link className="text-sm font-semibold text-accent" href="/meetings">
              view more
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MeetingCardBone />
            <MeetingCardBone />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MeetingDetailSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading meeting"
      className="grid h-full min-h-0 min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="min-h-0 min-w-0 overflow-y-auto px-4 pt-8 pb-12 md:px-8">
        <article className="grid gap-5">
          <Bone className="aspect-video rounded-[14px]" />
          <div className="grid gap-2">
            <Bone className="h-7 w-64 max-w-full rounded-md" />
            <Bone className="h-3.5 w-40 rounded-md" />
          </div>
          <div className="grid gap-2">
            <Bone className="h-4 w-24 rounded-md" />
            <Bone className="h-3.5 w-full rounded-md" />
            <Bone className="h-3.5 w-11/12 rounded-md" />
            <Bone className="h-3.5 w-4/5 rounded-md" />
          </div>
          <div className="grid gap-2">
            <Bone className="h-4 w-28 rounded-md" />
            <Bone className="h-3.5 w-3/4 rounded-md" />
            <Bone className="h-3.5 w-2/3 rounded-md" />
            <Bone className="h-3.5 w-3/5 rounded-md" />
          </div>
        </article>
      </div>
      <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-paper px-5 py-6 lg:block">
        <Bone className="mb-4 h-4 w-24 rounded-md" />
        <TranscriptSkeleton />
      </aside>
    </main>
  );
}

export function TaskGroupBone() {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5">
        <Bone className="h-8 aspect-video shrink-0 rounded-lg" />
        <Bone className="h-4 w-40 max-w-full rounded-md" />
        <Bone className="ml-auto hidden h-3 w-24 rounded-md sm:block" />
        <Bone className="h-3 w-14 rounded-md" />
      </div>
      <div className="border-t border-line">
        <div className="px-5 py-3.5">
          <Bone className="h-4 w-3/4 rounded-md" />
        </div>
        <div className="border-t border-line px-5 py-3.5">
          <Bone className="h-4 w-2/3 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function TasksListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading tasks"
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      <TaskGroupBone />
      <TaskGroupBone />
      <TaskGroupBone />
    </div>
  );
}
