import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@app/get-query-client";
import { getMeetingFromBackend } from "@lib/backend";
import { meetingKey } from "@lib/meetings";
import { MeetingDetail } from "@app/meetings/[id]/meeting-detail";

type MeetingPageProps = {
  params: Promise<{ id: string }>;
};

type MeetingDetailSectionProps = {
  id: string;
};

function DetailFallback() {
  return (
    <main className="px-8 pt-8 pb-12">
      <p className="mt-1 text-[0.85rem] text-muted">Loading…</p>
    </main>
  );
}

async function MeetingDetailSection(props: MeetingDetailSectionProps) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: meetingKey(props.id),
    queryFn: async () => {
      const meeting = await getMeetingFromBackend(props.id);
      if (!meeting) {
        throw new Error("meeting not found");
      }
      return meeting;
    },
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MeetingDetail id={props.id} />
    </HydrationBoundary>
  );
}

export default async function MeetingPage(props: MeetingPageProps) {
  const params = await props.params;
  return (
    <Suspense fallback={<DetailFallback />}>
      <MeetingDetailSection id={params.id} />
    </Suspense>
  );
}
