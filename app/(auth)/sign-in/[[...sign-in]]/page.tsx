"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-[18px]" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SignInPage() {
  const { errors, fetchStatus, signIn } = useSignIn();
  const [ssoError, setSsoError] = useState<string | null>(null);
  const fetching = fetchStatus === "fetching";
  const errorText = ssoError ?? errors.global?.[0]?.message;

  async function continueWithGoogle() {
    setSsoError(null);
    if (!signIn) {
      return;
    }
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: "/",
      redirectCallbackUrl: "/sso-callback",
    });
    if (error) {
      setSsoError(error.message);
    }
  }

  return (
    <main className="relative h-screen overflow-hidden bg-wash">
      <div aria-hidden="true" className="sign-in-grain pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex h-full max-w-[36rem] flex-col justify-center px-10 py-24">
        <h1 className="m-0 text-[3.5rem] leading-[0.92] font-semibold tracking-[-0.05em] text-ink md:text-[4.25rem]">
          Meetings
        </h1>
        <p className="mt-6 max-w-[14rem] text-[1.05rem] leading-relaxed text-ink/50">
          Sign in to see yours.
        </p>
        <button
          type="button"
          aria-label="Continue with Google"
          aria-busy={fetching}
          disabled={fetching || !signIn}
          onClick={() => void continueWithGoogle()}
          className="mt-20 inline-flex h-10 w-fit items-center gap-3 rounded-full border border-[#747775] bg-paper px-3.5 text-[0.875rem] font-medium text-[#1f1f1f] hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleMark />
          Continue with Google
        </button>
        {errorText ? <p className="mt-5 max-w-sm text-[0.85rem] text-danger">{errorText}</p> : null}
      </div>
    </main>
  );
}
