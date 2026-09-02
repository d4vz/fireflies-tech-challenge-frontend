import { listMeetingsFromBackend } from "@lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await listMeetingsFromBackend());
  } catch {
    return Response.json({ error: "could not load meetings" }, { status: 502 });
  }
}
