import { MeetingsList } from "@app/meetings/meetings-list";
import { parsePage } from "@lib/meetings";

type MeetingsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function MeetingsPage(props: MeetingsPageProps) {
  const searchParams = await props.searchParams;
  return <MeetingsList page={parsePage(searchParams.page)} />;
}
