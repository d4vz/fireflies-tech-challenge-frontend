export type CaptureIntent = "capture" | "upload";

type CaptureIntentListener = (intent: CaptureIntent) => void;

const listeners = new Set<CaptureIntentListener>();

export function subscribeCaptureIntent(listener: CaptureIntentListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestCaptureIntent(intent: CaptureIntent): void {
  for (const listener of listeners) {
    listener(intent);
  }
}
