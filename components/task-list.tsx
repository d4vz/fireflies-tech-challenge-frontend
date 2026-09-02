"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { patchTask } from "@lib/api";
import { actionsKey } from "@lib/actions";
import { meetingKey, meetingsKey, type MeetingTask, type TaskStatus } from "@lib/meetings";

type TaskChecklistProps = {
  meetingId: string;
  tasks: MeetingTask[];
  inset?: boolean;
};

export function TaskChecklist(props: TaskChecklistProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: { taskId: string; status: TaskStatus }) =>
      patchTask(props.meetingId, input.taskId, input.status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meetingsKey }),
        queryClient.invalidateQueries({ queryKey: actionsKey }),
        queryClient.invalidateQueries({ queryKey: meetingKey(props.meetingId) }),
      ]);
    },
  });

  if (props.tasks.length === 0) {
    return <p className="m-0 text-[0.9rem] text-muted-foreground">No action items</p>;
  }

  const rowPad = props.inset === true ? "px-5" : undefined;

  return (
    <ul className="m-0 list-none divide-y divide-line p-0">
      {props.tasks.map((task) => {
        const completed = task.status === "completed";
        return (
          <li key={task._id}>
            <label
              className={cn("flex cursor-pointer items-start gap-3 py-3.5 hover:bg-wash", rowPad)}
            >
              <Checkbox
                className="mt-1"
                checked={completed}
                disabled={mutation.isPending}
                onCheckedChange={(value) => {
                  mutation.mutate({
                    taskId: task._id,
                    status: value === true ? "completed" : "pending",
                  });
                }}
              />
              <span
                className={
                  completed
                    ? "min-w-0 flex-1 text-[0.95rem] leading-6 text-muted-foreground line-through"
                    : "min-w-0 flex-1 text-[0.95rem] leading-6 text-ink"
                }
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
