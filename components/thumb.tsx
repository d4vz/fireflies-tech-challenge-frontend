"use client";

import { useEffect, useState } from "react";

type ThumbProps = {
  src: string;
  className: string;
};

export function Thumb(props: ThumbProps) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    setSrc(props.src);
  }, [props.src]);
  if (!src || failed) {
    return null;
  }
  return <img className={props.className} src={src} alt="" onError={() => setFailed(true)} />;
}
