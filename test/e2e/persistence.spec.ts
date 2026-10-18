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
  const { deck, card, updatedFrontText, secondaryContext, secondaryErrors, secondaryPage } =
    await test.step("Given: Two isolated browser clients seeded with the same remote card", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      const updatedFrontText = `${namespace.caseId} live update`;
      await fixture.seedRemote();
      await fixture.seedPage(page);

      const secondaryContext = await browser.newContext();
      const secondaryErrors = collectBrowserErrors(secondaryContext, baseURL);
      const secondaryPage = await secondaryContext.newPage();
      await fixture.seedPage(secondaryPage);
      return { deck, card, updatedFrontText, secondaryContext, secondaryErrors, secondaryPage };
    });

  try {
    await test.step("Given: Both clients display the original card", async () => {
      await Promise.all([page.goto(`/deck/${deck.id}`), secondaryPage.goto(`/deck/${deck.id}`)]);
      await Promise.all([
        expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible(),
        expect(secondaryPage.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible(),
      ]);
    });
    await test.step("When: Edit and save the card in the first client", async () => {
      await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      await page.getByRole("textbox", { name: "Front text" }).fill(updatedFrontText);
      await page.getByRole("button", { name: "Save changes" }).click();
    });
    await test.step("Then: The second client receives the same card edit without reload or duplication", async () => {
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
    });
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
  const { deckA, deckB, cardA, cardB, contextB, errorsB, pageB } =
    await test.step("Given: Two accounts see only their own decks before reload", async () => {
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
      return { deckA, deckB, cardA, cardB, contextB, errorsB, pageB };
    });
  await test.step("When: Reload both account clients", async () => {
    await Promise.all([page.reload(), pageB.reload()]);
  });
  await test.step("Then: Each client still sees only its own deck", async () => {
    await Promise.all([
      expect(page.getByText(deckA.name)).toBeVisible(),
      expect(pageB.getByText(deckB.name)).toBeVisible(),
    ]);
    await expect(page.getByText(deckB.name)).toHaveCount(0);
    await expect(pageB.getByText(deckA.name)).toHaveCount(0);
  });
  await test.step("When: Open each account deck card list", async () => {
    await Promise.all([
      page.getByRole("button", { name: `Open cards in ${deckA.name}` }).click(),
      pageB.getByRole("button", { name: `Open cards in ${deckB.name}` }).click(),
    ]);
  });
  await test.step("Then: Each client sees only its own cards without browser errors", async () => {
    await Promise.all([
      expect(page.getByText(cardA.frontText)).toBeVisible(),
      expect(pageB.getByText(cardB.frontText)).toBeVisible(),
    ]);
    await expect(page.getByText(cardB.frontText)).toHaveCount(0);
    await expect(pageB.getByText(cardA.frontText)).toHaveCount(0);
    errorsB.assert();
    await contextB.close();
  });
});

