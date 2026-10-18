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
import { setCachedCardFsrs } from "./utils/corrupt-card-cache";

test("PERSISTENCE-03 reflects a remote Card edit in another open client without reload", async ({
  baseURL,
  browser,
  fixture,
  namespace,
  page,
}) => {
  // Given: Prepare `deck`, `card`, `updatedFrontText` and any shared test state below.
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
    // Given: Use the current iteration or branch inputs from the enclosing case.
    await Promise.all([page.goto(`/deck/${deck.id}`), secondaryPage.goto(`/deck/${deck.id}`)]);
    await Promise.all([
      expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible(),
      expect(secondaryPage.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible(),
    ]);

    // When: Apply the operation or event under test.
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill(updatedFrontText);
    await page.getByRole("button", { name: "Save changes" }).click();

    // Then: Verify the expected result in the assertions below.
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
    // When: Exercise `secondaryErrors.assert` with the prepared inputs.
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
  // Given: Prepare `deckA`, `deckB`, `cardA` and any shared test state below.
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

  // When: Exercise `page.reload` with the prepared inputs.
  await Promise.all([page.reload(), pageB.reload()]);
  // Then: Verify the expected result in the assertions below.
  await Promise.all([
    expect(page.getByText(deckA.name)).toBeVisible(),
    expect(pageB.getByText(deckB.name)).toBeVisible(),
  ]);
  await expect(page.getByText(deckB.name)).toHaveCount(0);
  await expect(pageB.getByText(deckA.name)).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: `Open cards in ${deckA.name}` }).click` with the prepared inputs.
  await Promise.all([
    page.getByRole("button", { name: `Open cards in ${deckA.name}` }).click(),
    pageB.getByRole("button", { name: `Open cards in ${deckB.name}` }).click(),
  ]);

  // Then: Verify the expected result in the assertions below.
  await Promise.all([
    expect(page.getByText(cardA.frontText)).toBeVisible(),
    expect(pageB.getByText(cardB.frontText)).toBeVisible(),
  ]);
  await expect(page.getByText(cardB.frontText)).toHaveCount(0);
  await expect(pageB.getByText(cardA.frontText)).toHaveCount(0);
  // When: Exercise `errorsB.assert` with the prepared inputs.
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
  // Given: Prepare `deck`, `card` and any shared test state below.
  const deck = fixture.deck();
  const card = fixture.card();
  const { uid } = fixture.user();
  await fixture.apply(page);

  await page.goto("/");
  await expect(page.getByText(deck.name)).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: `Open cards in ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(card.frontText)).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "tango" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "tango" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  // When: Exercise `installApplicationCacheForOfflineReload` with the prepared inputs.
  const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(deck.name)).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: `Open cards in ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(card.frontText)).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "tango" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "tango" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  // When: Exercise `stopServingWorker` with the prepared inputs.
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
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(deck.name)).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: `Open cards in ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(card.frontText)).toBeVisible();

  // When: Apply the operation or event under test.
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.locator('textarea[name="frontText"]').fill("updated offline front");
  await page.getByRole("button", { name: "Save changes" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
    .toBe(card.frontText);

  // When: Exercise `browser.newContext` with the prepared inputs.
  const verificationContext = await browser.newContext();
  const verificationErrors = collectBrowserErrors(verificationContext, baseURL);
  const verificationPage = await verificationContext.newPage();
  await fixture.seedPage(verificationPage);
  await verificationPage.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  await expect(verificationPage.getByText(card.frontText)).toBeVisible();

  // When: Exercise `context.setOffline` with the prepared inputs.
  await context.setOffline(false);
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByText("updated offline front", { exact: true })).toBeVisible();
  // When: Exercise `verificationPage.reload` with the prepared inputs.
  await verificationPage.reload();
  // Then: Verify the expected result in the assertions below.
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
  // When: Exercise `verificationErrors.assert` with the prepared inputs.
  verificationErrors.assert();
  await verificationContext.close();
});

