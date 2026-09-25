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
import { installApplicationCacheForOfflineReload } from "./utils/offline-cache";

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

async function waitForSavedDocument(page: import("@playwright/test").Page, collection: string, id: string) {
  let scope: string | undefined;
  await expect
    .poll(async () => {
      scope = await page.evaluate(
        async ({ collection: savedCollection, id: savedId }) => {
          const database = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open("tango-firestore-sync");
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          try {
            return await new Promise<string | undefined>((resolve, reject) => {
              const transaction = database.transaction("state", "readonly");
              const store = transaction.objectStore("state");
              const keys = store.getAllKeys();
              const values = store.getAll();
              transaction.oncomplete = () =>
                resolve(
                  keys.result
                    .map(String)
                    .find(
                      (key, index) =>
                        JSON.parse(key)[2] === savedCollection &&
                        Object.hasOwn(JSON.parse(String(values.result[index])).documents, savedId)
                    )
                );
              transaction.onerror = () => reject(transaction.error);
            });
          } finally {
            database.close();
          }
        },
        { collection, id }
      );
      return scope;
    })
    .toBeTruthy();
  if (!scope) throw new Error("Missing saved scope");
  return scope;
}

async function openStorageMaintenance(page: import("@playwright/test").Page) {
  // Unload the SDK before clearing its disposable cache, leaving Auth and the application replica intact.
  await page.route("**/storage-maintenance", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html><body>Storage maintenance</body></html>" })
  );
  await page.goto("/storage-maintenance");
  await page.evaluate(async () => {
    for (const { name } of await indexedDB.databases()) {
      if (!name?.startsWith("firestore/")) continue;
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("Firestore cache is still open"));
      });
    }
  });
}

