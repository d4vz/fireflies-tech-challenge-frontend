import Link from "next/link";

export type FilterTabProps = {
  href: string;
  active: boolean;
  label: string;
};

export function FilterTab(props: FilterTabProps) {
  return (
    <Link
      aria-current={props.active ? "page" : undefined}
      className={
        props.active
          ? "-mb-px border-b-2 border-ink px-1 pb-3 text-sm font-semibold text-ink no-underline transition-colors"
          : "px-1 pb-3 text-sm text-muted-foreground no-underline transition-colors hover:text-ink"
      }
      href={props.href}
    >
      {props.label}
    </Link>
  );
}
