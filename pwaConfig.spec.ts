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
        navigateFallbackDenylist: [/^\/__\//],
      },
    });
    expect(pwaOptions.manifest).not.toHaveProperty("orientation");
    expect(pwaOptions.workbox).not.toHaveProperty("runtimeCaching");
  });

  it("uses separate regular and maskable Tango icons", () => {
    expect(pwaOptions.manifest.icons).toEqual([
      { src: "tango-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "logo192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "logo512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "logo192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "logo512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ]);
  });
});
