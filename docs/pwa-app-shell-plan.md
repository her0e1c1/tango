# PWA App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and verify an installable Tango application shell with safe offline navigation and explicit Firebase Hosting cache policies.

**Architecture:** `vite-plugin-pwa` owns one exported `generateSW` configuration consumed by Vite and focused tests. Workbox precaches only build assets and install assets, while a separate build verifier validates the emitted manifest, registration script, and Service Worker. Firebase Hosting revalidates stable-name resources and caches Vite fingerprinted assets immutably.

**Tech Stack:** Vite 8, React 19, TypeScript 5.9, vite-plugin-pwa 1.3, Workbox 7, Vitest 4, Firebase Hosting.

## Global Constraints

- Use `generateSW`; do not add a handwritten Service Worker or `injectManifest`.
- Use prompt update behavior and do not automatically reload clients.
- Do not add runtime caching for Firebase Auth, Firestore, external imports, or user data.
- Keep the app base, manifest scope, Service Worker scope, manifest `id`, and `start_url` at `/`.
- Reuse the existing Tango mark; do not redesign it.
- Run focused tests through the RED/GREEN cycle before `make check` and `make build`.

---

### Task 1: Define the generated PWA contract

**Files:**

- Create: `pwaConfig.ts`
- Create: `pwaConfig.spec.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**

- Produces: inferred `pwaOptions` satisfying `Partial<VitePWAOptions>` for `VitePWA(pwaOptions)` and focused tests.
- Consumes: the existing Vite `/` base and Tango public assets.

- [ ] **Step 1: Install the compatible PWA build dependency**

Run:

```bash
npm install --save-dev vite-plugin-pwa@^1.3.0
```

Expected: `package.json` and `package-lock.json` add `vite-plugin-pwa` without changing existing direct dependency versions.

- [ ] **Step 2: Write the failing PWA configuration test**

Create `pwaConfig.spec.ts` with assertions equivalent to:

```ts
import { describe, expect, it } from "vitest";
import { pwaOptions } from "./pwaConfig";

describe("PWA build configuration", () => {
  it("generates a root-scoped prompt-updated application shell", () => {
    expect(pwaOptions).toMatchObject({
      strategies: "generateSW",
      registerType: "prompt",
      injectRegister: "script-defer",
      manifestFilename: "manifest.json",
      manifest: {
        id: "/",
        scope: "/",
        start_url: "/",
        name: "Tango Is Flashcards For Programmers",
        short_name: "Tango",
        description: "Flashcards For Programmers",
        display: "standalone",
        theme_color: "#f7f8fa",
        background_color: "#f7f8fa",
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        navigateFallback: "index.html",
      },
    });
    expect(pwaOptions.manifest).not.toHaveProperty("orientation");
    expect(pwaOptions.workbox).not.toHaveProperty("runtimeCaching");
  });
});
```

- [ ] **Step 3: Run the focused test to verify RED**

Run:

```bash
npm run test:unit -- pwaConfig.spec.ts
```

Expected: FAIL because `pwaConfig.ts` does not exist.

- [ ] **Step 4: Implement the minimal exported configuration**

Create `pwaConfig.ts` with this contract:

```ts
import type { VitePWAOptions } from "vite-plugin-pwa";