test("PERSISTENCE-04 keeps guest edits local and rejects every cloud write", async ({ fixture, page, namespace }) => {
  // Given: Prepare `updatedName`, `updatedFrontText`, `local` and any shared test state below.
  const { uid } = fixture.user();
  const updatedName = `${namespace.caseId} local deck update`;
  const updatedFrontText = `${namespace.caseId} local card update`;
  await fixture.apply(page);
  const local = await createAnonymousDeck(page);
  const { deck, first: card } = local;

  await page.goto("/");
  // When: Exercise `page.getByRole("button", { name: `Open actions for ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(updatedName);
  await page.getByRole("button", { name: "Save changes" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);

  // When: Exercise `page.getByRole("button", { name: `Open cards in ${updatedName}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open cards in ${updatedName}` }).click();
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Front text" }).fill(updatedFrontText);
  await page.getByRole("button", { name: "Save changes" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: `View ${updatedFrontText}` })).toBeVisible();
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: `Open cards in ${updatedName}` })).toBeVisible();
  expect(await getDocument("deck", deck.id)).toBeUndefined();
  expect(await getDocument("card", card.id)).toBeUndefined();

  // Legacy records may already belong to an anonymous UID; ownership must not grant write access.
  // When: Exercise `namespace.id` with the prepared inputs.
  const legacyDeckId = namespace.id("legacy-deck");
  const legacyCardId = namespace.id("legacy-card");
  await setDocument("deck", legacyDeckId, { uid, name: "Legacy deck" });
  await setDocument("card", legacyCardId, { uid, deckId: legacyDeckId, frontText: "Legacy card" });
  for (const collection of ["deck", "card"] as const) {
    // Given: Prepare `existingId`, `data` and any shared test state below.
    // When: Apply the operation or event under test.
    const existingId = collection === "deck" ? legacyDeckId : legacyCardId;
    const data = { uid, deckId: legacyDeckId, name: "Denied guest write" };
    const create = await requestFirestoreAsGuest({
      uid,
      collection,
      id: namespace.id(`denied-${collection}`),
      method: "PATCH",
      document: data,
    });
    // Then: Verify the expected result in the assertions below.
    expect(create.status).toBe(403);
    // When: Exercise `requestFirestoreAsGuest` with the prepared inputs.
    const update = await requestFirestoreAsGuest({ uid, collection, id: existingId, method: "PATCH", document: data });
    // Then: Verify the expected result in the assertions below.
    expect(update.status).toBe(403);
    // When: Exercise `requestFirestoreAsGuest` with the prepared inputs.
    const remove = await requestFirestoreAsGuest({ uid, collection, id: existingId, method: "DELETE" });
    // Then: Verify the expected result in the assertions below.
    expect(remove.status).toBe(403);
  }
  expect((await requireDocument("deck", legacyDeckId)).fields.name?.stringValue).toBe("Legacy deck");
  expect((await requireDocument("card", legacyCardId)).fields.frontText?.stringValue).toBe("Legacy card");
});

async function openStorageMaintenance(page: import("@playwright/test").Page) {
  // Unload the SDK before evicting its cache, leaving the signed-in account intact.
  await page.route("**/storage-maintenance", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html><body>Storage maintenance</body></html>" })
  );
  await page.goto("/storage-maintenance");
  await page.evaluate(async () => {
    for (const { name } of await indexedDB.databases()) {
      if (!(name?.startsWith("firestore/") || name === "tango-card-replica")) continue;
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("Firestore cache is still open"));
      });
    }
  });
}

test("PERSISTENCE-07 reloads server data after the SDK cache and Card replica are evicted", async ({
  fixture,
  page,
}) => {
  // Given: Prepare `deck` and any shared test state below.
  const deck = fixture.deck();
  await fixture.apply(page);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  for (const card of fixture.state.remote.cards)
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  // When: Exercise `openStorageMaintenance` with the prepared inputs.
  await openStorageMaintenance(page);
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  for (const card of fixture.state.remote.cards)
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
});

test("PERSISTENCE-08 restores study progress from the SDK cache offline", async ({ fixture, page, browserErrors }) => {
  // Given: Prepare `deck`, `session`, `currentCard` and any shared test state below.
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-2");
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  browserErrors.allow(/console error: .*Could not reach Cloud Firestore backend/u);
  browserErrors.allow(
    /console error: Failed to load resource: .*ERR_INTERNET_DISCONNECTED.*\[http:\/\/(?:db|127\.0\.0\.1|localhost):[0-9]+\//iu
  );
  await page.route("http://db:*/**", (route) => route.abort("internetdisconnected"));
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(session.currentIndex));
});

