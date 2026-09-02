import { Mic } from "@animateicons/react/lucide";
import type { Meeting } from "@lib/meetings";

type ClipProps = {
  blob: Meeting["blob"];
  className: string;
};

export function Clip(props: ClipProps) {
  switch (props.blob.kind) {
    case "video":
      return (
        <video
          className={props.className}
          src={props.blob.url}
          poster={props.blob.thumbnailUrl}
          controls
          playsInline
          preload="metadata"
        />
      );
    case "audio":
      return (
        <div className={`flex items-center gap-3 bg-paper px-4 py-3 ${props.className}`}>
          <Mic className="shrink-0 text-muted-foreground" size={20} aria-hidden="true" />
          <audio className="min-w-0 flex-1" src={props.blob.url} controls preload="metadata" />
        </div>
      );
    default: {
      const _exhaustive: never = props.blob;
      return _exhaustive;
    }
  }
}
