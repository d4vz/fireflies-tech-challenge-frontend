import type { ReactNode } from "react";
import { Suspense } from "react";
import { Figtree } from "next/font/google";
import { AppFrame } from "@components/app-frame";
import { Providers } from "@app/providers";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata = {
  title: "Meetings",
};

type RootLayoutProps = {
  children: ReactNode;
};

function AppFrameFallback(props: { children: ReactNode }) {
  return (
    <div className="grid h-screen overflow-hidden md:grid-cols-[232px_1fr]">
      <aside className="hidden min-h-0 border-r border-line bg-paper md:block" />
      <div className="grid min-h-0 min-w-0 grid-rows-[64px_1fr]">
        <header className="border-b border-line bg-paper" />
        <div className="min-h-0 overflow-hidden">{props.children}</div>
      </div>
    </div>
  );
}

export default function RootLayout(props: RootLayoutProps) {
  return (
    <html lang="en" className={`${figtree.variable} ${figtree.className}`}>
      <body className="h-screen overflow-hidden bg-wash font-sans text-ink antialiased">
        <Providers>
          <Suspense fallback={<AppFrameFallback>{props.children}</AppFrameFallback>}>
            <AppFrame>{props.children}</AppFrame>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
