type BoneProps = {
  className: string;
};

function Bone(props: BoneProps) {
  return <div className={`animate-pulse bg-neutral-200 ${props.className}`} />;
}

function MeetingCardBone() {
  return (
    <div className="grid min-w-0 gap-3">
      <Bone className="aspect-video rounded-[14px]" />
      <div className="grid min-w-0 gap-1.5 pt-0.5">
        <Bone className="h-4 w-48 max-w-full rounded-md" />
        <Bone className="h-3.5 w-full rounded-md" />
        <Bone className="h-3.5 w-4/5 rounded-md" />
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

export function MeetingsListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading meetings" className="grid grid-cols-3 gap-3">
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
      className="home-empty h-full overflow-y-auto px-4 pt-8 pb-12 md:px-8"
    >
      <Bone className="h-8 w-64 max-w-full rounded-md" />
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Bone className="h-20 rounded-xl md:h-24" />
        <Bone className="h-20 rounded-xl md:h-24" />
        <Bone className="h-20 rounded-xl md:h-24" />
      </div>
      <div className="mt-8 grid gap-3">
        <Bone className="h-6 w-40 max-w-full rounded-md" />
        <div className="grid grid-cols-3 gap-3">
          <MeetingCardBone />
          <MeetingCardBone />
          <MeetingCardBone />
        </div>
      </div>
      <div className="@container mt-8 grid gap-3">
        <Bone className="h-6 w-36 max-w-full rounded-md" />
        <div className="grid grid-cols-1 gap-3 @4xl:grid-cols-2">
          <TaskGroupBone />
          <TaskGroupBone />
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
    <div className="overflow-hidden rounded-2xl bg-paper shadow-[0_1px_2px_rgba(16,18,27,0.06)] ring-1 ring-line">
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
    <div aria-busy="true" aria-label="Loading tasks" className="grid max-w-190 gap-3">
      <TaskGroupBone />
      <TaskGroupBone />
      <TaskGroupBone />
    </div>
  );
}
