import { getMeeting } from "@lib/backend";

export const dynamic = "force-dynamic";

type MeetingIdRoute = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: MeetingIdRoute) {
  const params = await context.params;
  try {
    const meeting = await getMeeting(params.id);
    if (!meeting) {
      return Response.json({ error: "meeting not found" }, { status: 404 });
    }
    return Response.json(meeting);
  } catch {
    return Response.json({ error: "could not load meeting" }, { status: 502 });
  }
}
