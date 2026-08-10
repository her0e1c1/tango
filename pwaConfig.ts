import type { VitePWAOptions } from "vite-plugin-pwa";

export const pwaOptions = {
  injectRegister: "script-defer",
  manifestFilename: "manifest.json",
  includeAssets: ["favicon.ico", "apple-touch-icon.png"],
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
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    navigateFallback: "index.html",
    navigateFallbackDenylist: [/^\/__\//],
  },
} satisfies Partial<VitePWAOptions>;
