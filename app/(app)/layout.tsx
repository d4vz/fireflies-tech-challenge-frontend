import type { ReactNode } from "react";
import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { AppFrame } from "@components/app-frame";
import { displayNameFrom } from "@lib/chrome";

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

export default async function AppLayout(props: AppLayoutProps) {
  const user = await currentUser();
  const displayName = displayNameFrom(
    user?.firstName,
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress,
  );
  return (
    <Suspense fallback={<AppFrameFallback>{props.children}</AppFrameFallback>}>
      <AppFrame displayName={displayName}>{props.children}</AppFrame>
    </Suspense>
  );
}
