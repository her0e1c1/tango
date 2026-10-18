import {
  allowExpectedFirestoreWriteFailure,
  documentId,
  expect,
  failNextFirestoreWrite,
  getDocument,
  listDocuments,
  requireDocument,
  test,
} from "./utils/fixtures";
import { readSession } from "./utils/study-helpers";
import type { Page } from "@playwright/test";

test("DECK-MANAGEMENT-07 creates one empty local-only Deck without a remote duplicate", async ({
  fixture,
  page,
  namespace,
}) => {
  const { name, category } = await test.step("Given: An anonymous account ready to create a deck", async () => {
    const name = `${namespace.caseId} local deck`;
    const category = "typescript";
    await fixture.apply(page);

    await page.goto("/");
    return { name, category };
  });
  await test.step("When: Enter a new deck name and category", async () => {
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("menuitem", { name: "Create deck" }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await page.getByRole("combobox").selectOption(category);
  });
  await test.step("Then: No per-deck storage mode is offered", async () => {
    await expect(page.getByRole("radio")).toHaveCount(0);
  });
  await test.step("When: Create the local deck", async () => {
    await page.getByRole("button", { name: "Create deck" }).click();
  });
  const { deckId } = await test.step("Then: One empty deck opens with creation feedback", async () => {
    await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
    await expect(page.getByRole("status").filter({ hasText: `Created deck “${name}”.` })).toBeVisible();
    const deckId = new URL(page.url()).pathname.split("/").at(-1);
    if (deckId === undefined) throw new Error("Created local-only Deck ID is missing");
    await expect(page.getByText("0 cards")).toBeVisible();
    return { deckId };
  });
  await test.step("When: Return home and reload", async () => {
    await page.goto("/");
    await page.reload();
  });
  await test.step("Then: The empty deck appears once", async () => {
    const deckArticle = page
      .getByRole("button", { name: `Open cards in ${name}` })
      .locator("xpath=ancestor::article[1]");
    await expect(deckArticle).toContainText("0 cards");
    await expect(page.getByRole("button", { name: `Open cards in ${name}`, exact: true })).toHaveCount(1);
  });
  await test.step("When: Open the created deck", async () => {
    await page.getByRole("button", { name: `Open cards in ${name}`, exact: true }).click();
  });
  await test.step("Then: It stays empty without a remote duplicate", async () => {
    await expect(page.getByText("0 cards", { exact: true })).toBeVisible();
    expect(
      (await listDocuments("deck")).filter(
        (document) =>
          (document.fields.name as { stringValue?: string } | undefined)?.stringValue === name ||
          documentId(document) === deckId
      )
    ).toEqual([]);
  });
});

const openDeckDeleteDialog = async (page: Page, deckName: string) => {
  await page.getByRole("button", { name: `Open actions for ${deckName}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  return page.getByRole("alertdialog", { name: "Delete deck?" });
};

test("DECK-MANAGEMENT-01 persists edited fields across reload without changing legacy settings", async ({
  fixture,
  page,
  namespace,
}) => {
  const { deck, updatedName, originalCards } =
    await test.step("Given: A saved deck with legacy settings and cards", async () => {
      const deck = fixture.deck();
      await fixture.apply(page);
      const updatedName = `${namespace.caseId} updated`;
      const originalCards = (await listDocuments("card")).filter(
        ({ fields }) => fields.deckId?.stringValue === deck.id
      );

      await page.goto("/");
      return { deck, updatedName, originalCards };
    });
  await test.step("When: Edit its name and category", async () => {
    await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(updatedName);
    await page.getByRole("combobox").selectOption("typescript");
  });
  await test.step("Then: Legacy settings are not offered for editing", async () => {
    await expect(page.getByRole("checkbox", { name: "Convert line breaks", includeHidden: true })).toHaveCount(0);
    await expect(page.getByText("More settings")).toHaveCount(0);
  });
  await test.step("When: Save the deck changes", async () => {
    await page.getByRole("button", { name: "Save changes" }).click();
  });
  await test.step("Then: Updated-deck feedback appears on the deck list", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("status").filter({ hasText: `Updated deck “${updatedName}”.` })).toBeVisible();
  });
  await test.step("When: Reload and reopen the deck editor", async () => {
    await page.reload();
    await page.getByRole("button", { name: `Open actions for ${updatedName}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
  });
  await test.step("Then: Edited fields persist while legacy settings and cards stay intact", async () => {
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(updatedName);
    await expect(page.getByRole("combobox")).toHaveValue("typescript");
    await expect(page.getByRole("checkbox", { name: "Convert line breaks", includeHidden: true })).toHaveCount(0);

    const savedDeck = await requireDocument("deck", deck.id);
    expect(savedDeck.fields.convertToBr?.booleanValue).toBe(deck.convertToBr);
    expect((await listDocuments("card")).filter(({ fields }) => fields.deckId?.stringValue === deck.id)).toEqual(
      originalCards
    );
  });
});