test("PERSISTENCE-09 receives remote edits and tombstones after reopening", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `edited`, `deleted` and any shared test state below.
  const deck = fixture.deck();
  const edited = fixture.card("card-1");
  const deleted = fixture.card("card-2");
  const unchanged = fixture.card("card-3");
  await fixture.apply(page);
  await page.route("**/storage-maintenance", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html><body>Closed</body></html>" })
  );
  await page.goto(`/deck/${deck.id}`);
  for (const card of fixture.state.remote.cards) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // Given: Confirm that each remote Card has been loaded into this browser.
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  }
  // When: Reopen the Deck after leaving the application.
  await page.goto("/storage-maintenance");
  await page.goto(`/deck/${deck.id}`);
  // Then: Restore every saved Card.
  for (const card of fixture.state.remote.cards)
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();

  await page.goto("/storage-maintenance");
  // When: Edit one Card and tombstone another remotely while the application is closed.
  await setDocument("card", edited.id, { ...edited, frontText: "Changed while closed", updatedAt: new Date() });
  await setDocument("card", deleted.id, { ...deleted, deletedAt: Date.now(), updatedAt: new Date() });
  await page.goto(`/deck/${deck.id}`);
  // Then: Show the remote edit, hide the tombstone, and retain the untouched Card.
  await expect(page.getByRole("button", { name: "View Changed while closed" })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${deleted.frontText}` })).toHaveCount(0);
  await expect(page.getByRole("button", { name: `View ${unchanged.frontText}` })).toBeVisible();

  await page.goto("/storage-maintenance");
  // When: Tombstone the Deck remotely and reopen the home page.
  await setDocument("deck", deck.id, { ...deck, deletedAt: Date.now(), updatedAt: new Date() });
  await page.goto("/");
  // Then: Hide the deleted Deck and its navigation entry.
  await expect(page.getByRole("heading", { name: "No decks yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "No decks yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
  expect((await requireDocument("deck", deck.id)).fields.deletedAt?.integerValue).toBeDefined();
  expect((await requireDocument("card", deleted.id)).fields.deletedAt?.integerValue).toBeDefined();
});

for (const allInvalid of [false, true]) {
  test(`PERSISTENCE-10 starts after reopening ${allInvalid ? "all" : "one"} malformed local Cards`, async ({
    fixture,
    page,
  }, testInfo) => {
    // Given: Use this case's inputs and any shared test setup.
    await fixture.seedPage(page);
    const { deck, first, second } = await createAnonymousDeck(page);
    await page.goto(`/deck/${deck.id}`);
    await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `View ${second.frontText}` })).toBeVisible();
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `View ${second.frontText}` })).toBeVisible();

    // When: Exercise `setCachedCardFsrs` with the prepared inputs.
    await setCachedCardFsrs(page, second.id);
    if (allInvalid) await setCachedCardFsrs(page, first.id);
    await page.goto("/");
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
    const warning = `Some saved cards could not be loaded (${allInvalid ? 2 : 1}). Their saved data is unchanged. Other saved data is still available.`;
    await expect(page.getByText(warning)).toBeVisible();
    // When: Exercise `page.getByRole("button", { name: `Open cards in ${deck.name}` }).click` with the prepared inputs.
    await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toHaveCount(allInvalid ? 0 : 1);
    await expect(page.getByRole("button", { name: `View ${second.frontText}` })).toHaveCount(0);
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toHaveCount(allInvalid ? 0 : 1);
    await expect(page.getByRole("button", { name: `View ${second.frontText}` })).toHaveCount(0);
    await expect(page.getByText(warning)).toBeVisible();
    // When: Exercise `page.getByText(warning).boundingBox` with the prepared inputs.
    const warningBounds = await page.getByText(warning).boundingBox();
    const headerBounds = await page
      .locator("header")
      .filter({ has: page.getByRole("button", { name: "tango", exact: true }) })
      .boundingBox();
    // Then: Verify the expected result in the assertions below.
    expect(warningBounds).not.toBeNull();
    expect(headerBounds).not.toBeNull();
    expect(warningBounds!.y).toBeGreaterThanOrEqual(headerBounds!.y + headerBounds!.height);
    // When: Exercise `testInfo.attach` with the prepared inputs.
    await testInfo.attach("partial-startup-after-reload", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    await setCachedCardFsrs(page, second.id, null);
    await page.goto(`/deck/${deck.id}`);
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: `View ${second.frontText}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toHaveCount(allInvalid ? 0 : 1);
    await expect(page.getByText(warning)).toHaveCount(0);
    if (allInvalid) {
      await expect(
        page.getByText(
          "Some saved cards could not be loaded (1). Their saved data is unchanged. Other saved data is still available."
        )
      ).toBeVisible();
    }
  });
}