test("PERSISTENCE-02 syncs an offline cached Card edit after reconnecting", async ({
  baseURL,
  browser,
  browserErrors,
  context,
  fixture,
  page,
}) => {
  const { deck, card, uid } =
    await test.step("Given: A remote deck with its cards and cached application shell", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      const { uid } = fixture.user();
      await fixture.apply(page);

      await page.goto("/");
      await expect(page.getByText(deck.name)).toBeVisible();
      return { deck, card, uid };
    });
  await test.step("When: Open the remote deck card list", async () => {
    await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
  });
  await test.step("Then: The saved card is loaded", async () => {
    await expect(page.getByText(card.frontText)).toBeVisible();
  });
  await test.step("When: Return to the deck list", async () => {
    await page.getByRole("button", { name: "tango" }).click();
  });
  await test.step("Then: The deck list opens", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  const { stopServingWorker } = await test.step("When: Install the offline app cache and reload", async () => {
    const stopServingWorker = await installApplicationCacheForOfflineReload(page, baseURL);
    await page.reload();
    return { stopServingWorker };
  });
  await test.step("Then: The cached shell loads the deck", async () => {
    await expect(page.getByText(deck.name)).toBeVisible();
  });
  await test.step("When: Reopen the remote deck", async () => {
    await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
  });
  await test.step("Then: The card is loaded into cache", async () => {
    await expect(page.getByText(card.frontText)).toBeVisible();
  });
  await test.step("When: Return home before going offline", async () => {
    await page.getByRole("button", { name: "tango" }).click();
  });
  await test.step("Then: The cached deck list is available", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("When: Stop serving the worker, disconnect and reload offline", async () => {
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
  });
  await test.step("Then: The deck list loads offline", async () => {
    await expect(page.getByText(deck.name)).toBeVisible();
  });
  await test.step("When: Open the cached card list offline", async () => {
    await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
  });
  await test.step("Then: The cached card is available", async () => {
    await expect(page.getByText(card.frontText)).toBeVisible();
  });
  await test.step("When: Edit and submit the card while offline", async () => {
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.locator('textarea[name="frontText"]').fill("updated offline front");
    await page.getByRole("button", { name: "Save changes" }).click();
  });
  await test.step("Then: Remote saved text remains unchanged while the edit is pending", async () => {
    await expect
      .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
      .toBe(card.frontText);
  });
  const { verificationContext, verificationErrors, verificationPage } =
    await test.step("Given: A fresh online client opens the same remote deck", async () => {
      const verificationContext = await browser.newContext();
      const verificationErrors = collectBrowserErrors(verificationContext, baseURL);
      const verificationPage = await verificationContext.newPage();
      await fixture.seedPage(verificationPage);
      await verificationPage.goto(`/deck/${deck.id}`);
      return { verificationContext, verificationErrors, verificationPage };
    });
  await test.step("Given: That client still sees the original saved text", async () => {
    await expect(verificationPage.getByText(card.frontText)).toBeVisible();
  });
  await test.step("When: Reconnect the client with the pending edit", async () => {
    await context.setOffline(false);
  });
  await test.step("Then: The pending edit completes and appears in that client", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByText("updated offline front", { exact: true })).toBeVisible();
  });
  await test.step("When: Reload the independent verification client", async () => {
    await verificationPage.reload();
  });
  await test.step("Then: The edit syncs once without duplicating decks or cards", async () => {
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
});

test("PERSISTENCE-04 keeps guest edits local and rejects every cloud write", async ({ fixture, page, namespace }) => {
  const { uid, updatedName, updatedFrontText, deck, card } =
    await test.step("Given: An anonymous deck and card ready for local edits", async () => {
      const { uid } = fixture.user();
      const updatedName = `${namespace.caseId} local deck update`;
      const updatedFrontText = `${namespace.caseId} local card update`;
      await fixture.apply(page);
      const local = await createAnonymousDeck(page);
      const { deck, first: card } = local;

      await page.goto("/");
      return { uid, updatedName, updatedFrontText, deck, card };
    });
  await test.step("When: Edit and save the local deck name", async () => {
    await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(updatedName);
    await page.getByRole("button", { name: "Save changes" }).click();
  });
  await test.step("Then: Local saving returns to the deck list", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("When: Open the renamed deck and save a changed card front", async () => {
    await page.getByRole("button", { name: `Open cards in ${updatedName}` }).click();
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill(updatedFrontText);
    await page.getByRole("button", { name: "Save changes" }).click();
  });
  await test.step("Then: Local card saving returns to its deck", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  });
  await test.step("When: Reload the card list", async () => {
    await page.reload();
  });
  await test.step("Then: The local card edit is restored", async () => {
    await expect(page.getByRole("button", { name: `View ${updatedFrontText}` })).toBeVisible();
  });
  await test.step("When: Return to the deck list", async () => {
    await page.goto("/");
  });
  await test.step("Then: Local edits remain visible without remote records", async () => {
    await expect(page.getByRole("button", { name: `Open cards in ${updatedName}` })).toBeVisible();
    expect(await getDocument("deck", deck.id)).toBeUndefined();
    expect(await getDocument("card", card.id)).toBeUndefined();
  });
  const { legacyDeckId, legacyCardId } =
    await test.step("Given: Legacy remote records already owned by the anonymous UID", async () => {
      // Legacy records may already belong to an anonymous UID; ownership must not grant write access.
      const legacyDeckId = namespace.id("legacy-deck");
      const legacyCardId = namespace.id("legacy-card");
      await setDocument("deck", legacyDeckId, { uid, name: "Legacy deck" });
      await setDocument("card", legacyCardId, { uid, deckId: legacyDeckId, frontText: "Legacy card" });
      return { legacyDeckId, legacyCardId };
    });
  for (const collection of ["deck", "card"] as const) {
    const { existingId, data, create } =
      await test.step("When: Attempt to create a remote record as a guest", async () => {
        const existingId = collection === "deck" ? legacyDeckId : legacyCardId;
        const data = { uid, deckId: legacyDeckId, name: "Denied guest write" };
        const create = await requestFirestoreAsGuest({
          uid,
          collection,
          id: namespace.id(`denied-${collection}`),
          method: "PATCH",
          document: data,
        });
        return { existingId, data, create };
      });
    await test.step("Then: Guest creation is denied", async () => {
      expect(create.status).toBe(403);
    });
    const { update } = await test.step("When: Attempt to update the existing remote record as a guest", async () => {
      const update = await requestFirestoreAsGuest({
        uid,
        collection,
        id: existingId,
        method: "PATCH",
        document: data,
      });
      return { update };
    });
    await test.step("Then: Guest updates are denied", async () => {
      expect(update.status).toBe(403);
    });
    const { remove } = await test.step("When: Attempt to delete the existing remote record as a guest", async () => {
      const remove = await requestFirestoreAsGuest({ uid, collection, id: existingId, method: "DELETE" });
      return { remove };
    });
    await test.step("Then: Guest deletion is denied", async () => {
      expect(remove.status).toBe(403);
    });
  }
  await test.step("Then: The original legacy deck and card remain unchanged", async () => {
    expect((await requireDocument("deck", legacyDeckId)).fields.name?.stringValue).toBe("Legacy deck");
    expect((await requireDocument("card", legacyCardId)).fields.frontText?.stringValue).toBe("Legacy card");
  });
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
  const { deck } = await test.step("Given: A remote deck whose cards are loaded into cache", async () => {
    const deck = fixture.deck();
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}`);
    for (const card of fixture.state.remote.cards)
      await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
    return { deck };
  });
  await test.step("When: Evict the SDK cache and card replica, then reopen the deck", async () => {
    await openStorageMaintenance(page);
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: All cards are reloaded from the server", async () => {
    for (const card of fixture.state.remote.cards)
      await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  });
});

test("PERSISTENCE-08 restores study progress from the SDK cache offline", async ({ fixture, page, browserErrors }) => {
  const { session, currentCard } =
    await test.step("Given: The current study card is cached before Firestore becomes unreachable", async () => {
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
      return { session, currentCard };
    });
  await test.step("When: Reload study without reaching Firestore", async () => {
    await page.reload();
  });
  await test.step("Then: The current card and saved session position restore offline", async () => {
    await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(session.currentIndex));
  });
});

test("PERSISTENCE-09 receives remote edits and tombstones after reopening", async ({ fixture, page }) => {
  const { deck, edited, deleted, unchanged } =
    await test.step("Given: A remote deck with all cards loaded before closing the application", async () => {
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
        await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
      }
      return { deck, edited, deleted, unchanged };
    });
  await test.step("When: Leave the application and reopen the deck", async () => {
    await page.goto("/storage-maintenance");
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: Every saved card is restored", async () => {
    for (const card of fixture.state.remote.cards)
      await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  });
  await test.step("When: Close the app, edit and tombstone cards remotely, then reopen", async () => {
    await page.goto("/storage-maintenance");
    await setDocument("card", edited.id, { ...edited, frontText: "Changed while closed", updatedAt: new Date() });
    await setDocument("card", deleted.id, { ...deleted, deletedAt: Date.now(), updatedAt: new Date() });
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: The edit appears, the tombstone is hidden and untouched cards remain", async () => {
    await expect(page.getByRole("button", { name: "View Changed while closed" })).toBeVisible();
    await expect(page.getByRole("button", { name: `View ${deleted.frontText}` })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `View ${unchanged.frontText}` })).toBeVisible();
  });
  await test.step("When: Close the app, tombstone its deck remotely and reopen home", async () => {
    await page.goto("/storage-maintenance");
    await setDocument("deck", deck.id, { ...deck, deletedAt: Date.now(), updatedAt: new Date() });
    await page.goto("/");
  });
  await test.step("Then: The deleted deck and navigation entry are absent", async () => {
    await expect(page.getByRole("heading", { name: "No decks yet" })).toBeVisible();
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
  });
  await test.step("When: Reload the deck list", async () => {
    await page.reload();
  });
  await test.step("Then: Deck and card tombstones remain effective", async () => {
    await expect(page.getByRole("heading", { name: "No decks yet" })).toBeVisible();
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
    expect((await requireDocument("deck", deck.id)).fields.deletedAt?.integerValue).toBeDefined();
    expect((await requireDocument("card", deleted.id)).fields.deletedAt?.integerValue).toBeDefined();
  });
});

for (const allInvalid of [false, true]) {
  test(`PERSISTENCE-10 starts after reopening ${allInvalid ? "all" : "one"} malformed local Cards`, async ({
    fixture,
    page,
  }, testInfo) => {
    const { deck, first, second } =
      await test.step("Given: An anonymous deck whose healthy cards survived their initial reload", async () => {
        await fixture.seedPage(page);
        const { deck, first, second } = await createAnonymousDeck(page);
        await page.goto(`/deck/${deck.id}`);
        await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toBeVisible();
        await expect(page.getByRole("button", { name: `View ${second.frontText}` })).toBeVisible();
        await page.reload();
        await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toBeVisible();
        await expect(page.getByRole("button", { name: `View ${second.frontText}` })).toBeVisible();
        return { deck, first, second };
      });
    await test.step("When: Corrupt the selected cached card states and reopen home", async () => {
      await setCachedCardFsrs(page, second.id);
      if (allInvalid) await setCachedCardFsrs(page, first.id);
      await page.goto("/");
    });
    const { warning } =
      await test.step("Then: Startup preserves the deck and displays a recovery warning", async () => {
        await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
        const warning = `Some saved cards could not be loaded (${allInvalid ? 2 : 1}). Their saved data is unchanged. Other saved data is still available.`;
        await expect(page.getByText(warning)).toBeVisible();
        return { warning };
      });
    await test.step("When: Open the affected deck", async () => {
      await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
    });
    await test.step("Then: Only healthy cards remain available", async () => {
      await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toHaveCount(allInvalid ? 0 : 1);
      await expect(page.getByRole("button", { name: `View ${second.frontText}` })).toHaveCount(0);
    });
    await test.step("When: Reload the affected card list", async () => {
      await page.reload();
    });
    await test.step("Then: Healthy cards and the warning restore with non-overlapping layout", async () => {
      await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toHaveCount(allInvalid ? 0 : 1);
      await expect(page.getByRole("button", { name: `View ${second.frontText}` })).toHaveCount(0);
      await expect(page.getByText(warning)).toBeVisible();
      const warningBounds = await page.getByText(warning).boundingBox();
      const headerBounds = await page
        .locator("header")
        .filter({ has: page.getByRole("button", { name: "tango", exact: true }) })
        .boundingBox();
      expect(warningBounds).not.toBeNull();
      expect(headerBounds).not.toBeNull();
      expect(warningBounds!.y).toBeGreaterThanOrEqual(headerBounds!.y + headerBounds!.height);

      await testInfo.attach("partial-startup-after-reload", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    });
    await test.step("When: Repair a quarantined card in cache and reopen the deck", async () => {
      await setCachedCardFsrs(page, second.id, null);
      await page.goto(`/deck/${deck.id}`);
    });
    await test.step("Then: The repaired card returns and the warning reflects remaining invalid cards", async () => {
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
  });
}

test("PERSISTENCE-10 keeps healthy study controls inside the mobile viewport with an invalid Card", async ({
  fixture,
  page,
}, testInfo) => {
  const { viewport, first } =
    await test.step("Given: An anonymous deck with one healthy and one quarantined card", async () => {
      const viewport = { width: 390, height: 844 };
      await fixture.seedPage(page);
      const { deck, first, second } = await createAnonymousDeck(page);
      await setCachedCardFsrs(page, second.id);
      await page.goto(`/deck/${deck.id}/start`);
      return { viewport, first };
    });
  await test.step("When: Start the healthy card in a mobile viewport", async () => {
    await page.getByRole("button", { name: "Start 1 card", exact: true }).click();
    await page.setViewportSize(viewport);
  });
  await test.step("Then: Warning and study controls remain visible inside the viewport", async () => {
    await expect(page.locator("#frontText")).toHaveText(first.frontText);
    const warning = page.getByText(
      "Some saved cards could not be loaded (1). Their saved data is unchanged. Other saved data is still available."
    );
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
      await expect(control.locator).toBeVisible();
      const bounds = await control.locator.boundingBox();
      if (bounds === null) throw new Error(`${control.name} has no visible bounds`);
      geometry.push({ name: control.name, ...bounds });
    }
    await testInfo.attach("mobile-study-geometry", {
      body: Buffer.from(JSON.stringify({ viewport, geometry })),
      contentType: "application/json",
    });
    for (const bounds of geometry) {
      expect(bounds.x, bounds.name).toBeGreaterThanOrEqual(0);
      expect(bounds.y, bounds.name).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width, bounds.name).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height, bounds.name).toBeLessThanOrEqual(viewport.height);
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await testInfo.attach("mobile-study-before-interaction", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
  await test.step("When: Start playback with the visible Play control", async () => {
    await page.getByRole("button", { name: "Play", exact: true }).click();
  });
  await test.step("Then: Playback starts", async () => {
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  });
  await test.step("When: Pause playback", async () => {
    await page.getByRole("button", { name: "Pause", exact: true }).click();
  });
  const { completion } = await test.step("Then: Study has not completed without an answer", async () => {
    const completion = page.getByRole("region", { name: "Study complete", exact: true });
    await expect(completion).toHaveCount(0);
    return { completion };
  });
  await test.step("When: Rate the healthy card Good", async () => {
    await page.getByRole("button", { name: "Swipe right: Good", exact: true }).click();
  });
  await test.step("Then: The one-card session completes without a progress slider", async () => {
    await expect(completion).toBeVisible();
    await expect(completion.getByText("Session: 1 card", { exact: true })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveCount(0);
  });
});

test("PERSISTENCE-10 retains the recovery warning on quarantined Card view and edit links", async ({
  fixture,
  page,
}, testInfo) => {
  const { deck, second, warning } =
    await test.step("Given: An anonymous deck with one quarantined card and a recovery warning", async () => {
      await fixture.seedPage(page);
      const { deck, first, second } = await createAnonymousDeck(page);
      await setCachedCardFsrs(page, second.id);
      await page.goto(`/deck/${deck.id}`);
      await expect(page.getByRole("button", { name: `View ${first.frontText}` })).toBeVisible();
      const warning = page.getByText(
        "Some saved cards could not be loaded (1). Their saved data is unchanged. Other saved data is still available."
      );
      return { deck, second, warning };
    });
  for (const suffix of ["", "/edit"]) {
    await test.step("When: Open the quarantined card view or edit route", async () => {
      await page.goto(`/card/${second.id}${suffix}`);
    });
    await test.step("Then: The missing-card state retains the recovery warning", async () => {
      await expect(page.getByRole("heading", { name: "Card not found", exact: true })).toBeVisible();
      await expect(warning).toBeVisible();
    });
    await test.step("When: Reload the quarantined card route", async () => {
      await page.reload();
    });
    await test.step("Then: The missing-card state and warning survive reload", async () => {
      await expect(page.getByRole("heading", { name: "Card not found", exact: true })).toBeVisible();
      await expect(warning).toBeVisible();

      await testInfo.attach(suffix === "" ? "quarantined-card-view" : "quarantined-card-edit", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    });
    await test.step("When: Choose Go home from the quarantined route", async () => {
      await page.getByRole("button", { name: "Go home", exact: true }).click();
    });
    await test.step("Then: Home opens with the healthy deck and warning intact", async () => {
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
      await expect(warning).toBeVisible();
    });
  }
});

test("PERSISTENCE-10 retains the warning on a Deck view with all Cards quarantined", async ({
  fixture,
  page,
}, testInfo) => {
  const { deck, first, second } =
    await test.step("Given: An anonymous deck with a healthy View mode baseline", async () => {
      await fixture.seedPage(page);
      const { deck, first, second } = await createAnonymousDeck(page);
      const firstById = [first, second].toSorted((left, right) => left.id.localeCompare(right.id))[0]!;
      await page.goto(`/deck/${deck.id}/view`);
      await expect(page.getByRole("button", { name: "Card front", exact: true })).toHaveText(firstById.frontText);
      await expect(page.getByText(/Some saved cards could not be loaded/)).toHaveCount(0);
      return { deck, first, second };
    });
  await test.step("When: Quarantine both cached cards and reopen View mode", async () => {
    await setCachedCardFsrs(page, first.id);
    await setCachedCardFsrs(page, second.id);
    await page.goto(`/deck/${deck.id}/view`);
  });
  const { warning } = await test.step("Then: The empty deck view retains the recovery warning", async () => {
    const warning = page.getByText(
      "Some saved cards could not be loaded (2). Their saved data is unchanged. Other saved data is still available."
    );
    await expect(page.getByRole("heading", { name: "No cards yet", exact: true })).toBeVisible();
    await expect(warning).toBeVisible();
    return { warning };
  });
  await test.step("When: Reload the all-quarantined deck view", async () => {
    await page.reload();
  });
  await test.step("Then: The warning remains and no next-card action appears", async () => {
    await expect(page.getByRole("heading", { name: "No cards yet", exact: true })).toBeVisible();
    await expect(warning).toBeVisible();
    await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);

    await testInfo.attach("all-quarantined-deck-view", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
  await test.step("When: Return to the deck list", async () => {
    await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  });
  await test.step("Then: The deck remains available with the recovery warning", async () => {
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
    await expect(warning).toBeVisible();
  });
});
