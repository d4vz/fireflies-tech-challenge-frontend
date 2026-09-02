import { HomeDashboard } from "@components/home";
import { parseHomeView, type HomeSearchParams } from "@lib/home";

type HomePageProps = {
  searchParams: Promise<HomeSearchParams>;
};

export default async function Home(props: HomePageProps) {
  const view = parseHomeView(await props.searchParams);
  return <HomeDashboard view={view} />;
}
