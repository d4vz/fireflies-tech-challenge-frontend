import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@app/get-query-client";
import { listMeetingsFromBackend } from "@lib/backend";
import { HOME_MEETINGS_LIMIT, meetingsListKey } from "@lib/meetings";
import { HomeMeetings } from "@app/home-meetings";

async function HomeMeetingsSection() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: meetingsListKey(1, HOME_MEETINGS_LIMIT),
    queryFn: () => listMeetingsFromBackend(1, HOME_MEETINGS_LIMIT),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeMeetings />
    </HydrationBoundary>
  );
}

export default function Home() {
  return (
    <main className="home-empty px-8 pt-8 pb-12">
      <h2 className="mb-4 text-[0.95rem] font-semibold">Recent meetings</h2>
      <Suspense fallback={<p className="mt-1 text-[0.85rem] text-muted">Loading…</p>}>
        <HomeMeetingsSection />
      </Suspense>
    </main>
  );
}
