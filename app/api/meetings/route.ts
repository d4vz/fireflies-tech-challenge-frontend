import { listMeetings } from "@lib/backend";
import {
  MEETINGS_PAGE_SIZE,
  parseLimit,
  parseMeetingStatus,
  parseMeetingTextQuery,
  parsePage,
} from "@lib/meetings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parsePage(url.searchParams.get("page"));
  const limit = parseLimit(url.searchParams.get("limit"), MEETINGS_PAGE_SIZE);
  const status = parseMeetingStatus(url.searchParams.get("status"));
  const q = parseMeetingTextQuery(url.searchParams.get("q"));
  try {
    return Response.json(await listMeetings(page, limit, status, q));
  } catch {
    return Response.json({ error: "could not load meetings" }, { status: 502 });
  }
}
