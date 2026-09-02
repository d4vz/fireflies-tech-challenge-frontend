import { formatWhen } from "@lib/meetings";

type WhenProps = {
  value: string;
  className?: string;
};

export function When(props: WhenProps) {
  return (
    <time className={props.className} dateTime={props.value} suppressHydrationWarning>
      {formatWhen(props.value)}
    </time>
  );
}
