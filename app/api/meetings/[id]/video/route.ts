import { proxyStoredObject } from "@lib/backend";

export const dynamic = "force-dynamic";

type MeetingIdRoute = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: MeetingIdRoute) {
  const params = await context.params;
  return proxyStoredObject(`/meetings/${params.id}/video`, "application/octet-stream");
}
