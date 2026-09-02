import { MeetingDetail } from "@app/meetings/[id]/meeting-detail";

type MeetingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetingPage(props: MeetingPageProps) {
  const params = await props.params;
  return <MeetingDetail id={params.id} />;
}
