import { getTranscriptsFromBackend } from "@lib/backend";

export const dynamic = "force-dynamic";

type MeetingIdRoute = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: MeetingIdRoute) {
  const params = await context.params;
  try {
    return Response.json(await getTranscriptsFromBackend(params.id));
  } catch {
    return Response.json({ error: "could not load transcript" }, { status: 502 });
  }
}
