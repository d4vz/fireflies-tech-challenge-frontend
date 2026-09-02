import { expect, test } from "bun:test";
import { parseActionStatus, parseActionsView, tasksHref } from "@lib/actions";

test("parseActionStatus keeps pending and completed", () => {
  expect(parseActionStatus("pending")).toBe("pending");
  expect(parseActionStatus("completed")).toBe("completed");
  expect(parseActionStatus("ready")).toBe("all");
  expect(parseActionStatus(undefined)).toBe("all");
});

test("tasksHref drops default all and page 1", () => {
  expect(tasksHref("all")).toBe("/tasks");
  expect(tasksHref("pending")).toBe("/tasks?status=pending");
  expect(tasksHref("completed", 2)).toBe("/tasks?status=completed&page=2");
  expect(tasksHref("all", 2)).toBe("/tasks?page=2");
});

test("parseActionsView reads status and page", () => {
  expect(parseActionsView(undefined, undefined)).toEqual({ status: "all", page: 1 });
  expect(parseActionsView("pending", "2")).toEqual({ status: "pending", page: 2 });
  expect(parseActionsView("nope", "0")).toEqual({ status: "all", page: 1 });
});
