"use client";

import { useEffect, useState } from "react";
import { formatWhen } from "@lib/meetings";

type WhenProps = {
  value: string;
  className?: string;
};

export function When(props: WhenProps) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(formatWhen(props.value));
  }, [props.value]);
  return (
    <time className={props.className} dateTime={props.value}>
      {label}
    </time>
  );
}
