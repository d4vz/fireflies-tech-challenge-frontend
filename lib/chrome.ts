export const NAV_DOCK_AT = "md";

export function displayNameFrom(
  firstName: string | null | undefined,
  email: string | null | undefined,
): string {
  const given = firstName?.trim();
  if (given) {
    return given;
  }
  const at = email?.indexOf("@") ?? -1;
  if (at > 0 && email) {
    const local = email.slice(0, at).trim();
    if (local) {
      return local;
    }
  }
  return "there";
}

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