export const pwaOptions = {
  strategies: "generateSW",
  registerType: "prompt",
  injectRegister: "script-defer",
  manifestFilename: "manifest.json",
  includeAssets: [
    "favicon.ico",
    "tango-mark.svg",
    "logo192.png",
    "logo512.png",
    "logo192-maskable.png",
    "logo512-maskable.png",
    "apple-touch-icon.png",
  ],
  manifest: {
    id: "/",
    scope: "/",
    start_url: "/",
    name: "Tango Is Flashcards For Programmers",
    short_name: "Tango",
    description: "Flashcards For Programmers",
    display: "standalone",
    theme_color: "#f7f8fa",
    background_color: "#f7f8fa",
    icons: [
      { src: "tango-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "logo192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "logo512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "logo192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "logo512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html}"],
    cleanupOutdatedCaches: true,
    clientsClaim: false,
    skipWaiting: false,
    navigateFallback: "index.html",
    navigateFallbackDenylist: [/^\/__\//],
  },
} satisfies Partial<VitePWAOptions>;
```

- [ ] **Step 5: Run the focused test to verify GREEN**

Run:

```bash
npm run test:unit -- pwaConfig.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the generated PWA configuration**

```bash
git add package.json package-lock.json pwaConfig.ts pwaConfig.spec.ts
git commit -m "feat: define generated PWA config"
```

---

### Task 2: Generate and validate maskable and Apple assets

**Files:**

- Modify: `scripts/generate-pwa-icons.mjs`
- Modify: `src/lib/pwaAssets.spec.ts`
- Modify: `index.html`
- Create: `public/logo192-maskable.png`
- Create: `public/logo512-maskable.png`
- Create: `public/apple-touch-icon.png`

**Interfaces:**

- Consumes: `public/tango-mark.svg` as the only artwork source.
- Produces: opaque maskable 192px/512px files and an opaque 180px Apple touch file referenced by `pwaOptions` and `index.html`.

- [ ] **Step 1: Extend the asset contract first**

Update `src/lib/pwaAssets.spec.ts` to import `pwaOptions`, read manifest fields from `pwaOptions.manifest`, require regular and maskable icon entries, require `/apple-touch-icon.png` in HTML, and validate these PNG dimensions:

```ts
it.each([
  ["public/logo192-maskable.png", 192],
  ["public/logo512-maskable.png", 512],
  ["public/apple-touch-icon.png", 180],
])("provides an opaque install asset at %s", (relativePath, expectedSize) => {
  const bytes = readBytes(relativePath);
  const png = decodeRgbaPng(bytes);
  expect(png).toMatchObject({ width: expectedSize, height: expectedSize });
  expect(png?.pixels.readUInt8(3)).toBe(255);
  expect(png?.pixels.readUInt8(png.pixels.length - 1)).toBe(255);
});
```

Also require no `orientation` field and exact `/` values for `id`, `scope`, and `start_url`.

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm run test:unit -- src/lib/pwaAssets.spec.ts
```

Expected: FAIL because the maskable and Apple PNG files do not exist.

- [ ] **Step 3: Extend the existing generator**

Refactor `renderMark` to accept background color and artwork scale. Preserve the transparent regular icons and favicon. Generate maskable icons at 72% mark scale on `#f7f8fa`, and generate the 180px Apple icon at 80% mark scale on the same opaque background.

Point the Apple touch link in `index.html` at `/apple-touch-icon.png`. Keep the handwritten manifest link until Task 4 integrates manifest injection.

The rendering API is:

```js
async function renderMark(size, { background = "transparent", scale = 1 } = {})
```

The output table is:

```js
[
  ["logo512.png", 512, { scale: 1 }],
  ["logo192.png", 192, { scale: 1 }],
  ["logo512-maskable.png", 512, { background: "#f7f8fa", scale: 0.72 }],
  ["logo192-maskable.png", 192, { background: "#f7f8fa", scale: 0.72 }],
  ["apple-touch-icon.png", 180, { background: "#f7f8fa", scale: 0.8 }],
]
```

- [ ] **Step 4: Generate the raster files**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml:.devcontainer/compose.e2e.yaml docker compose up --wait --wait-timeout 120 --remove-orphans -d browser
COMPOSE_FILE=.devcontainer/compose.yaml:.devcontainer/compose.e2e.yaml docker compose run --rm --remove-orphans --no-deps --entrypoint node dev scripts/generate-pwa-icons.mjs
```

Expected: all three new files exist and existing regular asset hashes remain unchanged.

- [ ] **Step 5: Run the focused asset test to verify GREEN**

Run:

```bash
npm run test:unit -- src/lib/pwaAssets.spec.ts pwaConfig.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the install assets**

```bash
git add scripts/generate-pwa-icons.mjs src/lib/pwaAssets.spec.ts index.html public/logo192-maskable.png public/logo512-maskable.png public/apple-touch-icon.png
git commit -m "feat: add install-safe Tango assets"
```

---

### Task 3: Enforce the Firebase Hosting cache policy

**Files:**

- Modify: `src/lib/hostingConfig.spec.ts`
- Modify: `firebase.json`

**Interfaces:**

- Produces: a catch-all revalidation rule followed by an immutable fingerprinted-asset rule.

- [ ] **Step 1: Change the expected header contract first**

Update the focused test to expect:

```ts
expect(firebaseConfig.hosting.headers).toEqual([
  {
    source: "**",
    headers: [{ key: "Cache-Control", value: "no-cache" }],
  },
  {
    source: "/assets/**",
    headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
  },
]);
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm run test:unit -- src/lib/hostingConfig.spec.ts
```

Expected: FAIL because the catch-all value is still `no-cache, no-store`.

- [ ] **Step 3: Apply the minimal Hosting change**

Change only the catch-all `Cache-Control` value in `firebase.json` to `no-cache`. Preserve the existing rule order and SPA rewrite.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run:

```bash
npm run test:unit -- src/lib/hostingConfig.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the Hosting contract**

```bash
git add firebase.json src/lib/hostingConfig.spec.ts
git commit -m "fix: revalidate PWA entry resources"
```

---

### Task 4: Verify production PWA artifacts

**Files:**

- Create: `scripts/pwa-build-verifier.mjs`
- Create: `scripts/pwa-build-verifier.spec.mjs`
- Create: `scripts/verify-pwa-build.mjs`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `index.html`
- Delete: `public/manifest.json`

**Interfaces:**

- Produces: `verifyPwaBuild(buildDirectory)` which throws a descriptive error for a missing or inconsistent artifact.
- Consumes: the production `build/` directory after `vite build`.

- [ ] **Step 1: Write verifier fixture tests first**

Create temporary build fixtures for a valid app shell and for each invalid contract. Assert that the verifier accepts the valid fixture and rejects missing manifest, missing Service Worker, missing registration script, missing manifest icon, non-root scope, missing `index.html` precache, missing fingerprinted asset precache, missing navigation fallback, missing outdated-cache cleanup, and a non-navigation runtime cache route.

The public API under test is:

```js
import { verifyPwaBuild } from "./pwa-build-verifier.mjs";

expect(() => verifyPwaBuild(fixtureDirectory)).not.toThrow();
expect(() => verifyPwaBuild(invalidFixtureDirectory)).toThrow(/manifest\.json/);
```

- [ ] **Step 2: Run the verifier spec to verify RED**

Run:

```bash
npm run test:unit -- scripts/pwa-build-verifier.spec.mjs
```

Expected: FAIL because `scripts/pwa-build-verifier.mjs` does not exist.

- [ ] **Step 3: Implement the verifier and CLI wrapper**

Implement `verifyPwaBuild` with `node:fs` and `node:path`. Parse `manifest.json`; inspect built HTML with string and regular-expression checks; inspect `registerSW.js` for a root-scoped `/sw.js` registration; inspect `sw.js` for `index.html`, a fingerprinted `/assets/` script or stylesheet, Workbox navigation fallback, outdated cache cleanup, and no second non-navigation `registerRoute` call.

Import `VitePWA` and `pwaOptions` in `vite.config.ts`, append `VitePWA(pwaOptions)` to the existing plugin list, remove the handwritten manifest link from `index.html`, and delete `public/manifest.json` so the plugin owns the emitted manifest.

Create `scripts/verify-pwa-build.mjs`:

```js
import path from "node:path";
import { verifyPwaBuild } from "./pwa-build-verifier.mjs";

verifyPwaBuild(path.resolve(process.cwd(), "build"));
console.log("Verified production PWA artifacts.");
```

Change the package build script to:

```json
"build": "vite build && node scripts/verify-pwa-build.mjs"
```

- [ ] **Step 4: Run verifier tests to verify GREEN**

Run:

```bash
npm run test:unit -- scripts/pwa-build-verifier.spec.mjs
```

Expected: PASS.

- [ ] **Step 5: Build and inspect real output**

Run:

```bash
npm run build
```

Expected: Vite and Workbox complete, then print `Verified production PWA artifacts.`.

- [ ] **Step 6: Commit build verification**

```bash
git add package.json vite.config.ts index.html public/manifest.json scripts/pwa-build-verifier.mjs scripts/pwa-build-verifier.spec.mjs scripts/verify-pwa-build.mjs
git commit -m "test: verify generated PWA artifacts"
```

---

### Task 5: Complete repository verification

**Files:**

- Verify all files changed by Tasks 1-4.

- [ ] **Step 1: Run focused PWA tests**

```bash
npm run test:unit -- pwaConfig.spec.ts src/lib/pwaAssets.spec.ts src/lib/hostingConfig.spec.ts scripts/pwa-build-verifier.spec.mjs
```

Expected: all focused tests pass with no warnings introduced by the changed code.

- [ ] **Step 2: Run the repository check**

```bash
make check
```

Expected: formatting, lint, sample build, and unit tests pass.

- [ ] **Step 3: Run the production and Storybook builds**

```bash
make build
```

Expected: sample build, verified production PWA build, and Storybook build pass.

- [ ] **Step 4: Review the final change set**

```bash
git status --short
git diff --check
git diff origin/main...HEAD --stat
git log --oneline origin/main..HEAD
```

Expected: only Issue #253 files and its design/plan documents are included, with no ignored build output.

- [ ] **Step 5: Create the Ready PR**

Push `issue-253-pwa-shell` and open a Ready PR against `main` with `Closes #253`, a concise summary, and the exact verification commands.
