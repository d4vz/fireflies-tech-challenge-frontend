import { proxyAskFred } from "@lib/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export function POST(request: Request) {
  return proxyAskFred(request);
}