test("DECK-MANAGEMENT-02 deletes one Deck and preserves unrelated Deck data", async ({ fixture, page }) => {
  const { deck, otherDeck, otherCards, otherSession, dialog } =
    await test.step("Given: Two decks with independent cards and study sessions", async () => {
      const deck = fixture.deck("deck-a");
      const otherDeck = fixture.deck("deck-b");
      const otherCards = fixture.state.remote.cards.filter((card) => card.deckId === otherDeck.id);
      const otherSession = fixture.session("deck-b");
      await fixture.apply(page);
      await page.goto("/");

      const dialog = await openDeckDeleteDialog(page, deck.name);
      return { deck, otherDeck, otherCards, otherSession, dialog };
    });
  await test.step("When: Confirm deletion of the first deck", async () => {
    await dialog.getByRole("button", { name: "Delete deck" }).click();
  });
  await test.step("Then: The delete dialog closes with success feedback", async () => {
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: `Deleted deck “${deck.name}”.` })).toBeVisible();
  });
  await test.step("When: Reload the deck list", async () => {
    await page.reload();
  });
  await test.step("Then: The deleted deck remains absent", async () => {
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
    await expect
      .poll(async () => Number((await requireDocument("deck", deck.id)).fields.deletedAt?.integerValue ?? 0))
      .toBeGreaterThan(0);
  });
  await test.step("When: Open its old deck route", async () => {
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: The deleted deck cannot be opened", async () => {
    await expect(page.getByRole("heading", { name: "Deck not found" })).toBeVisible();
  });
  await test.step("When: Return to the deck list", async () => {
    await page.goto("/");
  });
  await test.step("Then: The other deck, cards and session remain available", async () => {
    expect(await getDocument("deck", otherDeck.id)).toBeDefined();
    expect((await Promise.all(otherCards.map((card) => getDocument("card", card.id)))).every(Boolean)).toBe(true);
    expect(await readSession(fixture.user().uid, otherDeck.id)).toEqual(otherSession);
    await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `Open cards in ${otherDeck.name}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `Continue ${otherDeck.name}` })).toBeVisible();
  });
});

test("DECK-MANAGEMENT-02 preserves deletion success when session cleanup is rejected", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { deck, fault } = await test.step("Given: A deck whose study-session cleanup will be rejected", async () => {
    const deck = fixture.deck("deck-a");
    await fixture.apply(page);
    await page.goto("/");
    const fault = await failNextFirestoreWrite(page, { collection: "studySession" });
    allowExpectedFirestoreWriteFailure(browserErrors);
    return { deck, fault };
  });
  try {
    const { dialog } = await test.step("Given: The deck deletion dialog is open", async () => {
      const dialog = await openDeckDeleteDialog(page, deck.name);
      return { dialog };
    });
    await test.step("When: Confirm deck deletion", async () => {
      await dialog.getByRole("button", { name: "Delete deck" }).click();
    });
    await test.step("Then: Deletion succeeds and only session cleanup failure is reported", async () => {
      await expect(dialog).not.toBeVisible();
      await fault.waitForFailure();
      await expect(page.getByRole("alert")).toContainText(
        "The deck was deleted, but its study session could not be closed."
      );
      await expect(
        page.getByText("Unable to delete this deck. Check your connection and try again.", { exact: true })
      ).toHaveCount(0);
      await expect(page.getByRole("button", { name: `Open cards in ${deck.name}`, exact: true })).toHaveCount(0);
      await expect
        .poll(async () => Number((await requireDocument("deck", deck.id)).fields.deletedAt?.integerValue ?? 0))
        .toBeGreaterThan(0);
    });
    await test.step("When: Reload after the cleanup failure", async () => {
      await page.reload();
    });
    await test.step("Then: The deleted deck and Continue entry remain absent", async () => {
      await expect(page.getByRole("button", { name: `Open cards in ${deck.name}`, exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: `Continue ${deck.name}`, exact: true })).toHaveCount(0);
    });
  } finally {
    await fault.dispose();
  }
});

test("DECK-MANAGEMENT-03 cancels Deck deletion and preserves all related data", async ({ fixture, page }) => {
  const { deck, cards, session, trigger, dialog } =
    await test.step("Given: A deck deletion dialog describing its cards and active session", async () => {
      const deck = fixture.deck();
      const { cards } = fixture.state.remote;
      const session = fixture.session();
      await fixture.apply(page);
      await page.goto("/");

      const trigger = page.getByRole("button", { name: `Open actions for ${deck.name}` });
      const dialog = await openDeckDeleteDialog(page, deck.name);
      await expect(dialog).toContainText(deck.name);
      await expect(dialog).toContainText(`${String(cards.length)} cards`);
      await expect(dialog).toContainText("in-progress study session");
      await expect(dialog).toContainText("cannot be undone");
      return { deck, cards, session, trigger, dialog };
    });
  await test.step("When: Cancel deck deletion", async () => {
    await dialog.getByRole("button", { name: "Cancel" }).click();
  });
  await test.step("Then: Focus returns and all deck data is preserved", async () => {
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await getDocument("deck", deck.id)).toBeDefined();
    expect((await Promise.all(cards.map((card) => getDocument("card", card.id)))).every(Boolean)).toBe(true);
    expect(await readSession(fixture.user().uid, deck.id)).toEqual(session);
  });
});

test("DECK-MANAGEMENT-04 retries the same Deck deletion after Firestore rollback", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { deck, fault, dialog } =
    await test.step("Given: A deck deletion dialog with an injected write failure", async () => {
      const deck = fixture.deck();
      await fixture.apply(page);
      await page.goto("/");
      const fault = await failNextFirestoreWrite(page, { collection: "deck", id: deck.id });
      allowExpectedFirestoreWriteFailure(browserErrors);

      const dialog = await openDeckDeleteDialog(page, deck.name);
      return { deck, fault, dialog };
    });
  await test.step("When: Confirm deck deletion", async () => {
    await dialog.getByRole("button", { name: "Delete deck" }).click();
  });
  await test.step("Then: The injected rejection completes after the dialog closes", async () => {
    await expect(dialog).not.toBeVisible();
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
  });
  const { retryDialog } = await test.step("When: Remove the fault and retry deletion of the same deck", async () => {
    await fault.dispose();
    const retryDialog = await openDeckDeleteDialog(page, deck.name);
    await retryDialog.getByRole("button", { name: "Delete deck" }).click();
    return { retryDialog };
  });
  await test.step("Then: Deletion succeeds with no error and saves the tombstone", async () => {
    // Firestore reopens its write stream after the injected non-retryable error before accepting this retry.
    await expect(retryDialog).not.toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: `Deleted deck “${deck.name}”.` })).toBeVisible();
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
    await expect
      .poll(async () => Number((await requireDocument("deck", deck.id)).fields.deletedAt?.integerValue ?? 0))
      .toBeGreaterThan(0);
  });
  await test.step("When: Open the deleted deck route", async () => {
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: The deck is unavailable", async () => {
    await expect(page.getByRole("heading", { name: "Deck not found" })).toBeVisible();
  });
  await test.step("When: Return to the deck list", async () => {
    await page.goto("/");
  });
  await test.step("Then: The deleted session cannot be continued", async () => {
    await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
  });
});

test("DECK-MANAGEMENT-05 creates one empty remote Deck without a local duplicate", async ({
  fixture,
  page,
  namespace,
}) => {
  const { name, category, uid } = await test.step("Given: A linked account ready to create a deck", async () => {
    const name = `${namespace.caseId} created`;
    const category = "typescript";
    const { uid } = fixture.user();
    await fixture.apply(page, { auth: { linked: true } });

    await page.goto("/");
    return { name, category, uid };
  });
  await test.step("When: Enter a new deck name and category", async () => {
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("menuitem", { name: "Create deck" }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await page.getByRole("combobox").selectOption(category);
  });
  await test.step("Then: Legacy settings are not offered", async () => {
    await expect(page.getByRole("checkbox", { name: "Convert line breaks", includeHidden: true })).toHaveCount(0);
    await expect(page.getByText("More settings")).toHaveCount(0);
  });
  await test.step("When: Create the remote deck", async () => {
    await page.getByRole("button", { name: "Create deck" }).click();
  });
  const { deckId } = await test.step("Then: An empty deck opens with creation feedback", async () => {
    await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
    await expect(page.getByRole("status").filter({ hasText: `Created deck “${name}”.` })).toBeVisible();
    const deckId = new URL(page.url()).pathname.split("/").at(-1);
    if (deckId === undefined) throw new Error("Created Deck ID is missing");
    await expect(page.getByText("0 cards")).toBeVisible();
    return { deckId };
  });
  await test.step("When: Return home and reload", async () => {
    await page.goto("/");
    await page.reload();
  });
  await test.step("Then: Exactly one empty deck is saved with the requested category", async () => {
    const deckArticle = page
      .getByRole("button", { name: `Open cards in ${name}` })
      .locator("xpath=ancestor::article[1]");
    await expect(deckArticle).toContainText("0 cards");
    await expect
      .poll(
        async () =>
          (await listDocuments("deck")).filter(
            ({ fields }) => fields.uid?.stringValue === uid && fields.name?.stringValue === name
          ).length
      )
      .toBe(1);
    const remote = await listDocuments("deck");
    const owned = remote.filter(
      ({ fields }) =>
        fields.uid?.stringValue === uid && (fields.name as { stringValue?: string } | undefined)?.stringValue === name
    );
    expect(owned.map(documentId)).toEqual([deckId]);
    expect(owned.map(({ fields }) => fields.category?.stringValue)).toEqual([category]);
    expect(owned.map(({ fields }) => fields.convertToBr?.booleanValue)).toEqual([false]);
    const ownedCardsForDeck = (await listDocuments("card")).filter(
      ({ fields }) => fields.uid?.stringValue === uid && fields.deckId?.stringValue === deckId
    );
    expect(ownedCardsForDeck).toEqual([]);
    await expect(page.getByRole("button", { name: `Open cards in ${name}`, exact: true })).toHaveCount(1);
  });
  await test.step("When: Reopen the created deck editor", async () => {
    await page.getByRole("button", { name: `Open actions for ${name}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
  });
  await test.step("Then: Its saved name and category are restored", async () => {
    await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(name);
    await expect(page.getByRole("combobox")).toHaveValue(category);
    await expect(page.getByRole("checkbox", { name: "Convert line breaks", includeHidden: true })).toHaveCount(0);
  });
});

