type ClipProps = {
  src: string;
  poster: string;
  className: string;
};

export function Clip(props: ClipProps) {
  return (
    <video
      className={props.className}
      src={props.src}
      poster={props.poster}
      controls
      playsInline
      preload="metadata"
    />
  );
}
