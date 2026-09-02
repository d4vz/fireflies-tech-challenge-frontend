import type { ReactNode } from "react";
import { Capture } from "@components/capture";
import { Nav, PageTitle } from "@components/nav";

type ShellProps = {
  children: ReactNode;
};

export function Shell(props: ShellProps) {
  return (
    <div className="grid h-screen grid-cols-[232px_1fr] overflow-hidden">
      <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto border-r border-line bg-paper px-3.5 py-[1.15rem]">
        <div className="flex items-center gap-2.5 px-2 py-1.5 text-ink">
          <span className="grid size-7 place-items-center rounded-full bg-process-wash text-xs font-bold text-accent">
            D
          </span>
          <span className="text-[0.95rem] font-semibold">Davi</span>
        </div>
        <Nav />
      </aside>
      <div className="grid min-h-0 min-w-0 grid-rows-[64px_1fr]">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-paper px-6">
          <PageTitle />
          <Capture />
        </header>
        <div className="min-h-0 overflow-hidden">{props.children}</div>
      </div>
    </div>
  );
}
