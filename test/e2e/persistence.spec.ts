import {
  collectBrowserErrors,
  documentId,
  expect,
  getDocument,
  listDocuments,
  requestFirestoreAsGuest,
  requireDocument,
  setDocument,
  test,
} from "./utils/fixtures";
import { createAnonymousDeck } from "./utils/ui-helpers";
import type { Page, Route } from "@playwright/test";

test("PERSISTENCE-03 reflects a remote Card edit in another open client without reload", async ({
  baseURL,
  browser,
  fixture,
  namespace,
  page,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const updatedFrontText = `${namespace.caseId} live update`;
  await fixture.seedRemote();
  await fixture.seedPage(page);

  const secondaryContext = await browser.newContext();
  const secondaryErrors = collectBrowserErrors(secondaryContext, baseURL);
  const secondaryPage = await secondaryContext.newPage();
  await fixture.seedPage(secondaryPage);

  try {
    await Promise.all([page.goto(`/deck/${deck.id}`), secondaryPage.goto(`/deck/${deck.id}`)]);
    await Promise.all([
      expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible(),
      expect(secondaryPage.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible(),
    ]);

    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill(updatedFrontText);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(secondaryPage.getByRole("button", { name: `View ${updatedFrontText}` })).toBeVisible();
    await expect(secondaryPage.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
    await expect
      .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
      .toBe(updatedFrontText);

    const matchingCards = (await listDocuments("card")).filter(
      ({ fields }) =>
        fields.uid?.stringValue === card.uid &&
        fields.deckId?.stringValue === deck.id &&
        fields.uniqueKey?.stringValue === card.uniqueKey
    );
    expect(matchingCards.map(documentId)).toEqual([card.id]);
    secondaryErrors.assert();
  } finally {
    await secondaryContext.close();
  }
});

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

test("PERSISTENCE-01 keeps remote Decks and Cards isolated by UID across reloads", async ({
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
    page.getByRole("button", { name: `Open cards in ${deckA.name}` }).click(),
    pageB.getByRole("button", { name: `Open cards in ${deckB.name}` }).click(),
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

test("PERSISTENCE-02 syncs an offline cached Card edit after reconnecting", async ({
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
  await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
  await expect(page.getByText(card.frontText)).toBeVisible();
  await page.getByRole("button", { name: "tango" }).click();
  await expect(page).toHaveURL(/\/$/);
  const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
  await page.reload();
  await expect(page.getByText(deck.name)).toBeVisible();
  await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
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
  await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
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

test("PERSISTENCE-04 keeps guest edits local and rejects every cloud write", async ({ fixture, page, namespace }) => {
  const { uid } = fixture.user();
  const updatedName = `${namespace.caseId} local deck update`;
  const updatedFrontText = `${namespace.caseId} local card update`;
  await fixture.apply(page);
  const local = await createAnonymousDeck(page);
  const { deck, first: card } = local;

  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(updatedName);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("button", { name: `Open cards in ${updatedName}` }).click();
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Front text" }).fill(updatedFrontText);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await page.reload();
  await expect(page.getByRole("button", { name: `View ${updatedFrontText}` })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open cards in ${updatedName}` })).toBeVisible();
  expect(await getDocument("deck", deck.id)).toBeUndefined();
  expect(await getDocument("card", card.id)).toBeUndefined();

  // Legacy records may already belong to an anonymous UID; ownership must not grant write access.
  const legacyDeckId = namespace.id("legacy-deck");
  const legacyCardId = namespace.id("legacy-card");
  await setDocument("deck", legacyDeckId, { uid, name: "Legacy deck" });
  await setDocument("card", legacyCardId, { uid, deckId: legacyDeckId, frontText: "Legacy card" });
  for (const collection of ["deck", "card"] as const) {
    const existingId = collection === "deck" ? legacyDeckId : legacyCardId;
    const data = { uid, deckId: legacyDeckId, name: "Denied guest write" };
    const create = await requestFirestoreAsGuest({
      uid,
      collection,
      id: namespace.id(`denied-${collection}`),
      method: "PATCH",
      document: data,
    });
    expect(create.status).toBe(403);
    const update = await requestFirestoreAsGuest({ uid, collection, id: existingId, method: "PATCH", document: data });
    expect(update.status).toBe(403);
    const remove = await requestFirestoreAsGuest({ uid, collection, id: existingId, method: "DELETE" });
    expect(remove.status).toBe(403);
  }
  expect((await requireDocument("deck", legacyDeckId)).fields.name?.stringValue).toBe("Legacy deck");
  expect((await requireDocument("card", legacyCardId)).fields.frontText?.stringValue).toBe("Legacy card");
});
