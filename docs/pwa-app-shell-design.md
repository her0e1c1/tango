# PWA App Shell Design

## Context

Tango already ships a Web App Manifest and Tango identity assets, but the Vite build does not generate or register a Service Worker. Firebase Hosting also applies one broad cache policy to most responses instead of distinguishing revalidated entry points from fingerprinted application assets.

Issue #253 introduces an installable, offline-capable application shell. It does not add offline Firebase data access, background sync, or the update prompt UI planned by Issue #254.

## Goals

- Generate the Web App Manifest and Service Worker from the production Vite build under the same `/` base and scope.
- Precache the application shell and support offline navigation to every existing BrowserRouter route.
- Keep Firebase Auth, Firestore, external import URLs, and user data out of Service Worker runtime caches.
- Preserve normal online SPA startup when Service Workers are unavailable or registration fails.
- Define Firebase Hosting cache headers that revalidate update-sensitive resources and cache fingerprinted application assets for one year.
- Verify the source configuration and production build artifacts automatically.

## Non-goals

- Do not add an update notification or reload control.
- Do not automatically reload the page when a new Service Worker is waiting.
- Do not add runtime caching, Firestore persistence, an outbox, background sync, or conflict resolution.
- Do not redesign the Tango mark or add optional manifest features such as screenshots, shortcuts, or a share target.
- Do not replace `generateSW` with `injectManifest` or a handwritten Service Worker.

## Build Configuration

Add `vite-plugin-pwa` as a development dependency and configure `VitePWA` in `vite.config.ts` with the `generateSW` strategy. The plugin configuration is the single source of truth for the Web App Manifest, and the build emits it as `manifest.json` to preserve the existing public URL.

Use the default prompt update behavior explicitly. Registration is injected as a deferred script so unsupported browsers and registration failures remain separate from the React entry module and cannot prevent the online SPA from rendering. Development Service Workers remain disabled; the offline contract is a production-build concern.

## Manifest and Identity Assets

The generated manifest defines stable root-relative values for `id`, `scope`, and `start_url`. It retains the existing Tango name, short name, description, standalone display mode, and Calm Focus colors. It removes the current landscape orientation restriction because no route establishes landscape as an application-wide requirement.

The manifest references the existing 192px and 512px Tango icons as regular icons. The existing Tango mark remains the artwork source for new 192px and 512px maskable derivatives with an opaque Calm Focus background and safe padding. The Apple touch link references a dedicated 180px opaque derivative from the same mark. This changes packaging, not the Tango identity.

The light HTML theme color matches the manifest theme color. The existing media-specific dark theme color remains so browser chrome follows the active system theme without requiring two manifests.

## Service Worker Behavior

Workbox precaches the generated HTML entry point, fingerprinted JavaScript and CSS, and the static Tango assets required by the install surface. Navigations fall back to the precached `index.html`, allowing every existing BrowserRouter path to reopen offline after one successful production visit.

The configuration enables outdated precache cleanup during activation. It does not define `runtimeCaching`, so Firebase requests, Firestore traffic, external imports, and user-generated data continue to use their existing network and application storage behavior.

The prompt registration mode leaves a newer worker waiting. Issue #254 can later expose that waiting state and let the user choose when to update without first replacing the Service Worker strategy.

## Hosting Cache Contract

Firebase Hosting keeps the existing SPA rewrite to `/index.html`. The catch-all response policy becomes `Cache-Control: no-cache`, allowing HTML, deep-link responses, `manifest.json`, `sw.js`, icons, and other stable-name resources to be stored but revalidated before reuse. The later `/assets/**` rule keeps Vite's content-hashed application assets at `public, max-age=31536000, immutable`.

Header matching happens against the requested path before rewrites, so the catch-all policy also covers BrowserRouter deep links while the fingerprinted asset rule overrides their caching behavior for `/assets/**`.

## Verification

Focused Vitest contracts cover the PWA configuration, manifest fields, icon purposes, registration mode, absence of runtime caching, navigation fallback, outdated cache cleanup, and Firebase Hosting header order.

The existing PWA asset tests continue to validate the Tango source and raster files. They are extended for the maskable derivatives and the generated manifest configuration.

The production build runs an artifact verifier that checks:

- `manifest.json`, `sw.js`, and the registration script exist;
- the built HTML references the generated manifest and registration script under the root base;
- all manifest icon files exist and the manifest scope matches the Service Worker scope;
- the Service Worker precaches `index.html` and at least one fingerprinted application asset;
- the navigation fallback and outdated precache cleanup are present;
- no non-navigation runtime cache route is generated.

Completion requires the focused RED/GREEN test cycle, `make check`, and `make build`.

## Files and Ownership

- `package.json` and `package-lock.json`: add the PWA build dependency and artifact verification command.
- `vite.config.ts`: own the generated manifest, registration, and Workbox configuration.
- `index.html`: retain browser colors, reference the dedicated Apple touch asset, and allow the plugin to inject the manifest link.
- `public/manifest.json`: remove the superseded handwritten manifest.
- `scripts/generate-pwa-icons.mjs`: derive maskable files from the existing Tango mark.
- `public/`: add generated maskable and Apple raster assets without changing the source artwork.
- `firebase.json`: define the revalidation and immutable cache policies.
- focused specs and a build verification script: enforce the source and artifact contracts.

## References

- [Issue #253](https://github.com/her0e1c1/tango/issues/253)
- [Vite PWA guide](https://vite-pwa-org.netlify.app/guide/)
- [Vite PWA minimal requirements](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements)
- [Firebase Hosting configuration](https://firebase.google.com/docs/hosting/full-config)
