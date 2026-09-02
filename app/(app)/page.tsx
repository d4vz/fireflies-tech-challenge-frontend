import { HomeDashboard } from "@components/home";
import { currentUser } from "@clerk/nextjs/server";
import { listMeetings } from "@lib/backend";
import { displayNameFrom } from "@lib/chrome";
import { parseHomeView, type HomeSearchParams } from "@lib/home";
import { HOME_DASHBOARD_LIMIT } from "@lib/meetings";

type HomePageProps = {
  searchParams: Promise<HomeSearchParams>;
};

export default async function Home(props: HomePageProps) {
  const [user, view, initialPage] = await Promise.all([
    currentUser(),
    props.searchParams.then(parseHomeView),
    listMeetings(1, HOME_DASHBOARD_LIMIT).catch(() => undefined),
  ]);
  return (
    <HomeDashboard
      displayName={displayNameFrom(
        user?.firstName,
        user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress,
      )}
      initialPage={initialPage}
      view={view}
    />
  );
}