test("DECK-MANAGEMENT-06 rolls back a rejected remote create without locking the form", async ({
  fixture,
  page,
  browserErrors,
  namespace,
}) => {
  const { name, category, uid } =
    await test.step("Given: A linked account ready for a rejected deck creation", async () => {
      const name = `${namespace.caseId} failed deck`;
      const category = "typescript";
      const { uid } = fixture.user();
      await fixture.apply(page, { auth: { linked: true } });
      await page.goto("/");
      return { name, category, uid };
    });
  const { fault } = await test.step("When: Enter the new deck details with a write failure prepared", async () => {
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("menuitem", { name: "Create deck" }).click();
    const fault = await failNextFirestoreWrite(page, { collection: "deck" });
    allowExpectedFirestoreWriteFailure(browserErrors);
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await page.getByRole("combobox").selectOption(category);
    return { fault };
  });
  await test.step("Then: Legacy settings remain unavailable", async () => {
    await expect(page.getByRole("checkbox", { name: "Convert line breaks", includeHidden: true })).toHaveCount(0);
    await expect(page.getByText("More settings")).toHaveCount(0);
  });
  await test.step("When: Submit deck creation", async () => {
    await page.getByRole("button", { name: "Create deck" }).click();
  });
  await test.step("Then: The injected write rejection completes", async () => {
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
  });
  await test.step("When: Remove the injected fault", async () => {
    await fault.dispose();
  });
  await test.step("Then: No matching remote deck was created", async () => {
    const remote = await listDocuments("deck");
    const owned = remote.filter(
      ({ fields }) =>
        fields.uid?.stringValue === uid && (fields.name as { stringValue?: string } | undefined)?.stringValue === name
    );
    expect(owned).toEqual([]);
  });
  await test.step("When: Return to the deck list", async () => {
    await page.goto("/");
  });
  await test.step("Then: No failed deck creation is shown", async () => {
    await expect(page.getByRole("button", { name: `Open cards in ${name}`, exact: true })).toHaveCount(0);
  });
});

test("DECK-MANAGEMENT-08 confirms before discarding an unsaved Deck edit", async ({ fixture, page, namespace }) => {
  const { deck, unsavedName } = await test.step("Given: A saved deck ready for an unsaved name edit", async () => {
    const deck = fixture.deck();
    const unsavedName = `${namespace.caseId} unsaved`;
    await fixture.apply(page);
    await page.goto("/");
    return { deck, unsavedName };
  });
  const { name, dialog } = await test.step("When: Edit the name, attempt to leave and keep editing", async () => {
    await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    const name = page.getByRole("textbox", { name: "Name", exact: true });
    await name.fill(unsavedName);

    await page.getByRole("button", { name: "tango" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
    await dialog.getByRole("button", { name: "Keep editing" }).click();
    return { name, dialog };
  });
  await test.step("Then: The unsaved name is preserved", async () => {
    await expect(name).toHaveValue(unsavedName);
  });
  await test.step("When: Leave again and confirm discarding changes", async () => {
    await page.getByRole("button", { name: "tango" }).click();
    await dialog.getByRole("button", { name: "Discard changes" }).click();
  });
  await test.step("Then: The original deck remains on the deck list", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  });
});
