"use client";

import { useEffect, useState } from "react";
import {
  CHECKING_CAPTURE_READINESS,
  displaySurfacesReadiness,
  micReadinessFromPermission,
  type CaptureReadinessItem,
  type MicPermissionState,
} from "@lib/capture-readiness";

type CaptureReadinessItems = readonly CaptureReadinessItem[];

async function queryMicPermission(): Promise<{
  item: CaptureReadinessItem;
  permission: PermissionStatus | undefined;
}> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { item: micReadinessFromPermission("unavailable"), permission: undefined };
  }
  if (!navigator.permissions?.query) {
    return { item: micReadinessFromPermission("unknown"), permission: undefined };
  }

  try {
    const permission = await navigator.permissions.query({ name: "microphone" });
    return { item: micReadinessFromPermission(permission.state), permission };
  } catch {
    return { item: micReadinessFromPermission("unknown"), permission: undefined };
  }
}

function displayReadiness(): CaptureReadinessItem[] {
  return displaySurfacesReadiness({
    secureContext: window.isSecureContext,
    hasGetDisplayMedia: navigator.mediaDevices?.getDisplayMedia !== undefined,
  });
}

export function useCaptureReadiness(active: boolean): CaptureReadinessItems {
  const [items, setItems] = useState<CaptureReadinessItems>(CHECKING_CAPTURE_READINESS);

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;
    let permission: PermissionStatus | undefined;

    const updateMic = (state: MicPermissionState) => {
      setItems([micReadinessFromPermission(state), ...displayReadiness()]);
    };
    const onPermissionChange = () => updateMic(permission?.state ?? "unknown");

    async function runChecks() {
      const result = await queryMicPermission();
      if (cancelled) {
        return;
      }
      permission = result.permission;
      setItems([result.item, ...displayReadiness()]);
      permission?.addEventListener("change", onPermissionChange);
    }

    void runChecks();

    return () => {
      cancelled = true;
      permission?.removeEventListener("change", onPermissionChange);
    };
  }, [active]);

  return items;
}
