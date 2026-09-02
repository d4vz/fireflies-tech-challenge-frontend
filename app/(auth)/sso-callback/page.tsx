import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <main className="grid h-screen place-items-center bg-wash">
      <AuthenticateWithRedirectCallback />
    </main>
  );
}
