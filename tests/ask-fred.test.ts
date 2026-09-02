import { expect, test } from "bun:test";
import { join } from "node:path";
import {
  ASK_FRED_PLACEHOLDER,
  isAskFredBusy,
  shouldScrollFredStick,
  shouldShowFredPending,
  shouldShowFredSuggestions,
} from "@lib/ask-fred";

const atBottom = { force: false, isAtBottom: true, key: "1:a:10" };
const readingHistory = { force: false, isAtBottom: false, key: "1:a:10" };

test("Ask Fred placeholder does not mention Command J", () => {
  expect(ASK_FRED_PLACEHOLDER).toBe("Ask anything here");
  expect(ASK_FRED_PLACEHOLDER.includes("⌘")).toBe(false);
});

test("send is busy only while submitted or streaming", () => {
  expect(isAskFredBusy("submitted")).toBe(true);
  expect(isAskFredBusy("streaming")).toBe(true);
  expect(isAskFredBusy("ready")).toBe(false);
  expect(isAskFredBusy("error")).toBe(false);
});

test("pending reply stays until the assistant has text", () => {
  const emptyAssistant = { role: "assistant", parts: [{ type: "text", text: "" }] };
  const userTurn = { role: "user", parts: [{ type: "text", text: "hello" }] };
  const withText = { role: "assistant", parts: [{ type: "text", text: "Hi" }] };

  expect(shouldShowFredPending("submitted", userTurn)).toBe(true);
  expect(shouldShowFredPending("streaming", emptyAssistant)).toBe(true);
  expect(shouldShowFredPending("streaming", withText)).toBe(false);
  expect(shouldShowFredPending("ready", emptyAssistant)).toBe(false);
  expect(shouldShowFredPending("error", emptyAssistant)).toBe(false);
});

test("scrolling down after leaving the tail does not jump to the end", () => {
  expect(shouldScrollFredStick(readingHistory, { ...readingHistory, isAtBottom: false })).toBe(
    false,
  );
});

test("new content follows the thread while the user is on the tail", () => {
  expect(shouldScrollFredStick(atBottom, { force: false, isAtBottom: true, key: "2:b:5" })).toBe(
    true,
  );
});

test("new content does not steal the viewport after the user leaves the tail", () => {
  expect(
    shouldScrollFredStick(readingHistory, { force: false, isAtBottom: false, key: "1:a:40" }),
  ).toBe(false);
});

test("new content does not jump after scrolling down through history", () => {
  expect(
    shouldScrollFredStick(readingHistory, { force: false, isAtBottom: false, key: "2:b:5" }),
  ).toBe(false);
});

test("sending follows the thread even if the user had left the tail", () => {
  expect(
    shouldScrollFredStick(readingHistory, { force: true, isAtBottom: false, key: "2:b:4" }),
  ).toBe(true);
});

test("a submitted turn does not retrigger scroll on the same key", () => {
  const submitted = { force: true, isAtBottom: true, key: "2:b:4" };
  expect(shouldScrollFredStick(submitted, submitted)).toBe(false);
});

test("streaming tokens do not steal the viewport after the user leaves the tail", () => {
  expect(
    shouldScrollFredStick(
      { force: true, isAtBottom: false, key: "2:b:4" },
      { force: true, isAtBottom: false, key: "2:b:40" },
    ),
  ).toBe(false);
});

test("streaming tokens do not retrigger stick scroll while already at the tail", () => {
  expect(
    shouldScrollFredStick(
      { force: true, isAtBottom: true, key: "2:b:4" },
      { force: true, isAtBottom: true, key: "2:b:40" },
    ),
  ).toBe(false);
});

test("a finished turn does not snap back if the user is reading history", () => {
  expect(
    shouldScrollFredStick(
      { force: true, isAtBottom: false, key: "2:b:40" },
      { force: false, isAtBottom: false, key: "2:b:40" },
    ),
  ).toBe(false);
});

test("isAtBottom flipping on the same key does not retrigger scroll", () => {
  expect(shouldScrollFredStick(atBottom, { force: false, isAtBottom: false, key: "1:a:10" })).toBe(
    false,
  );
  expect(
    shouldScrollFredStick(readingHistory, { force: false, isAtBottom: true, key: "1:a:10" }),
  ).toBe(false);
});

test("first paint sticks when the user is on the tail", () => {
  expect(shouldScrollFredStick(undefined, atBottom)).toBe(true);
});

test("escaped while still near the bottom does not follow new tokens", () => {
  expect(
    shouldScrollFredStick(
      { force: false, isAtBottom: false, key: "1:a:10" },
      { force: false, isAtBottom: false, key: "1:a:40" },
    ),
  ).toBe(false);
});

test("suggestion chips stay until the first assistant reply", () => {
  expect(shouldShowFredSuggestions([])).toBe(true);
  expect(shouldShowFredSuggestions([{ role: "user" }])).toBe(true);
  expect(shouldShowFredSuggestions([{ role: "user" }, { role: "assistant" }])).toBe(false);
  expect(shouldShowFredSuggestions([{ role: "assistant" }])).toBe(false);
});

test("Ask Fred shows a thinking shimmer while waiting for the model", async () => {
  const source = await Bun.file(join(import.meta.dir, "../components/ask-fred.tsx")).text();
  expect(source).toContain("shouldShowFredPending");
  expect(source).toContain("Thinking...");
  expect(source).toContain('from "@/components/ai-elements/shimmer"');
});
