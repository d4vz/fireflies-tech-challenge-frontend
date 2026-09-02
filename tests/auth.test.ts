import { expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

test("proxy.ts is protected-first with sign-in and sso-callback public", async () => {
  const proxy = await Bun.file(join(root, "proxy.ts")).text();
  expect(proxy).toContain("clerkMiddleware");
  expect(proxy).toContain("createRouteMatcher");
  expect(proxy).toContain("/sign-in(.*)");
  expect(proxy).toContain("/sso-callback(.*)");
  expect(proxy).toContain("auth.protect()");
  expect(proxy.includes("middleware.ts")).toBe(false);
});

test("root layout mounts ClerkProvider inside body and not AppFrame", async () => {
  const layout = await Bun.file(join(root, "app/layout.tsx")).text();
  expect(layout).toContain("<ClerkProvider");
  expect(layout).toContain("appearance={{ theme: shadcn }}");
  expect(layout).toContain("<body");
  const bodyIndex = layout.indexOf("<body");
  const providerIndex = layout.indexOf("<ClerkProvider");
  expect(bodyIndex).toBeGreaterThan(-1);
  expect(providerIndex).toBeGreaterThan(bodyIndex);
  expect(layout.includes("AppFrame")).toBe(false);
});

test("app group wraps pages with AppFrame and auth routes do not", async () => {
  const appLayout = await Bun.file(join(root, "app/(app)/layout.tsx")).text();
  const signIn = await Bun.file(join(root, "app/(auth)/sign-in/[[...sign-in]]/page.tsx")).text();
  const sso = await Bun.file(join(root, "app/(auth)/sso-callback/page.tsx")).text();
  expect(appLayout).toContain("AppFrame");
  expect(appLayout).toContain("currentUser()");
  expect(appLayout).toContain("displayNameFrom");
  expect(signIn.includes("AppFrame")).toBe(false);
  expect(signIn.includes("Capture")).toBe(false);
  expect(signIn.includes("AskFred")).toBe(false);
  expect(signIn.includes('from "@components/nav"')).toBe(false);
  expect(sso).toContain("AuthenticateWithRedirectCallback");
});

test("sign-in starts Google SSO and has no email fields or SignIn widget", async () => {
  const signIn = await Bun.file(join(root, "app/(auth)/sign-in/[[...sign-in]]/page.tsx")).text();
  expect(signIn).toContain("useSignIn()");
  expect(signIn).toContain('strategy: "oauth_google"');
  expect(signIn).toContain('redirectUrl: "/"');
  expect(signIn).toContain('redirectCallbackUrl: "/sso-callback"');
  expect(signIn).toContain("Google");
  expect(signIn.includes("<SignIn")).toBe(false);
  expect(signIn.includes('type="password"')).toBe(false);
  expect(signIn.includes('type="email"')).toBe(false);
});

test("Home RSC loads meetings through the authed backend helper", async () => {
  const page = await Bun.file(join(root, "app/(app)/page.tsx")).text();
  expect(page).toContain('from "@lib/backend"');
  expect(page).toContain("listMeetings");
});

test("WORKSPACE_NAME is gone from chrome and greeting callers", async () => {
  const chrome = await Bun.file(join(root, "lib/chrome.ts")).text();
  const frame = await Bun.file(join(root, "components/app-frame.tsx")).text();
  const home = await Bun.file(join(root, "components/home.tsx")).text();
  const fred = await Bun.file(join(root, "components/ask-fred.tsx")).text();
  expect(chrome.includes("WORKSPACE_NAME")).toBe(false);
  expect(frame.includes("WORKSPACE_NAME")).toBe(false);
  expect(home.includes("WORKSPACE_NAME")).toBe(false);
  expect(fred.includes("WORKSPACE_NAME")).toBe(false);
  expect(frame).toContain("UserButton");
  expect(frame).toContain("displayName");
  expect(home).toContain("displayName");
  expect(fred).toContain("displayName");
});
