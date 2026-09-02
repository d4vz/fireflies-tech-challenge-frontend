import { patchTask } from "@lib/backend";
import type { TaskStatus } from "@lib/meetings";

export const dynamic = "force-dynamic";

type TaskRoute = {
  params: Promise<{ id: string; taskId: string }>;
};

export async function PATCH(request: Request, context: TaskRoute) {
  const params = await context.params;
  let body: { status?: TaskStatus };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  if (body.status !== "pending" && body.status !== "completed") {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }
  try {
    return Response.json(await patchTask(params.id, params.taskId, body.status));
  } catch (error) {
    if (error instanceof Error && error.message === "task not found") {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    return Response.json({ error: "could not update task" }, { status: 502 });
  }
}
