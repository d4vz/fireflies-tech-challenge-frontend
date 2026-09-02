import { TasksList } from "./tasks-list";
import { parseActionsView } from "@lib/actions";

type TasksPageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function TasksPage(props: TasksPageProps) {
  const searchParams = await props.searchParams;
  const view = parseActionsView(searchParams.status, searchParams.page);
  return <TasksList page={view.page} status={view.status} />;
}
