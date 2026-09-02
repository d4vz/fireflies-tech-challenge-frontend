import type { IconHandle } from "@animateicons/react";
import type { MouseEvent, RefObject } from "react";

export function handleHover(
  event: Pick<MouseEvent, "type">,
  ref: RefObject<IconHandle | null>,
): void {
  if (event.type === "mouseenter") {
    ref.current?.startAnimation();
  }
  if (event.type === "mouseleave") {
    ref.current?.stopAnimation();
  }
}
