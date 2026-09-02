import { listMeetings } from "@lib/backend";
import { MEETINGS_PAGE_SIZE, parseLimit, parsePage } from "@lib/meetings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parsePage(url.searchParams.get("page"));
  const limit = parseLimit(url.searchParams.get("limit"), MEETINGS_PAGE_SIZE);
  try {
    return Response.json(await listMeetings(page, limit));
  } catch {
    return Response.json({ error: "could not load meetings" }, { status: 502 });
  }
}
