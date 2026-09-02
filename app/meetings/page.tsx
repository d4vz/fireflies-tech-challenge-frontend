import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@app/get-query-client";
import { listMeetingsFromBackend } from "@lib/backend";
import { meetingsListKey, MEETINGS_PAGE_SIZE, parsePage } from "@lib/meetings";
import { MeetingsList } from "@app/meetings/meetings-list";

type MeetingsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

type MeetingsListSectionProps = {
  page: number;
};

function ListFallback() {
  return (
    <main className="px-8 pt-8 pb-12">
      <p className="mt-1 text-[0.85rem] text-muted">Loading…</p>
    </main>
  );
}

async function MeetingsListSection(props: MeetingsListSectionProps) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: meetingsListKey(props.page, MEETINGS_PAGE_SIZE),
    queryFn: () => listMeetingsFromBackend(props.page, MEETINGS_PAGE_SIZE),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MeetingsList page={props.page} />
    </HydrationBoundary>
  );
}

export default async function MeetingsPage(props: MeetingsPageProps) {
  const searchParams = await props.searchParams;
  const page = parsePage(searchParams.page);
  return (
    <Suspense fallback={<ListFallback />}>
      <MeetingsListSection page={page} />
    </Suspense>
  );
}
