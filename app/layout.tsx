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

export default function RootLayout(props: RootLayoutProps) {
  return (
    <html lang="en" className={`${figtree.variable} ${figtree.className}`}>
      <body className="h-screen overflow-hidden bg-wash font-sans text-ink antialiased">
        <Providers>
          <Suspense>
            <AppFrame>{props.children}</AppFrame>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
