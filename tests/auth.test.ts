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
  expect(appLayout.includes("currentUser()")).toBe(false);
  expect(appLayout.includes("displayNameFrom")).toBe(false);
  expect(signIn.includes("AppFrame")).toBe(false);
  expect(signIn.includes("Capture")).toBe(false);
  expect(signIn.includes("AskFred")).toBe(false);
  expect(signIn.includes('from "@components/nav"')).toBe(false);
  expect(sso).toContain("AuthenticateWithRedirectCallback");
});

test("sign-in mounts Clerk SignIn and keeps auth routes off AppFrame", async () => {
  const signIn = await Bun.file(join(root, "app/(auth)/sign-in/[[...sign-in]]/page.tsx")).text();
  expect(signIn).toContain("<SignIn");
  expect(signIn.includes("useSignIn()")).toBe(false);
  expect(signIn.includes('strategy: "oauth_google"')).toBe(false);
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
  expect(frame.includes("WorkspaceMark")).toBe(false);
  expect(frame.includes("displayName")).toBe(false);
  expect(frame).toContain('src="/fireflies-logo.svg"');
  expect(home).toContain("displayName");
  expect(fred).toContain("displayName");
});

test("sidebar brand mark is the Fireflies SVG wordmark", async () => {
  const logo = await Bun.file(join(root, "public/fireflies-logo.svg")).text();
  expect(logo).toContain('viewBox="0 0 235 48"');
  expect(logo).toContain("#E82A73");
  expect(logo).toContain("#0C083D");
});

test("app favicon is the Fireflies mark without the wordmark", async () => {
  const icon = await Bun.file(join(root, "app/icon.svg")).text();
  const favicon = Bun.file(join(root, "app/favicon.ico"));
  expect(icon).toContain('viewBox="0 0 48 48"');
  expect(icon).toContain("#E82A73");
  expect(icon.includes("#0C083D")).toBe(false);
  expect(await favicon.exists()).toBe(true);
  expect(favicon.size).toBeGreaterThan(100);
});

test("Clerk UserButton sits beside Capture with the shadcn theme", async () => {
  const frame = await Bun.file(join(root, "components/app-frame.tsx")).text();
  const layout = await Bun.file(join(root, "app/(app)/layout.tsx")).text();
  const captureIndex = frame.indexOf("<Capture />");
  const accountIndex = frame.indexOf("<AccountButton");
  expect(frame).toContain('from "@clerk/ui/themes"');
  expect(frame).toContain("theme: shadcn");
  expect(frame).toContain("size-9 shrink-0");
  expect(frame).toContain('avatarBox: "!size-9"');
  expect(frame).toContain('userButtonTrigger: "!size-9"');
  expect(frame).toContain("h-9");
  expect(frame.includes("size-8 shrink-0")).toBe(false);
  expect(frame).toContain("fallback=");
  expect(layout.includes("imageUrl")).toBe(false);
  expect(captureIndex).toBeGreaterThan(-1);
  expect(accountIndex).toBeGreaterThan(captureIndex);
  expect(frame.includes("displayName.slice(0, 1)")).toBe(false);
  expect(frame.includes("AccountControl")).toBe(false);
  expect(frame.includes("props.imageUrl")).toBe(false);
});
