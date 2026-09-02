import { Inbox } from "@animateicons/react/lucide";

export type EmptyNoteProps = {
  title: string;
  body: string;
};

export function EmptyNote(props: EmptyNoteProps) {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-12 text-center md:py-16">
      <span className="grid size-12 place-items-center rounded-2xl bg-wash text-muted-foreground">
        <Inbox size={20} />
      </span>
      <h2 className="mt-4 mb-0 text-[1.15rem] font-semibold tracking-tight">{props.title}</h2>
      <p className="mt-2 mb-0 max-w-md text-[0.9rem] leading-6 text-muted-foreground">
        {props.body}
      </p>
    </div>
  );
}
