import { MeetingsList } from "./meetings-list";
import { parseMeetingsView } from "@lib/meetings";

type MeetingsPageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function MeetingsPage(props: MeetingsPageProps) {
  const searchParams = await props.searchParams;
  const view = parseMeetingsView(searchParams.status, searchParams.page);
  return <MeetingsList page={view.page} status={view.status} />;
}
