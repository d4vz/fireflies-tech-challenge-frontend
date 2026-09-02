import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@app/get-query-client";
import { getMeetingFromBackend } from "@lib/backend";
import { meetingKey } from "@lib/meetings";
import { MeetingDetail } from "@app/meetings/[id]/meeting-detail";

type MeetingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetingPage(props: MeetingPageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: meetingKey(params.id),
    queryFn: async () => {
      const meeting = await getMeetingFromBackend(params.id);
      if (!meeting) {
        throw new Error("meeting not found");
      }
      return meeting;
    },
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MeetingDetail />
    </HydrationBoundary>
  );
}
