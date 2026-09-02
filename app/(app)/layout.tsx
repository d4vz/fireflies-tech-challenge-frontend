import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppFrame } from "@components/app-frame";

type AppLayoutProps = {
  children: ReactNode;
};

function AppFrameFallback(props: { children: ReactNode }) {
  return (
    <div className="grid h-screen min-w-0 overflow-hidden md:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="hidden min-h-0 border-r border-line bg-paper md:block" />
      <div className="grid min-h-0 min-w-0 grid-rows-[64px_minmax(0,1fr)]">
        <header className="border-b border-line bg-paper" />
        <div className="min-h-0 min-w-0 overflow-hidden">{props.children}</div>
      </div>
    </div>
  );
}

export default function AppLayout(props: AppLayoutProps) {
  return (
    <Suspense fallback={<AppFrameFallback>{props.children}</AppFrameFallback>}>
      <AppFrame>{props.children}</AppFrame>
    </Suspense>
  );
}
