type BoneProps = {
  className: string;
};

function Bone(props: BoneProps) {
  return <div className={`animate-pulse bg-neutral-200 ${props.className}`} />;
}

function MeetingRowBone() {
  return (
    <div className="grid grid-cols-[240px_1fr] items-start gap-4 rounded-xl px-2.5 py-2.5">
      <Bone className="aspect-video rounded-[14px]" />
      <div className="grid gap-2 pt-0.5">
        <Bone className="h-4 w-48 rounded-md" />
        <Bone className="h-3.5 w-full rounded-md" />
        <Bone className="h-3.5 w-4/5 rounded-md" />
        <Bone className="h-3 w-24 rounded-md" />
      </div>
    </div>
  );
}

function HomeCardBone() {
  return (
    <div className="overflow-hidden rounded-[14px] bg-paper shadow-[0_1px_2px_rgba(16,18,27,0.06)]">
      <Bone className="aspect-video" />
      <div className="grid gap-2 p-3.5">
        <Bone className="h-4 w-3/4 rounded-md" />
        <Bone className="h-3.5 w-full rounded-md" />
        <Bone className="h-3.5 w-2/3 rounded-md" />
        <Bone className="h-3 w-20 rounded-md" />
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
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-8">
        <div className="grid max-w-190 gap-3">
          <MeetingRowBone />
          <MeetingRowBone />
          <MeetingRowBone />
          <MeetingRowBone />
          <MeetingRowBone />
        </div>
      </div>
      <nav className="flex shrink-0 items-center gap-3 border-t border-line bg-wash px-8 py-3">
        <Bone className="h-4 w-16 rounded-md" />
        <Bone className="h-4 w-24 rounded-md" />
        <Bone className="h-4 w-10 rounded-md" />
      </nav>
    </main>
  );
}

export function HomeMeetingsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading meetings"
      className="grid max-w-240 grid-cols-3 gap-4"
    >
      <HomeCardBone />
      <HomeCardBone />
      <HomeCardBone />
    </div>
  );
}

export function MeetingDetailSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading meeting"
      className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="min-h-0 overflow-y-auto px-8 pt-8 pb-12">
        <article className="grid gap-5">
          <Bone className="aspect-video rounded-[14px]" />
          <div className="grid gap-2">
            <Bone className="h-7 w-64 rounded-md" />
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
      <aside className="min-h-0 overflow-y-auto border-l border-line bg-paper px-5 py-6">
        <Bone className="mb-4 h-4 w-24 rounded-md" />
        <TranscriptSkeleton />
      </aside>
    </main>
  );
}
