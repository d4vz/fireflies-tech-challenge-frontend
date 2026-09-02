import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@app/get-query-client";
import { listMeetingsFromBackend } from "@lib/backend";
import { meetingsKey } from "@lib/meetings";
import { MeetingsList } from "@app/meetings/meetings-list";

export default async function MeetingsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: meetingsKey,
    queryFn: listMeetingsFromBackend,
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MeetingsList />
    </HydrationBoundary>
  );
}
