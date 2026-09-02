"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { patchTask } from "@lib/api";
import { type MeetingTask, type TaskStatus } from "@lib/meetings";
import { invalidateMeetingData } from "@lib/query-policy";

type TaskChecklistProps = {
  meetingId: string;
  tasks: MeetingTask[];
  inset?: boolean;
  clampLines?: 2;
};

export function TaskChecklist(props: TaskChecklistProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: { taskId: string; status: TaskStatus }) =>
      patchTask(props.meetingId, input.taskId, input.status),
    onSuccess: async () => {
      await invalidateMeetingData(queryClient, props.meetingId);
    },
  });

  if (props.tasks.length === 0) {
    return <p className="m-0 text-[0.9rem] text-muted-foreground">No action items</p>;
  }

  const rowPad = props.inset === true ? "px-5" : undefined;
  const pendingId = mutation.isPending ? mutation.variables?.taskId : undefined;

  return (
    <ul className="m-0 list-none divide-y divide-line p-0">
      {props.tasks.map((task) => {
        const completed = task.status === "completed";
        const pending = pendingId === task._id;
        return (
          <li key={task._id}>
            <label
              className={cn("flex cursor-pointer items-start gap-3 py-3.5 hover:bg-wash", rowPad)}
            >
              <Checkbox
                className="mt-1"
                checked={completed}
                disabled={pending}
                onCheckedChange={(value) => {
                  mutation.mutate({
                    taskId: task._id,
                    status: value === true ? "completed" : "pending",
                  });
                }}
              />
              {pending ? <Spinner className="mt-1 size-4" /> : null}
              <span
                className={cn(
                  "min-w-0 flex-1 text-[0.95rem] leading-6 transition-[color,text-decoration-color] duration-200",
                  completed ? "text-muted-foreground line-through" : "text-ink",
                  props.clampLines === 2 ? "line-clamp-2" : undefined,
                )}
              >
                {task.text}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
