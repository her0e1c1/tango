import {
  allowExpectedFirestoreWriteFailure,
  documentId,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  requireDocument,
  test,
} from "./utils/fixtures";

import { createAnonymousDeck, downloadDeckCards } from "./utils/ui-helpers";

import type { Page } from "@playwright/test";

const openCardDeleteDialog = async (page: Page, frontText: string) => {
  await page.getByRole("button", { name: `Open actions for ${frontText}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  return page.getByRole("alertdialog", { name: "Delete card?" });
};

const toggleTag = async (page: Page, name: string) => {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  if ((await checkbox.count()) === 0) {
    await page.getByRole("button", { name: "Add tag", exact: true }).click();
    await page
      .getByRole("textbox", { name: /^Tag name / })
      .last()
      .fill(name);
  } else {
    await checkbox.locator("xpath=parent::label").click();
  }
  return checkbox;
};

test("CARD-MANAGEMENT-05 creates one remote Card and keeps it across reload", async ({ fixture, page, namespace }) => {
  const { deck, frontText, backText } = await test.step("Given: A remote deck ready for card creation", async () => {
    const deck = fixture.deck();
    const frontText = `${namespace.caseId} remote front`;
    const backText = `${namespace.caseId} remote back`;
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}`);
    return { deck, frontText, backText };
  });
  await test.step("When: Open card creation and enter both sides and tags", async () => {
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(backText);
    await page.getByRole("button", { name: "Edit tags" }).click();
    await toggleTag(page, "chapter-1");
    await page.getByRole("button", { name: "Add tag" }).click();
    await page.getByRole("textbox", { name: "Tag name 2", exact: true }).fill("new tag");
    await page.getByRole("button", { name: "Close tag editor" }).click();
    await page.getByRole("button", { name: "Create card" }).click();
  });
  await test.step("Then: Creation completes with success feedback", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
  });
  await test.step("When: Reload the card list", async () => {
    await page.reload();
  });
  await test.step("Then: Exactly one remote card retains its text, tags and identity", async () => {
    await expect(page.getByRole("button", { name: `View ${frontText}` })).toBeVisible();
    await expect
      .poll(
        async () =>
          (await listDocuments("card")).filter(
            (document) =>
              document.fields.deckId?.stringValue === deck.id && document.fields.frontText?.stringValue === frontText
          ).length
      )
      .toBe(1);
    const created = (await listDocuments("card")).filter(
      (document) =>
        document.fields.deckId?.stringValue === deck.id &&
        document.fields.uid?.stringValue === deck.uid &&
        document.fields.frontText?.stringValue === frontText
    );
    expect(created).toHaveLength(1);
    const [createdCard] = created;
    if (createdCard === undefined) throw new Error("Created remote Card was not found");
    expect(createdCard.fields.tags?.arrayValue?.values).toEqual([
      { stringValue: "chapter-1" },
      { stringValue: "new tag" },
    ]);
    expect(createdCard.fields.backText?.stringValue).toBe(backText);
    expect(createdCard.fields.deckId?.stringValue).toBe(deck.id);
    expect(createdCard.fields.uid?.stringValue).toBe(deck.uid);
    expect(createdCard.fields.uniqueKey?.stringValue).toBe(documentId(createdCard));
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(1);
  });
});

