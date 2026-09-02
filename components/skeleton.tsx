type BoneProps = {
  className: string;
};

function Bone(props: BoneProps) {
  return <div className={`animate-pulse bg-neutral-200 ${props.className}`} />;
}

function MeetingRowBone() {
  return (
    <div className="grid min-w-0 items-start gap-3 rounded-xl px-2.5 py-2.5 max-lg:grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Bone className="aspect-video rounded-[14px]" />
      <div className="grid min-w-0 gap-2 pt-0.5">
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
    <main aria-busy="true" aria-label="Loading meetings" className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-8 md:px-8">
        <div className="grid max-w-190 gap-3">
          <MeetingRowBone />
          <MeetingRowBone />
          <MeetingRowBone />
          <MeetingRowBone />
          <MeetingRowBone />
        </div>
      </div>
      <nav className="flex shrink-0 items-center gap-3 border-t border-line bg-wash px-4 py-3 md:px-8">
        <Bone className="h-4 w-16 rounded-md" />
        <Bone className="h-4 w-24 rounded-md" />
        <Bone className="h-4 w-10 rounded-md" />
      </nav>
    </main>
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
        <Bone className="h-8 w-80 max-w-full rounded-md" />
        <MeetingRowBone />
        <MeetingRowBone />
        <MeetingRowBone />
        <MeetingRowBone />
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
