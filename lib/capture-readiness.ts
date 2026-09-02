export type CaptureReadinessStatus = "checking" | "ready" | "blocked";

export type CaptureReadinessItem = {
  label: string;
  status: CaptureReadinessStatus;
  detail: string;
};

export const CHECKING_CAPTURE_READINESS: readonly CaptureReadinessItem[] = [
  { label: "Mic", status: "checking", detail: "Checking microphone access." },
  { label: "Window", status: "checking", detail: "Checking window sharing support." },
  { label: "Entire screen", status: "checking", detail: "Checking entire screen sharing support." },
];

export type MicPermissionState = PermissionState | "unknown" | "unavailable";

export function micReadinessFromPermission(state: MicPermissionState): CaptureReadinessItem {
  switch (state) {
    case "granted":
      return { label: "Mic", status: "ready", detail: "Microphone access is enabled." };
    case "prompt":
      return {
        label: "Mic",
        status: "ready",
        detail: "The browser will ask for microphone access when needed.",
      };
    case "denied":
      return {
        label: "Mic",
        status: "blocked",
        detail: "Microphone permission is blocked for this browser.",
      };
    case "unknown":
      return {
        label: "Mic",
        status: "ready",
        detail: "This browser can ask for microphone access when recording starts.",
      };
    case "unavailable":
      return {
        label: "Mic",
        status: "blocked",
        detail: "This browser cannot access a microphone.",
      };
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

const DISPLAY_SURFACES = [
  { label: "Window", readyDetail: "The browser can share a window." },
  { label: "Entire screen", readyDetail: "The browser can share the entire screen." },
] as const;

export function displaySurfacesReadiness(input: {
  secureContext: boolean;
  hasGetDisplayMedia: boolean;
}): CaptureReadinessItem[] {
  let status: CaptureReadinessStatus = "ready";
  let blockedDetail: string | undefined;
  if (!input.secureContext) {
    status = "blocked";
    blockedDetail = "Screen capture needs HTTPS or localhost.";
  } else if (!input.hasGetDisplayMedia) {
    status = "blocked";
    blockedDetail = "This browser does not support screen capture.";
  }
  return DISPLAY_SURFACES.map((surface) => ({
    label: surface.label,
    status,
    detail: blockedDetail ?? surface.readyDetail,
  }));
}
