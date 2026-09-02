import { proxyUpload } from "@lib/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 3600;

export function POST(request: Request) {
  return proxyUpload(request);
}
