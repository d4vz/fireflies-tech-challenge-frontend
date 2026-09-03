"use client";

import Image from "next/image";
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
  return (
    <Image
      alt=""
      className={props.className}
      fill
      onError={() => setFailed(true)}
      sizes="(max-width: 768px) 100vw, 240px"
      src={src}
      unoptimized
    />
  );
}
