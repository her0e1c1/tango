import type { VitePWAOptions } from "vite-plugin-pwa";

// PWA (Progressive Web App) settings passed to VitePWA in vite.config.ts.
// The web app manifest describes the installed app; Workbox builds the service
// worker, a browser-managed script that can cache files and handle requests.
export const pwaOptions = {
  injectRegister: "script",

  // Output filename for the web app manifest, which browsers read for installation.
  // This is separate from Workbox's precache manifest (the list of files to cache).
  manifestFilename: "manifest.json",

  // Precache these extra files from public/ even though globPatterns omits images.
  // Files referenced by manifest.icons are included automatically through the
  // plugin's default includeManifestIcons behavior, so they need not be repeated.
  includeAssets: ["favicon.ico", "apple-touch-icon.png"],

  // Installation metadata, not React page content or service-worker cache rules.
  manifest: {
    // Stable app identity within this origin; keep it when names or launch URLs change.
    id: "/",

    // Same-origin paths under / belong to the installed app's navigation scope.
    // This is not the service worker's scope or a network-access restriction.
    scope: "/",

    // Initial URL when opening the installed app, rather than its identity.
    start_url: "/",

    // Full title for installation surfaces.
    name: "Tango Is Flashcards For Programmers",
    // Compact label for space-limited surfaces such as home-screen launchers.
    short_name: "Tango",
    // Human-readable summary for browsers that display app descriptions.
    description: "Flashcards For Programmers",

    // Request an app-like window without normal browser tabs/address bars.
    // This is not fullscreen mode; the browser decides what it supports.
    display: "standalone",

    // Suggested browser/OS chrome color, not the page's CSS background.
    theme_color: "#f7f8fa",
    // Placeholder background while the app loads, including supported splash screens.
    background_color: "#f7f8fa",

    // src is relative to manifest.json; these files originate in public/.
    // sizes describes pixel dimensions ("any" means scalable); type is the MIME type.
    icons: [
      // General-purpose scalable artwork; purpose "any" does not promise safe cropping.
      { src: "tango-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      // Raster alternatives for surfaces that request 192px or 512px icons.
      { src: "logo192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "logo512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Maskable artwork reserves a safe area so launchers can crop its outer edges.
      { src: "logo192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "logo512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },

  // Precache means downloading selected files when the service worker installs.
  // These rules cover static app files, not Firestore data or authentication state.
  workbox: {
    // Match built JS, CSS, and HTML recursively inside Vite's build output (build/).
    // Other file types need separate inclusion, such as includeAssets or manifest icons.
    globPatterns: ["**/*.{js,css,html}"],

    // Remove precaches left by incompatible older Workbox versions on activation.
    // This is not a full site-data reset and does not clear every browser cache.
    cleanupOutdatedCaches: true,

    // Permit up to 3 MiB (3,145,728 bytes) per matched file, not for the whole cache.
    // Oversized files are excluded; vite-plugin-pwa reports this as a build error.
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

    // Serve precached index.html for eligible page navigations so React Router can
    // resolve deep links. This applies online too, not just after a network failure.
    // index.html must remain precached; API requests are not page navigations.
    navigateFallback: "index.html",

    // Paths beginning /__/ belong to Firebase Hosting, including authentication
    // helpers. Leave those navigations to Firebase rather than returning the SPA.
    // This excludes them from the navigation fallback; it is not an access block.
    navigateFallbackDenylist: [/^\/__\//],
  },
  // Check option names/types without changing the inferred type or runtime values.
  // Partial allows omitted options to retain the plugin's defaults.
} satisfies Partial<VitePWAOptions>;
