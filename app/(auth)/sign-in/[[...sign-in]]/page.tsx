import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="relative grid h-screen place-items-center bg-wash">
      <div aria-hidden="true" className="sign-in-grain pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col items-center gap-6">
        <img
          alt="Fireflies"
          className="h-6 w-auto"
          height={24}
          src="/fireflies-logo.svg"
          width={118}
        />
        <SignIn />
      </div>
    </main>
  );
}
