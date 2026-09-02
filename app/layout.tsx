import type { ReactNode } from "react";
import { Figtree, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Providers } from "@app/providers";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata = {
  title: "Meetings",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout(props: RootLayoutProps) {
  return (
    <html lang="en" className={`${figtree.variable} ${geistMono.variable} ${figtree.className}`}>
      <body className="h-screen overflow-hidden bg-wash font-sans text-ink antialiased">
        <ClerkProvider appearance={{ theme: shadcn }} signInUrl="/sign-in" signUpUrl="/sign-in">
          <Providers>{props.children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
