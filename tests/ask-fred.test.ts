import { expect, test } from "bun:test";
import {
  ASK_FRED_PLACEHOLDER,
  askFredMeetingPath,
  isAskFredBusy,
  shouldScrollFredStick,
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

test("Ask Fred maps meeting hrefs onto the detail path", () => {
  const origin = "http://127.0.0.1:8080";
  const path = "/meetings/6a963d4f786296c73b01d6d0";
  expect(askFredMeetingPath(path, origin)).toBe(path);
  expect(askFredMeetingPath(`http://127.0.0.1:8080${path}`, origin)).toBe(path);
  expect(askFredMeetingPath(`https://example.com${path}`, origin)).toBe(path);
  expect(askFredMeetingPath(`https://your_workspace_url${path}`, origin)).toBe(path);
  expect(
    askFredMeetingPath(
      "http://127.0.0.1:9000/fireflies/meetings/6a963d4f786296c73b01d6d0/video",
      origin,
    ),
  ).toBeUndefined();
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