test("CARD-MANAGEMENT-06 creates one local Card and keeps it across reload", async ({ fixture, page, namespace }) => {
  const { frontText, backText, deck } =
    await test.step("Given: An anonymous deck ready for card creation", async () => {
      const frontText =
        `${namespace.caseId} local front. ${"This paragraph explains a useful idea with enough detail to study later. ".repeat(26)}`.slice(
          0,
          1748
        );
      const backText = `${namespace.caseId} local back`;
      await fixture.apply(page);
      const { deck } = await createAnonymousDeck(page);
      await page.goto(`/deck/${deck.id}`);
      return { frontText, backText, deck };
    });
  await test.step("When: Open card creation and enter both sides", async () => {
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(backText);
    await page.getByRole("button", { name: "Create card" }).click();
  });
  await test.step("Then: Creation completes with success feedback", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
  });
  await test.step("When: Reload the deck card list", async () => {
    await page.reload();
  });
  await test.step("Then: The local card survives reload", async () => {
    await expect(page.getByRole("button", { name: `View ${frontText}` })).toBeVisible();
  });
  const { cardId, downloaded } = await test.step("When: Open the card editor and export the deck", async () => {
    await page.getByRole("button", { name: `Open actions for ${frontText}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    const cardId = new URL(page.url()).pathname.split("/").at(-2);
    const downloaded = await downloadDeckCards(page, deck.name);
    return { cardId, downloaded };
  });
  await test.step("Then: The local card retains its fields without remote persistence", async () => {
    expect(downloaded.filter((value) => value.frontText === frontText)).toEqual([
      { frontText, backText, tags: [], uniqueKey: cardId },
    ]);
    expect(
      (await listDocuments("card")).filter(
        (document) =>
          document.fields.deckId?.stringValue === deck.id && document.fields.frontText?.stringValue === frontText
      )
    ).toEqual([]);
  });
});

test("CARD-MANAGEMENT-01 persists edited front, back, and tags across reload", async ({ fixture, page, namespace }) => {
  const { deck, card, changed, before } =
    await test.step("Given: A saved card with text, tags and learning progress", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      const changed = {
        frontText: `${namespace.caseId} changed front`,
        backText: `${namespace.caseId} changed back`,
      };
      await fixture.apply(page);
      const before = await requireDocument("card", card.id);

      await page.goto(`/deck/${deck.id}`);
      return { deck, card, changed, before };
    });
  await test.step("When: Edit both sides and tags and save the Card", async () => {
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill(changed.frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(changed.backText);
    await page.getByRole("button", { name: "Edit tags" }).click();
    await toggleTag(page, "math");
    await toggleTag(page, "chapter-1");
    await page.getByRole("button", { name: "Close tag editor" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
  });
  await test.step("Then: The deck opens with update feedback", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByRole("status").filter({ hasText: `Updated card “${changed.frontText}”.` })).toBeVisible();
  });
  await test.step("When: Reload and reopen the card front editor", async () => {
    await page.reload();
    await page.getByRole("button", { name: `Open actions for ${changed.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await page.getByRole("tab", { name: "Front", exact: true }).click();
  });
  await test.step("Then: The edited front text is restored", async () => {
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(changed.frontText);
  });
  await test.step("When: Switch to the back-text editor", async () => {
    await page.getByRole("tab", { name: "Back", exact: true }).click();
  });
  await test.step("Then: The edited back text is restored", async () => {
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(changed.backText);
  });
  await test.step("When: Open the saved tags", async () => {
    await page.getByRole("button", { name: "Edit tags" }).click();
  });
  await test.step("Then: Tags are restored without changing identity or learning progress", async () => {
    await expect(page.getByRole("checkbox", { name: "math" })).not.toBeChecked();
    await expect(page.getByRole("checkbox", { name: "typescript" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "chapter-1" })).toBeChecked();

    const after = await requireDocument("card", card.id);
    // Content edits must not overwrite identity or newer learning progress from the opening form snapshot.
    const {
      frontText: _front,
      backText: _back,
      tags: _tags,
      updatedAt: _updatedAt,
      ...preservedFields
    } = before.fields;
    expect(after.fields).toMatchObject(preservedFields);
    expect(documentId(after)).toBe(card.id);
  });
});

test("CARD-MANAGEMENT-02 deletes a Card and does not reload it as active", async ({ fixture, page }) => {
  const { card, dialog } = await test.step("Given: A card with its deletion dialog open", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);

    await page.goto(`/deck/${deck.id}`);
    const dialog = await openCardDeleteDialog(page, card.frontText);
    return { card, dialog };
  });
  await test.step("When: Confirm card deletion", async () => {
    await dialog.getByRole("button", { name: "Delete card" }).click();
  });
  await test.step("Then: The dialog closes with deletion feedback", async () => {
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: `Deleted card “${card.frontText}”.` })).toBeVisible();
  });
  await test.step("When: Reload the deck card list", async () => {
    await page.reload();
  });
  await test.step("Then: The card is absent and its deletion remains saved", async () => {
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No cards yet", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
  });
});

test("CARD-MANAGEMENT-07 retries a rejected remote Card create without duplicates", async ({
  fixture,
  page,
  browserErrors,
  namespace,
}) => {
  const { deck, frontText, backText } =
    await test.step("Given: A remote deck ready for a rejected card creation", async () => {
      const deck = fixture.deck();
      const frontText = `${namespace.caseId} retry front`;
      const backText = `${namespace.caseId} retry back`;
      await fixture.apply(page);
      await page.goto(`/deck/${deck.id}`);
      return { deck, frontText, backText };
    });
  await test.step("When: Open card creation", async () => {
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();
  });
  await test.step("Then: The deck-specific creation form is active", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
  });

  const { fault } = await test.step("When: Reject the initial Card creation", async () => {
    const fault = await failNextFirestoreWrite(page, { collection: "card" });
    allowExpectedFirestoreWriteFailure(browserErrors);
    await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(backText);
    await page.getByRole("button", { name: "Create card" }).click();
    return { fault };
  });
  await test.step("Then: The injected creation rejection completes", async () => {
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
  });
  await test.step("When: Remove the fault and retry creating the card from a fresh form", async () => {
    await fault.dispose();
    await page.goto(`/deck/${deck.id}/card/new`);
    await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(backText);
    await page.getByRole("button", { name: "Create card" }).click();
  });
  await test.step("Then: Creation succeeds with feedback and no error", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
  });
  await test.step("When: Reload the deck card list", async () => {
    await page.reload();
  });
  await test.step("Then: Exactly one card is saved with the requested contents", async () => {
    await expect(page.getByRole("button", { name: `View ${frontText}` })).toBeVisible();
    await expect
      .poll(
        async () =>
          (await listDocuments("card")).filter(
            ({ fields }) =>
              fields.deckId?.stringValue === deck.id &&
              fields.uid?.stringValue === deck.uid &&
              fields.frontText?.stringValue === frontText
          ).length
      )
      .toBe(1);
    const created = (await listDocuments("card")).filter(
      ({ fields }) =>
        fields.deckId?.stringValue === deck.id &&
        fields.uid?.stringValue === deck.uid &&
        fields.frontText?.stringValue === frontText
    );
    expect(created).toHaveLength(1);
    const [createdCard] = created;
    if (createdCard === undefined) throw new Error("Created remote Card was not found");
    expect(createdCard.fields.backText?.stringValue).toBe(backText);
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(1);
  });
});

