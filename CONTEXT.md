# Frontend

**BFF** — Next.js `/api/*` routes. The browser talks only to Next.js. Routes add the Clerk bearer and call the Backend gateway.

**Backend gateway** — `createBackendGateway({ fetch, getToken, baseUrl })`. Owns URL building, bearer, parse, `/api/...` rewrite, and error mapping. Production binds Clerk + global fetch. Tests bind a fake.

**Capture flow** — `createCaptureFlow({ record, upload, onChange, onUploaded })`. Owns session and sequencing (record then upload, named file upload, permission denial, upload failure). The Capture component binds UI.

**Assistant presence** — URL truth (`?fred=1`). `useAssistantPresence()` returns `{ open, openHref, closeHref, close }`. `assistant-url.ts` keeps encoding only.
