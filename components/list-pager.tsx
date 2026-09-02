import { ChevronLeft, ChevronRight } from "@animateicons/react/lucide";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type ListPagerProps = {
  page: number;
  pageCount: number;
  prevHref: string;
  nextHref: string;
};

function PagerControl(props: { href: string; disabled: boolean; kind: "prev" | "next" }) {
  const label = props.kind === "prev" ? "Previous" : "Next";
  const icon = props.kind === "prev" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />;
  if (props.disabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        {props.kind === "prev" ? icon : null}
        {label}
        {props.kind === "next" ? icon : null}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={props.href}>
        {props.kind === "prev" ? icon : null}
        {label}
        {props.kind === "next" ? icon : null}
      </Link>
    </Button>
  );
}

export function ListPager(props: ListPagerProps) {
  return (
    <nav className="flex shrink-0 items-center justify-end gap-3 border-t border-line bg-wash px-4 py-3 text-[0.85rem] md:px-8">
      <PagerControl disabled={props.page <= 1} href={props.prevHref} kind="prev" />
      <span className="text-muted-foreground">
        Page {props.page} of {props.pageCount}
      </span>
      <PagerControl disabled={props.page >= props.pageCount} href={props.nextHref} kind="next" />
    </nav>
  );
}
