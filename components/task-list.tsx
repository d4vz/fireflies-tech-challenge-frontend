"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchTask } from "@lib/api";
import { actionsKey } from "@lib/actions";
import { meetingKey, meetingsKey, type MeetingTask, type TaskStatus } from "@lib/meetings";

type TaskChecklistProps = {
  meetingId: string;
  tasks: MeetingTask[];
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

  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {props.tasks.map((task) => {
        const completed = task.status === "completed";
        return (
          <li key={task._id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line hover:bg-wash">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-accent"
                checked={completed}
                disabled={mutation.isPending}
                onChange={() => {
                  mutation.mutate({
                    taskId: task._id,
                    status: completed ? "pending" : "completed",
                  });
                }}
              />
              <span
                className={
                  completed
                    ? "text-[0.95rem] leading-5 text-muted-foreground line-through"
                    : "text-[0.95rem] leading-5 text-ink"
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
