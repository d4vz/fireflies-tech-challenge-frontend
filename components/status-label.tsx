import type { MeetingStatus } from "@lib/meetings";

type StatusLabelProps = {
  status: MeetingStatus;
};

function statusText(status: MeetingStatus) {
  if (status === "queued") {
    return "Queued";
  }
  if (status === "processing") {
    return "Processing";
  }
  if (status === "ready") {
    return "Ready";
  }
  return "Failed";
}

function statusClass(status: MeetingStatus) {
  if (status === "ready") {
    return "bg-ready-wash text-ready";
  }
  if (status === "failed") {
    return "bg-failed-wash text-danger";
  }
  if (status === "processing") {
    return "bg-process-wash text-process";
  }
  return "bg-queued-wash text-queued";
}

export function StatusLabel(props: StatusLabelProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase ${statusClass(props.status)}`}
    >
      {statusText(props.status)}
    </span>
  );
}
