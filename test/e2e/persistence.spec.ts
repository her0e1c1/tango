import type { Page, Route } from "@playwright/test";
import { collectBrowserErrors, documentId, expect, listDocuments, requireDocument, test } from "./fixtures";

const installApplicationCacheForOfflineReload = async (page: Page, baseURL: string | undefined) => {
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

test("PERSIST-01 keeps remote Decks and Cards isolated by UID across reloads", async ({
  baseURL,
  browser,
  fixture,
  page,
}) => {
  const deckA = fixture.deck("deck-a");
  const deckB = fixture.deck("deck-b");
  const cardA = fixture.card("card-a");
  const cardB = fixture.card("card-b");
  await fixture.seedRemote();
  await fixture.seedPage(page, { user: "user-a" });

  const contextB = await browser.newContext();
  const errorsB = collectBrowserErrors(contextB, baseURL);
  const pageB = await contextB.newPage();
  await fixture.seedPage(pageB, { user: "user-b" });

  await Promise.all([page.goto("/"), pageB.goto("/")]);
  await Promise.all([
    expect(page.getByText(deckA.name)).toBeVisible(),
    expect(pageB.getByText(deckB.name)).toBeVisible(),
  ]);
  await expect(page.getByText(deckB.name)).toHaveCount(0);
  await expect(pageB.getByText(deckA.name)).toHaveCount(0);

  await Promise.all([page.reload(), pageB.reload()]);
  await Promise.all([
    expect(page.getByText(deckA.name)).toBeVisible(),
    expect(pageB.getByText(deckB.name)).toBeVisible(),
  ]);
  await expect(page.getByText(deckB.name)).toHaveCount(0);
  await expect(pageB.getByText(deckA.name)).toHaveCount(0);
  await Promise.all([
    page.getByRole("button", { name: `View ${deckA.name}` }).click(),
    pageB.getByRole("button", { name: `View ${deckB.name}` }).click(),
  ]);

  await Promise.all([
    expect(page.getByText(cardA.frontText)).toBeVisible(),
    expect(pageB.getByText(cardB.frontText)).toBeVisible(),
  ]);
  await expect(page.getByText(cardB.frontText)).toHaveCount(0);
  await expect(pageB.getByText(cardA.frontText)).toHaveCount(0);
  errorsB.assert();
  await contextB.close();
});

test("PERSIST-02 syncs an offline cached Card edit after reconnecting", async ({
  baseURL,
  browser,
  browserErrors,
  context,
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const { uid } = fixture.user();
  await fixture.apply(page);

  await page.goto("/");
  await expect(page.getByText(deck.name)).toBeVisible();
  await page.getByRole("button", { name: `View ${deck.name}` }).click();
  await expect(page.getByText(card.frontText)).toBeVisible();
  await page.getByRole("button", { name: "tango" }).click();
  await expect(page).toHaveURL(/\/$/);
  const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
  await page.reload();
  await expect(page.getByText(deck.name)).toBeVisible();
  await page.getByRole("button", { name: `View ${deck.name}` }).click();
  await expect(page.getByText(card.frontText)).toBeVisible();
  await page.getByRole("button", { name: "tango" }).click();
  await expect(page).toHaveURL(/\/$/);
  await stopServingWorker();

  browserErrors.allow(/console error: .*Could not reach Cloud Firestore backend/u);
  browserErrors.allow(
    /console error: Failed to load resource: .*ERR_INTERNET_DISCONNECTED.*\[http:\/\/(?:db|127\.0\.0\.1|localhost):[0-9]+\//iu
  );
  browserErrors.allow(
    /console error: Failed to load resource: net::ERR_INTERNET_DISCONNECTED \[https:\/\/www\.google\.com\/images\/cleardot\.gif\?/iu
  );
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(deck.name)).toBeVisible();
  await page.getByRole("button", { name: `View ${deck.name}` }).click();
  await expect(page.getByText(card.frontText)).toBeVisible();

  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.locator('textarea[name="frontText"]').fill("updated offline front");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
    .toBe(card.frontText);

  const verificationContext = await browser.newContext();
  const verificationErrors = collectBrowserErrors(verificationContext, baseURL);
  const verificationPage = await verificationContext.newPage();
  await fixture.seedPage(verificationPage);
  await verificationPage.goto(`/deck/${deck.id}`);
  await expect(verificationPage.getByText(card.frontText)).toBeVisible();

  await context.setOffline(false);
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByText("updated offline front", { exact: true })).toBeVisible();
  await verificationPage.reload();
  await expect(verificationPage.getByText("updated offline front", { exact: true })).toBeVisible();
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
    .toBe("updated offline front");

  const deckIds = (await listDocuments("deck"))
    .filter((document) => document.fields.uid?.stringValue === uid && document.fields.name?.stringValue === deck.name)
    .map(documentId);
  const cardIds = (await listDocuments("card"))
    .filter(
      (document) =>
        document.fields.uid?.stringValue === uid &&
        document.fields.deckId?.stringValue === deck.id &&
        document.fields.uniqueKey?.stringValue === card.uniqueKey
    )
    .map(documentId);
  expect(deckIds).toEqual([deck.id]);
  expect(cardIds).toEqual([card.id]);
  verificationErrors.assert();
  await verificationContext.close();
});
