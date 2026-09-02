import { expect, test } from "bun:test";
import { displaySurfacesReadiness, micReadinessFromPermission } from "@lib/capture-readiness";

test("mic readiness is green when access is granted or can be requested", () => {
  expect(micReadinessFromPermission("granted").status).toBe("ready");
  expect(micReadinessFromPermission("prompt").status).toBe("ready");
  expect(micReadinessFromPermission("unknown").status).toBe("ready");
});

test("mic readiness is red when access is denied or unavailable", () => {
  expect(micReadinessFromPermission("denied").status).toBe("blocked");
  expect(micReadinessFromPermission("unavailable").status).toBe("blocked");
});

test("window and entire screen are green only when screen capture is supported", () => {
  const ready = displaySurfacesReadiness({ secureContext: true, hasGetDisplayMedia: true });
  expect(ready.map((item) => item.label)).toEqual(["Window", "Entire screen"]);
  expect(ready.every((item) => item.status === "ready")).toBe(true);

  const insecure = displaySurfacesReadiness({ secureContext: false, hasGetDisplayMedia: true });
  expect(insecure.every((item) => item.status === "blocked")).toBe(true);

  const unsupported = displaySurfacesReadiness({
    secureContext: true,
    hasGetDisplayMedia: false,
  });
  expect(unsupported.every((item) => item.status === "blocked")).toBe(true);
});