test("PERSISTENCE-10 keeps healthy study controls inside the mobile viewport with an invalid Card", async ({
  fixture,
  page,
}, testInfo) => {
  // Given: Prepare `viewport` and any shared test state below.
  const viewport = { width: 390, height: 844 };
  await fixture.seedPage(page);
  const { deck, first, second } = await createAnonymousDeck(page);
  await setCachedCardFsrs(page, second.id);
  await page.goto(`/deck/${deck.id}/start`);
  // When: Exercise `page.getByRole("button", { name: "Start 1 card", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Start 1 card", exact: true }).click();
  await page.setViewportSize(viewport);
  // Then: Verify the expected result in the assertions below.
  await expect(page.locator("#frontText")).toHaveText(first.frontText);
  const warning = page.getByText(
    "Some saved cards could not be loaded (1). Their saved data is unchanged. Other saved data is still available."
  );
  // When: Exercise `page.locator` with the prepared inputs.
  const controls = [
    { name: "warning", locator: warning },
    { name: "front", locator: page.locator("#frontText") },
    ...["Swipe left: Again", "Swipe down: Hard", "Swipe right: Good", "Swipe up: Easy", "Play"].map((name) => ({
      name,
      locator: page.getByRole("button", { name, exact: true }),
    })),
    { name: "Study progress", locator: page.getByRole("slider", { name: "Study progress" }) },
  ];
  const geometry = [];
  for (const control of controls) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // Then: Verify the expected result in the assertions below.
    await expect(control.locator).toBeVisible();
    // When: Exercise `control.locator.boundingBox` with the prepared inputs.
    const bounds = await control.locator.boundingBox();
    if (bounds === null) throw new Error(`${control.name} has no visible bounds`);
    geometry.push({ name: control.name, ...bounds });
  }
  await testInfo.attach("mobile-study-geometry", {
    body: Buffer.from(JSON.stringify({ viewport, geometry })),
    contentType: "application/json",
  });
  for (const bounds of geometry) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // Then: Verify the expected result in the assertions below.
    expect(bounds.x, bounds.name).toBeGreaterThanOrEqual(0);
    expect(bounds.y, bounds.name).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width, bounds.name).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height, bounds.name).toBeLessThanOrEqual(viewport.height);
  }
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  // When: Exercise `testInfo.attach` with the prepared inputs.
  await testInfo.attach("mobile-study-before-interaction", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "Pause", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const completion = page.getByRole("region", { name: "Study complete", exact: true });
  // Then: Verify the expected result in the assertions below.
  await expect(completion).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: "Swipe right: Good", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Swipe right: Good", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(completion).toBeVisible();
  await expect(completion.getByText("Session: 1 card", { exact: true })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Study progress" })).toHaveCount(0);
});

test("PERSISTENCE-10 retains the recovery warning on quarantined Card view and edit links", async ({
  fixture,
  page,
}, testInfo) => {
  // Given: Prepare `warning` and any shared test state below.
  await fixture.seedPage(page);
  const { deck, first, second } = await createAnonymousDeck(page);
  await setCachedCardFsrs(page, second.id);
  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toBeVisible();
  const warning = page.getByText(
    "Some saved cards could not be loaded (1). Their saved data is unchanged. Other saved data is still available."
  );
  for (const suffix of ["", "/edit"]) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    await page.goto(`/card/${second.id}${suffix}`);
    await expect(page.getByRole("heading", { name: "Card not found", exact: true })).toBeVisible();
    await expect(warning).toBeVisible();
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("heading", { name: "Card not found", exact: true })).toBeVisible();
    await expect(warning).toBeVisible();
    // When: Exercise `testInfo.attach` with the prepared inputs.
    await testInfo.attach(suffix === "" ? "quarantined-card-view" : "quarantined-card-edit", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await page.getByRole("button", { name: "Go home", exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
    await expect(warning).toBeVisible();
  }
});

test("PERSISTENCE-10 retains the warning on a Deck view with all Cards quarantined", async ({
  fixture,
  page,
}, testInfo) => {
  // Given: Prepare `firstById`, `warning` and any shared test state below.
  await fixture.seedPage(page);
  const { deck, first, second } = await createAnonymousDeck(page);
  const firstById = [first, second].toSorted((left, right) => left.id.localeCompare(right.id))[0]!;
  await page.goto(`/deck/${deck.id}/view`);
  await expect(page.getByRole("button", { name: "Card front", exact: true })).toHaveText(firstById.frontText);
  await expect(page.getByText(/Some saved cards could not be loaded/)).toHaveCount(0);

  await setCachedCardFsrs(page, first.id);
  await setCachedCardFsrs(page, second.id);
  await page.goto(`/deck/${deck.id}/view`);
  const warning = page.getByText(
    "Some saved cards could not be loaded (2). Their saved data is unchanged. Other saved data is still available."
  );
  await expect(page.getByRole("heading", { name: "No cards yet", exact: true })).toBeVisible();
  await expect(warning).toBeVisible();
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "No cards yet", exact: true })).toBeVisible();
  await expect(warning).toBeVisible();
  await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
  // When: Exercise `testInfo.attach` with the prepared inputs.
  await testInfo.attach("all-quarantined-deck-view", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  await expect(warning).toBeVisible();
});