test("CARD-MANAGEMENT-04 retries the same Card edit after Firestore rollback", async ({
  fixture,
  page,
  browserErrors,
  namespace,
}) => {
  const { deck, card, changedFront, changedBack, before } =
    await test.step("Given: A saved card ready for an edit retry", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      const changedFront = `${namespace.caseId} retry front`;
      const changedBack = `${namespace.caseId} retry back`;
      await fixture.apply(page);
      const before = await requireDocument("card", card.id);

      await page.goto(`/deck/${deck.id}`);
      return { deck, card, changedFront, changedBack, before };
    });
  await test.step("When: Open the card editor", async () => {
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
  });
  await test.step("Then: The card edit route is active", async () => {
    await expect(page).toHaveURL(new RegExp(`/card/${card.id}/edit$`));
  });
  const { fault } = await test.step("When: Reject the next write while saving changed card text", async () => {
    const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
    allowExpectedFirestoreWriteFailure(browserErrors);
    await page.getByRole("textbox", { name: "Front text" }).fill(changedFront);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(changedBack);
    await page.getByRole("button", { name: "Save changes" }).click();
    return { fault };
  });
  await test.step("Then: The injected edit rejection completes", async () => {
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
  });
  await test.step("When: Remove the fault and retry the same text edit", async () => {
    await fault.dispose();
    await page.goto(`/card/${card.id}/edit`);
    await page.getByRole("textbox", { name: "Front text" }).fill(changedFront);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(changedBack);

    await page.getByRole("button", { name: "Save changes" }).click();
  });
  await test.step("Then: The edit saves with success feedback and no error", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: `Updated card “${changedFront}”.` })).toBeVisible();
    await expect
      .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
      .toBe(changedFront);
  });
  await test.step("When: Reload the deck card list", async () => {
    await page.reload();
  });
  await test.step("Then: The changed front text survives reload", async () => {
    await expect(page.getByText(changedFront)).toBeVisible();
  });
  await test.step("When: Open the changed card answer", async () => {
    await page.getByRole("button", { name: `View ${changedFront}` }).click();
  });
  await test.step("Then: The changed back text survives and identity and learning fields are preserved", async () => {
    await expect(page.getByRole("dialog", { name: changedFront, exact: true })).toContainText(changedBack);

    const after = await requireDocument("card", card.id);
    const { frontText: _front, backText: _back, updatedAt: _updatedAt, ...preservedFields } = before.fields;
    expect(after.fields).toMatchObject(preservedFields);
    expect(documentId(after)).toBe(card.id);
  });
});

test("CARD-MANAGEMENT-08 retries the same Card deletion after Firestore rollback", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { card, fault, dialog } =
    await test.step("Given: A card deletion dialog with an injected write failure", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      await fixture.apply(page);
      await page.goto(`/deck/${deck.id}`);
      const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
      allowExpectedFirestoreWriteFailure(browserErrors);

      const dialog = await openCardDeleteDialog(page, card.frontText);
      return { card, fault, dialog };
    });
  await test.step("When: Confirm card deletion", async () => {
    await dialog.getByRole("button", { name: "Delete card" }).click();
  });
  await test.step("Then: The injected rejection completes after the dialog closes", async () => {
    await expect(dialog).not.toBeVisible();
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
  });
  const { retryDialog } = await test.step("When: Remove the fault and retry deleting the same card", async () => {
    await fault.dispose();
    const retryDialog = await openCardDeleteDialog(page, card.frontText);
    await retryDialog.getByRole("button", { name: "Delete card" }).click();
    return { retryDialog };
  });
  await test.step("Then: The retry dialog closes after server acceptance", async () => {
    await expect(retryDialog).not.toBeVisible({ timeout: 15_000 });
  });
  await test.step("When: Reload the card list", async () => {
    await page.reload();
  });
  await test.step("Then: The card remains deleted", async () => {
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No cards yet", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
  });
});
