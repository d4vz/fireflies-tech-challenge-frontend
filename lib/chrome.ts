export const WORKSPACE_NAME = "Davi";

export const NAV_DOCK_AT = "md";

export const ASSISTANT_DOCK_AT = "xl";

export const TRANSCRIPT_DOCK_AT = "lg";

export type DayPeriod = "morning" | "afternoon" | "evening";

export function periodAt(now: Date): DayPeriod {
  const hour = now.getHours();
  if (hour < 12) {
    return "morning";
  }
  if (hour < 17) {
    return "afternoon";
  }
  return "evening";
}
