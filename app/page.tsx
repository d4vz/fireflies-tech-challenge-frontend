import { HomeDashboard } from "@components/home";
import { listMeetings } from "@lib/backend";
import { parseHomeView, type HomeSearchParams } from "@lib/home";
import { HOME_DASHBOARD_LIMIT } from "@lib/meetings";

type HomePageProps = {
  searchParams: Promise<HomeSearchParams>;
};

export default async function Home(props: HomePageProps) {
  const [view, initialPage] = await Promise.all([
    props.searchParams.then(parseHomeView),
    listMeetings(1, HOME_DASHBOARD_LIMIT).catch(() => undefined),
  ]);
  return <HomeDashboard view={view} initialPage={initialPage} />;
}
