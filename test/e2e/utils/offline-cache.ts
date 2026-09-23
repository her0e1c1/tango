import type { Page, Route } from "@playwright/test";

export const installApplicationCacheForOfflineReload = async (page: Page, baseURL: string | undefined) => {
  if (baseURL === undefined) throw new Error("Playwright baseURL is required for an offline reload");
  const workerUrl = new URL("/__e2e__/offline-app-cache.js", baseURL).toString();
  const viteClientSource = `
    export const createHotContext = () => ({
      accept() {}, acceptExports() {}, decline() {}, dispose() {}, invalidate() {}, off() {}, on() {}, prune() {}, send() {},
      data: {},
    });
    export const injectQuery = (url) => url;
    export const removeStyle = (id) => document.querySelector('style[data-vite-dev-id="' + id + '"]')?.remove();
    export const updateStyle = (id, content) => {
      let style = document.querySelector('style[data-vite-dev-id="' + id + '"]');
      if (style === null) {
        style = document.createElement("style");
        style.setAttribute("data-vite-dev-id", id);
        document.head.appendChild(style);
      }
      style.textContent = content;
    };
  `;
  const workerSource = `
    const cacheName = "persist-02-app";
    const viteClientSource = ${JSON.stringify(viteClientSource)};
    self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
    self.addEventListener("fetch", (event) => {
      const url = new URL(event.request.url);
      if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
      if (url.pathname === "/@vite/client") {
        event.respondWith(Promise.resolve(new Response(viteClientSource, { headers: { "content-type": "text/javascript" } })));
        return;
      }
      if (url.pathname === "/favicon.ico") {
        event.respondWith(Promise.resolve(new Response('<svg xmlns="http://www.w3.org/2000/svg"/>', {
          headers: { "content-type": "image/svg+xml" },
        })));
        return;
      }
      event.respondWith((async () => {
        const cache = await caches.open(cacheName);
        try {
          const response = await fetch(event.request);
          if (response.ok) await cache.put(event.request, response.clone());
          return response;
        } catch (error) {
          const cached = await cache.match(event.request, { ignoreVary: true });
          if (cached !== undefined) return cached;
          throw error;
        }
      })());
    });
  `;
  const serveWorker = async (route: Route) => {
    await route.fulfill({
      body: workerSource,
      contentType: "text/javascript",
      headers: { "service-worker-allowed": "/" },
    });
  };
  const context = page.context();
  await context.route(workerUrl, serveWorker);
  // A service-worker-controlled document needs explicit permission to reach the two Docker-local emulators while
  // online. The grant is restricted to the app origin and context.setOffline(true) still disconnects every request.
  await context.grantPermissions(["local-network-access"], { origin: new URL(baseURL).origin });

  // Vite has no production PWA worker. This test-only same-origin cache exists solely so an offline reload exercises
  // Firestore persistence while context.setOffline(true) still disconnects Firestore, Auth, and every other network.
  await page.evaluate(async (url) => {
    if (!window.isSecureContext)
      throw new Error("The E2E app origin must be secure enough to register a service worker");
    await navigator.serviceWorker.register(url, { scope: "/" });
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller !== null) return;
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
    });
  }, workerUrl);

  return async () => context.unroute(workerUrl, serveWorker);
};