for (const corruption of ["missing", "missing-documents", "invalid-json", "invalid-card"] as const) {
  test(`PERSISTENCE-07 rebuilds ${corruption} saved data after cache eviction`, async ({ fixture, page }) => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}`);
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
    const scope = await waitForSavedDocument(page, "card", card.id);
    await openStorageMaintenance(page);
    await page.evaluate(
      async ({ corruption: damage, cardId, scope: savedScope }) => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("tango-firestore-sync");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction("state", "readwrite");
            const store = transaction.objectStore("state");
            const request = store.get(savedScope);
            request.onsuccess = () => {
              switch (damage) {
                case "missing":
                  store.delete(savedScope);
                  return;
                case "invalid-json":
                  store.put("{broken", savedScope);
                  return;
              }
              const checkpoint = JSON.parse(String(request.result)) as {
                documents?: Record<string, { frontText: unknown }> | undefined;
              };
              switch (damage) {
                case "missing-documents":
                  checkpoint.documents = undefined;
                  break;
                case "invalid-card":
                  if (!checkpoint.documents) throw new Error("Missing saved documents");
                  checkpoint.documents[cardId] = { ...checkpoint.documents[cardId], frontText: 42 };
                  break;
              }
              store.put(JSON.stringify(checkpoint), savedScope);
            };
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
          });
        } finally {
          database.close();
        }
      },
      { corruption, cardId: card.id, scope }
    );
    await page.goto(`/deck/${deck.id}`);
    for (const existing of fixture.state.remote.cards)
      await expect(page.getByRole("button", { name: `View ${existing.frontText}` })).toBeVisible();
  });
}

test("PERSISTENCE-08 recovers a failed replica transaction without losing unchanged Cards", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  await waitForSavedDocument(page, "card", card.id);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      if (this.transaction.db.name === "tango-firestore-sync") this.transaction.abort();
      return request;
    };
  });
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Front text" }).fill("Saved despite replica failure");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("button", { name: "View Saved despite replica failure" })).toBeVisible();
  await expect(
    page.getByText("A data save or sync failed. Check your connection and reload to review the saved data.", {
      exact: true,
    })
  ).toBeVisible();
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
    .toBe("Saved despite replica failure");
  await openStorageMaintenance(page);
  await page.goto(`/deck/${deck.id}`);
  for (const existing of fixture.state.remote.cards) {
    const text = existing.id === card.id ? "Saved despite replica failure" : existing.frontText;
    await expect(page.getByRole("button", { name: `View ${text}` })).toBeVisible();
  }
});

test("PERSISTENCE-09 restores saved study progress without the SDK cache or server", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-2");
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await waitForSavedDocument(page, "studySession", session.sessionId);
  await waitForSavedDocument(page, "card", currentCard.id);
  await waitForSavedDocument(page, "deck", deck.id);
  await openStorageMaintenance(page);
  browserErrors.allow(/console error: .*Could not reach Cloud Firestore backend/u);
  browserErrors.allow(
    /console error: Failed to load resource: .*ERR_INTERNET_DISCONNECTED.*\[http:\/\/(?:db|127\.0\.0\.1|localhost):[0-9]+\//iu
  );
  await page.route("http://db:*/**", (route) => route.abort("internetdisconnected"));
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(session.currentIndex));
});

test("PERSISTENCE-10 restores a healthy replica despite invalid cached changes and receives repairs", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  await waitForSavedDocument(page, "card", card.id);
  await waitForSavedDocument(page, "deck", deck.id);
  const failure = page.getByText(
    "A data save or sync failed. Check your connection and reload to review the saved data.",
    { exact: true }
  );
  await setDocument("card", card.id, { ...card, frontText: 42, updatedAt: new Date() });
  await expect(failure).toBeVisible();
  browserErrors.allow(/console error: .*Could not reach Cloud Firestore backend/u);
  browserErrors.allow(
    /console error: Failed to load resource: .*ERR_INTERNET_DISCONNECTED.*\[http:\/\/(?:db|127\.0\.0\.1|localhost):[0-9]+\//iu
  );
  await page.route("http://db:*/**", (route) => route.abort("internetdisconnected"));
  await page.reload();
  await expect(failure).toBeVisible();
  for (const existing of fixture.state.remote.cards)
    await expect(page.getByRole("button", { name: `View ${existing.frontText}` })).toBeVisible();
  await setDocument("card", card.id, { ...card, frontText: "Repaired Card", updatedAt: new Date() });
  await page.unroute("http://db:*/**");
  await page.reload();
  await expect(page.getByRole("button", { name: "View Repaired Card" })).toBeVisible();
  for (const existing of fixture.state.remote.cards.filter(({ id }) => id !== card.id))
    await expect(page.getByRole("button", { name: `View ${existing.frontText}` })).toBeVisible();
});

test("PERSISTENCE-11 merges remote edits and tombstones into saved data after reopening", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const edited = fixture.card("card-1");
  const deleted = fixture.card("card-2");
  const unchanged = fixture.card("card-3");
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  for (const card of fixture.state.remote.cards) {
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
    await waitForSavedDocument(page, "card", card.id);
  }
  await waitForSavedDocument(page, "deck", deck.id);
  await openStorageMaintenance(page);
  await page.goto(`/deck/${deck.id}`);
  for (const card of fixture.state.remote.cards)
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();

  await openStorageMaintenance(page);
  await setDocument("card", edited.id, { ...edited, frontText: "Changed while closed", updatedAt: new Date() });
  await setDocument("card", deleted.id, { ...deleted, deletedAt: Date.now(), updatedAt: new Date() });
  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: "View Changed while closed" })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${deleted.frontText}` })).toHaveCount(0);
  await expect(page.getByRole("button", { name: `View ${unchanged.frontText}` })).toBeVisible();

  await openStorageMaintenance(page);
  await setDocument("deck", deck.id, { ...deck, deletedAt: Date.now(), updatedAt: new Date() });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "No decks yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "No decks yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
  expect((await requireDocument("deck", deck.id)).fields.deletedAt?.integerValue).toBeDefined();
  expect((await requireDocument("card", deleted.id)).fields.deletedAt?.integerValue).toBeDefined();
});
