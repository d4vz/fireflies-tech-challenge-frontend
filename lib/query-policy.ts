import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { listActions, getMeeting, getTranscripts, listMeetings } from "@lib/api";
import { actionsKey, actionsListKey, type ActionStatusFilter } from "@lib/actions";
import {
  isBusy,
  meetingKey,
  meetingsKey,
  meetingsListKey,
  transcriptsKey,
  type MeetingListFilter,
  type MeetingStatus,
} from "@lib/meetings";

export function busyRefetchInterval(statuses: MeetingStatus[]): number | false {
  return statuses.some(isBusy) ? 2000 : false;
}

function meetingStatuses(items: { status: MeetingStatus }[] | undefined): MeetingStatus[] {
  if (items === undefined) {
    return [];
  }
  return items.map((item) => item.status);
}

export function meetingsListQuery(page: number, limit: number, status: MeetingListFilter = "all") {
  return queryOptions({
    queryKey: meetingsListKey(page, limit, status),
    queryFn: () => listMeetings(page, limit, status),
    refetchInterval: (current) => busyRefetchInterval(meetingStatuses(current.state.data?.items)),
  });
}

export function meetingQuery(id: string) {
  return queryOptions({
    queryKey: meetingKey(id),
    queryFn: () => getMeeting(id),
    enabled: Boolean(id),
    refetchInterval: (current) => {
      const status = current.state.data?.status;
      if (status === undefined) {
        return false;
      }
      return busyRefetchInterval([status]);
    },
  });
}

export function transcriptsQuery(id: string) {
  return queryOptions({
    queryKey: transcriptsKey(id),
    queryFn: () => getTranscripts(id),
  });
}

export function actionsListQuery(page: number, limit: number, status: ActionStatusFilter) {
  return queryOptions({
    queryKey: actionsListKey(page, limit, status),
    queryFn: () => listActions(page, limit, status),
  });
}

export async function invalidateMeetingData(
  queryClient: QueryClient,
  meetingId?: string,
): Promise<void> {
  const jobs = [
    queryClient.invalidateQueries({ queryKey: meetingsKey }),
    queryClient.invalidateQueries({ queryKey: actionsKey }),
  ];
  if (meetingId !== undefined) {
    jobs.push(queryClient.invalidateQueries({ queryKey: meetingKey(meetingId) }));
  }
  await Promise.all(jobs);
}
