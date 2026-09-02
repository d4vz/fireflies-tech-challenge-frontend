import { listActions } from "@lib/backend";
import { ACTIONS_PAGE_SIZE, parseActionStatus } from "@lib/actions";
import { parseLimit, parsePage } from "@lib/meetings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parsePage(url.searchParams.get("page"));
  const limit = parseLimit(url.searchParams.get("limit"), ACTIONS_PAGE_SIZE);
  const status = parseActionStatus(url.searchParams.get("status"));
  try {
    return Response.json(await listActions(page, limit, status));
  } catch {
    return Response.json({ error: "could not load tasks" }, { status: 502 });
  }
}
