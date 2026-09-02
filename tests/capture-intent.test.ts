import { expect, test } from "bun:test";
import { requestCaptureIntent, subscribeCaptureIntent } from "@lib/capture-intent";

test("requestCaptureIntent delivers capture and upload to subscribers", () => {
  const received: string[] = [];
  const stop = subscribeCaptureIntent((intent) => {
    received.push(intent);
  });
  requestCaptureIntent("capture");
  requestCaptureIntent("upload");
  stop();
  expect(received).toEqual(["capture", "upload"]);
});

test("unsubscribe stops further capture intents", () => {
  const received: string[] = [];
  const stop = subscribeCaptureIntent((intent) => {
    received.push(intent);
  });
  stop();
  requestCaptureIntent("capture");
  expect(received).toEqual([]);
});
