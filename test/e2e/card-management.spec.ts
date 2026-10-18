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

test.describe("card-resilience", () => {
  const openCardDeleteDialog = async (page: Page, frontText: string) => {
    await page.getByRole("button", { name: `Open actions for ${frontText}` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    return page.getByRole("alertdialog", { name: "Delete card?" });
  };

  test("CARD-MANAGEMENT-08 retries the same Card deletion after Firestore rollback", async ({
    fixture,
    page,
    browserErrors,
  }) => {
    // Given: Prepare `deck`, `card`, `fault` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}`);
    const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
    allowExpectedFirestoreWriteFailure(browserErrors);

    const dialog = await openCardDeleteDialog(page, card.frontText);
    // When: Exercise `dialog.getByRole("button", { name: "Delete card" }).click` with the prepared inputs.
    await dialog.getByRole("button", { name: "Delete card" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(dialog).not.toBeVisible();
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
    // When: Exercise `fault.dispose` with the prepared inputs.
    await fault.dispose();
    const retryDialog = await openCardDeleteDialog(page, card.frontText);
    await retryDialog.getByRole("button", { name: "Delete card" }).click();

    // Then: Verify the expected result in the assertions below.
    await expect(retryDialog).not.toBeVisible({ timeout: 15_000 });
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
    await expect
      .poll(async () => (await requireDocument("card", card.id)).fields.deletedAt?.integerValue)
      .not.toBeUndefined();
  });

  test("CARD-MANAGEMENT-09 confirms before discarding an unsaved Card edit", async ({ fixture, page, namespace }) => {
    // Given: Prepare `deck`, `card`, `unsavedFrontText` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card();
    const unsavedFrontText = `${namespace.caseId} unsaved front`;
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}`);
    // When: Apply the operation or event under test.
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    const frontText = page.getByRole("textbox", { name: "Front text" });
    await frontText.fill(unsavedFrontText);

    const leaveTrigger = page.getByRole("button", { name: "tango", exact: true });
    await leaveTrigger.click();
    const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
    const keepEditing = dialog.getByRole("button", { name: "Keep editing" });
    const discardChanges = dialog.getByRole("button", { name: "Discard changes" });
    // Then: Verify the expected result in the assertions below.
    await expect(keepEditing).toBeFocused();
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Tab");
    // Then: Verify the expected result in the assertions below.
    await expect(discardChanges).toBeFocused();
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Tab");
    // Then: Verify the expected result in the assertions below.
    await expect(keepEditing).toBeFocused();
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Shift+Tab");
    // Then: Verify the expected result in the assertions below.
    await expect(discardChanges).toBeFocused();
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Shift+Tab");
    // Then: Verify the expected result in the assertions below.
    await expect(keepEditing).toBeFocused();
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Escape");
    // Then: Verify the expected result in the assertions below.
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(`/card/${card.id}/edit`);
    await expect(frontText).toHaveValue(unsavedFrontText);
    await expect(leaveTrigger).toBeFocused();

    // When: Exercise `leaveTrigger.click` with the prepared inputs.
    await leaveTrigger.click();
    await keepEditing.click();
    // Then: Verify the expected result in the assertions below.
    await expect(frontText).toHaveValue(unsavedFrontText);
    // When: Exercise `leaveTrigger.click` with the prepared inputs.
    await leaveTrigger.click();
    await discardChanges.click();

    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
    await expect
      .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
      .toBe(card.frontText);
  });

  test("CARD-MANAGEMENT-11 confirms before discarding an unsaved Card create", async ({ fixture, page, namespace }) => {
    // Given: Prepare `deck`, `unsavedFrontText` and any shared test state below.
    const deck = fixture.deck();
    const unsavedFrontText = `${namespace.caseId} unsaved front`;
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}`);
    // When: Exercise `page.getByRole("button", { name: "Actions", exact: true }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();

    // Clean exit has no confirmation
    await page.getByRole("button", { name: "Cancel" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(`/deck/${deck.id}`);

    // Dirty exit prompts confirmation
    // When: Exercise `page.getByRole("button", { name: "Actions", exact: true }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();
    const frontText = page.getByRole("textbox", { name: "Front text" });
    await frontText.fill(unsavedFrontText);

    await page.getByRole("button", { name: "Cancel" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
    await dialog.getByRole("button", { name: "Keep editing" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(frontText).toHaveValue(unsavedFrontText);

    // When: Exercise `page.getByRole("button", { name: "Cancel" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Cancel" }).click();
    await dialog.getByRole("button", { name: "Discard changes" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(`/deck/${deck.id}`);
    await expect(page.getByRole("button", { name: `View ${unsavedFrontText}` })).toHaveCount(0);
  });

  const beginCardCreation = async (page: Page, deckId: string, frontText: string) => {
    await page.goto(`/deck/${deckId}`);
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill("Pending back");
    const write = await holdCardWrite(page);
    await page.getByRole("button", { name: "Create card", exact: true }).click();
    await write.arrived;
    return write;
  };

  const expectCreatedCard = async (page: Page, deckId: string, frontText: string) => {
    // Given: Use this case's inputs and any shared test setup.
    await expect(page).toHaveURL(`/deck/${deckId}`);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByRole("status", { name: "Toast notifications" })).toContainText(
      `Created card “${frontText}”.`
    );
    await expect
      .poll(async () =>
        (await listDocuments("card"))
          .filter(
            (document) =>
              document.fields.deckId?.stringValue === deckId && document.fields.frontText?.stringValue === frontText
          )
          .map((document) => document.fields.backText?.stringValue)
      )
      .toEqual(["Pending back"]);
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toBeVisible();
  };

  test("CARD-MANAGEMENT-12 waits for server acceptance before completing an unanswered leave dialog", async ({
    fixture,
    page,
    namespace,
  }) => {
    // Given: Prepare `deck`, `frontText`, `write` and any shared test state below.
    const deck = fixture.deck();
    const frontText = `${namespace.caseId} pending front`;
    await fixture.apply(page);
    const write = await beginCardCreation(page, deck.id, frontText);
    try {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      await expect(page).toHaveURL(`/deck/${deck.id}/card/new`);
      // When: Exercise `page.getByRole("button", { name: "tango", exact: true }).click` with the prepared inputs.
      await page.getByRole("button", { name: "tango", exact: true }).click();
      const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
      await dialog.getByRole("button", { name: "Keep editing" }).click();
      // Then: Verify the expected result in the assertions below.
      await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Pending back");
      // When: Exercise `page.getByRole("button", { name: "tango", exact: true }).click` with the prepared inputs.
      await page.getByRole("button", { name: "tango", exact: true }).click();
      // Then: Verify the expected result in the assertions below.
      await expect(dialog).toBeVisible();
      // When: Exercise `write.release` with the prepared inputs.
      write.release();
      // Then: Verify the expected result in the assertions below.
      await expectCreatedCard(page, deck.id, frontText);
    } finally {
      write.release();
    }
  });

  test("CARD-MANAGEMENT-13 keeps a pending creation after explicitly leaving the form", async ({
    fixture,
    page,
    namespace,
  }) => {
    // Given: Prepare `deck`, `frontText`, `write` and any shared test state below.
    const deck = fixture.deck();
    const frontText = `${namespace.caseId} background front`;
    await fixture.apply(page);
    const write = await beginCardCreation(page, deck.id, frontText);
    try {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `page.getByRole("button", { name: "tango", exact: true }).click` with the prepared inputs.
      await page.getByRole("button", { name: "tango", exact: true }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Discard changes" }).click();
      // Then: Verify the expected result in the assertions below.
      await expect(page).toHaveURL(/\/$/);
      // When: Exercise `write.release` with the prepared inputs.
      write.release();
      // Then: Verify the expected result in the assertions below.
      await expect
        .poll(async () =>
          (await listDocuments("card")).some((item) => item.fields.frontText?.stringValue === frontText)
        )
        .toBe(true);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("status", { name: "Toast notifications" })).not.toContainText(
        `Created card “${frontText}”.`
      );
      // When: Apply the operation or event under test.
      await page.getByRole("button", { name: `Open cards in ${deck.name}`, exact: true }).click();
      // Then: Verify the expected result in the assertions below.
      await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toBeVisible();
      // When: Exercise `page.reload` with the prepared inputs.
      await page.reload();
      // Then: Verify the expected result in the assertions below.
      await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(1);
    } finally {
      write.release();
    }
  });

  test("CARD-MANAGEMENT-14 preserves the leave dialog and inputs after rejection and retries", async ({
    fixture,
    page,
    namespace,
    browserErrors,
  }) => {
    // Given: Prepare `deck`, `frontText`, `fault` and any shared test state below.
    const deck = fixture.deck();
    const frontText = `${namespace.caseId} rejected front`;
    await fixture.apply(page);
    const fault = await failNextFirestoreWrite(page, { collection: "card" });
    allowExpectedFirestoreWriteFailure(browserErrors);
    const write = await beginCardCreation(page, deck.id, frontText);
    try {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `page.getByRole("button", { name: "tango", exact: true }).click` with the prepared inputs.
      await page.getByRole("button", { name: "tango", exact: true }).click();
      const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
      // Then: Verify the expected result in the assertions below.
      await expect(dialog).toBeVisible();
      // When: Exercise `write.release` with the prepared inputs.
      write.release();
      await fault.waitForFailure();
      await fault.dispose();
      // Then: Verify the expected result in the assertions below.
      await expect(page.getByRole("alert")).toContainText("Unable to create this card. Try again.");
      await expect(dialog).toBeVisible();
      // When: Exercise `dialog.getByRole("button", { name: "Keep editing" }).click` with the prepared inputs.
      await dialog.getByRole("button", { name: "Keep editing" }).click();
      // Then: Verify the expected result in the assertions below.
      await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Pending back");
      // When: Exercise `page.getByRole("tab", { name: "Front", exact: true }).click` with the prepared inputs.
      await page.getByRole("tab", { name: "Front", exact: true }).click();
      // Then: Verify the expected result in the assertions below.
      await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(frontText);
      // When: Exercise `page.getByRole("button", { name: "Create card", exact: true }).click` with the prepared inputs.
      await page.getByRole("button", { name: "Create card", exact: true }).click();
      // Then: Verify the expected result in the assertions below.
      await expectCreatedCard(page, deck.id, frontText);
    } finally {
      write.release();
      await fault.dispose();
    }
  });

  // Hold the outgoing write without cancelling it; the SDK must still settle it after SPA navigation.
  const holdCardWrite = async (page: Page, cardId = "") => {
    const arrived = Promise.withResolvers<void>();
    const released = Promise.withResolvers<void>();
    let held = false;
    await page.route("**/google.firestore.v1.Firestore/Write/channel**", async (route) => {
      const body = decodeURIComponent((route.request().postData() ?? "").replaceAll("+", "%20"));
      if (!held && body.includes(`/documents/card/${cardId}`)) {
        held = true;
        arrived.resolve();
        await released.promise;
      }
      await route.fallback();
    });
    return { arrived: arrived.promise, release: () => released.resolve() };
  };
});

test.describe("card", () => {
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

  test("CARD-MANAGEMENT-01 persists edited front, back, and tags across reload", async ({
    fixture,
    page,
    namespace,
  }) => {
    // Given: Prepare `deck`, `card`, `changed` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card();
    const changed = {
      frontText: `${namespace.caseId} changed front`,
      backText: `${namespace.caseId} changed back`,
    };
    await fixture.apply(page);
    const before = await requireDocument("card", card.id);

    await page.goto(`/deck/${deck.id}`);
    // When: Apply the operation or event under test.
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill(changed.frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Expand Back" }).click();
    const expandedEditor = page.getByRole("dialog", { name: "Back text" });
    await expandedEditor.getByRole("textbox", { name: "Back text" }).fill(changed.backText);
    await expandedEditor.getByRole("button", { name: "Done" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: "Expand Back" })).toBeFocused();
    // When: Exercise `page.getByRole("button", { name: "Edit tags" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Edit tags" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("checkbox", { name: "python" })).toHaveCount(0);
    // When: Exercise `toggleTag` with the prepared inputs.
    await toggleTag(page, "math");
    await toggleTag(page, "chapter-1");
    await page.getByRole("button", { name: "Close tag editor" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByRole("status").filter({ hasText: `Updated card “${changed.frontText}”.` })).toBeVisible();
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();
    await page.getByRole("button", { name: `Open actions for ${changed.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await page.getByRole("tab", { name: "Front", exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(changed.frontText);
    // When: Exercise `page.getByRole("tab", { name: "Back", exact: true }).click` with the prepared inputs.
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue(changed.backText);
    // When: Exercise `page.getByRole("button", { name: "Edit tags" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Edit tags" }).click();
    // Then: Verify the expected result in the assertions below.
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
    // Then: Verify the expected result in the assertions below.
    expect(after.fields).toMatchObject(preservedFields);
    expect(documentId(after)).toBe(card.id);
  });

  test("CARD-MANAGEMENT-02 deletes a Card and does not reload it as active", async ({ fixture, page }) => {
    // Given: Prepare `deck`, `card`, `dialog` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);

    await page.goto(`/deck/${deck.id}`);
    const dialog = await openCardDeleteDialog(page, card.frontText);
    // When: Exercise `dialog.getByRole("button", { name: "Delete card" }).click` with the prepared inputs.
    await dialog.getByRole("button", { name: "Delete card" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: `Deleted card “${card.frontText}”.` })).toBeVisible();
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();

    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
    await expect
      .poll(async () => (await requireDocument("card", card.id)).fields.deletedAt?.integerValue)
      .not.toBeUndefined();
  });

  test("CARD-MANAGEMENT-03 cancels deletion, restores focus, and preserves persistent data", async ({
    fixture,
    page,
  }) => {
    // Given: Prepare `deck`, `card`, `before` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    const before = await requireDocument("card", card.id);

    await page.goto(`/deck/${deck.id}`);
    const trigger = page.getByRole("button", { name: `Open actions for ${card.frontText}` });
    const dialog = await openCardDeleteDialog(page, card.frontText);
    await expect(dialog).toContainText(card.frontText);
    await expect(dialog).toContainText("cannot be undone");
    // When: Exercise `dialog.getByRole("button", { name: "Cancel" }).click` with the prepared inputs.
    await dialog.getByRole("button", { name: "Cancel" }).click();

    // Then: Verify the expected result in the assertions below.
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await requireDocument("card", card.id)).toEqual(before);
  });

  test("CARD-MANAGEMENT-04 retries the same Card edit after Firestore rollback", async ({
    fixture,
    page,
    browserErrors,
    namespace,
  }) => {
    // Given: Prepare `deck`, `card`, `changedFront` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card();
    const changedFront = `${namespace.caseId} retry front`;
    const changedBack = `${namespace.caseId} retry back`;
    await fixture.apply(page);
    const before = await requireDocument("card", card.id);

    await page.goto(`/deck/${deck.id}`);
    // When: Apply the operation or event under test.
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(new RegExp(`/card/${card.id}/edit$`));
    // When: Exercise `failNextFirestoreWrite` with the prepared inputs.
    const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
    allowExpectedFirestoreWriteFailure(browserErrors);
    await page.getByRole("textbox", { name: "Front text" }).fill(changedFront);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(changedBack);
    await page.getByRole("button", { name: "Save changes" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
    // When: Exercise `fault.dispose` with the prepared inputs.
    await fault.dispose();
    await page.goto(`/card/${card.id}/edit`);
    await page.getByRole("textbox", { name: "Front text" }).fill(changedFront);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(changedBack);

    await page.getByRole("button", { name: "Save changes" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: `Updated card “${changedFront}”.` })).toBeVisible();
    await expect
      .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
      .toBe(changedFront);
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();

    // Then: Verify the expected result in the assertions below.
    await expect(page.getByText(changedFront)).toBeVisible();
    // When: Exercise `page.getByRole("button", { name: `View ${changedFront}` }).click` with the prepared inputs.
    await page.getByRole("button", { name: `View ${changedFront}` }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: "Close card" })).toContainText(changedBack);

    const after = await requireDocument("card", card.id);
    const { frontText: _front, backText: _back, updatedAt: _updatedAt, ...preservedFields } = before.fields;
    // Then: Verify the expected result in the assertions below.
    expect(after.fields).toMatchObject(preservedFields);
    expect(documentId(after)).toBe(card.id);
  });

  test("CARD-MANAGEMENT-05 creates one remote Card and keeps it across reload", async ({
    fixture,
    page,
    namespace,
  }) => {
    // Given: Prepare `deck`, `frontText`, `backText` and any shared test state below.
    const deck = fixture.deck();
    const frontText = `${namespace.caseId} remote front`;
    const backText = `${namespace.caseId} remote back`;
    const viewport = { width: 390, height: 844 };
    const viewportBounds = { x: 0, y: 0, ...viewport };
    // When: Exercise `page.setViewportSize` with the prepared inputs.
    await page.setViewportSize(viewport);
    await fixture.apply(page);

    await page.goto(`/deck/${deck.id}`);
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
    for (const { side, value } of [
      { side: "Front", value: frontText },
      { side: "Back", value: backText },
    ]) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `page.getByRole("tab", { name: side, exact: true }).click` with the prepared inputs.
      await page.getByRole("tab", { name: side, exact: true }).click();
      await page.getByRole("button", { name: `Expand ${side}` }).click();
      const editor = page.getByRole("dialog", { name: `${side} text` });
      // Then: Verify the expected result in the assertions below.
      await expect(editor).toBeVisible();
      expect(await editor.boundingBox()).toEqual(viewportBounds);
      expect(await page.getByTestId("card-fields-backdrop").boundingBox()).toEqual(viewportBounds);
      // When: Exercise `editor.getByRole("textbox", { name: `${side} text` }).fill` with the prepared inputs.
      await editor.getByRole("textbox", { name: `${side} text` }).fill(value);
      await editor.getByRole("button", { name: "Done" }).click();
      // Then: Verify the expected result in the assertions below.
      await expect(page.getByRole("textbox", { name: `${side} text` })).toHaveValue(value);
    }
    // When: Exercise `page.getByRole("button", { name: "Edit tags" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Edit tags" }).click();
    const tagsDialog = page.getByRole("dialog", { name: "Select tags" });
    // Then: Verify the expected result in the assertions below.
    await expect(tagsDialog).toBeVisible();
    expect(await page.getByTestId("card-fields-backdrop").boundingBox()).toEqual(viewportBounds);
    // When: Exercise `tagsDialog.boundingBox` with the prepared inputs.
    const tagsBounds = await tagsDialog.boundingBox();
    if (tagsBounds === null) throw new Error("Tag selection dialog bounding box is unavailable");
    // Then: Verify the expected result in the assertions below.
    expect(tagsBounds.y + tagsBounds.height).toBe(viewport.height);
    await expect(tagsDialog.getByRole("checkbox", { name: "python" })).toHaveCount(0);
    // When: Exercise `toggleTag` with the prepared inputs.
    await toggleTag(page, "chapter-1");
    await tagsDialog.getByRole("button", { name: "Add tag" }).click();
    await tagsDialog.getByRole("textbox", { name: "Tag name 2", exact: true }).fill(" new tag ");
    await tagsDialog.getByRole("button", { name: "Close tag editor" }).click();
    await page.getByRole("button", { name: "Create card" }).dblclick();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();

    // Then: Verify the expected result in the assertions below.
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
    expect(createdCard.fields.deckId?.stringValue).toBe(deck.id);
    expect(createdCard.fields.uid?.stringValue).toBe(deck.uid);
    expect(createdCard.fields.uniqueKey?.stringValue).toBe(documentId(createdCard));
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(1);
  });

  test("CARD-MANAGEMENT-06 creates one local Card and keeps it across reload", async ({ fixture, page, namespace }) => {
    // Given: Prepare `frontText`, `backText` and any shared test state below.
    const frontText =
      `${namespace.caseId} local front. ${"This paragraph explains a useful idea with enough detail to study later. ".repeat(26)}`.slice(
        0,
        1748
      );
    const backText = `${namespace.caseId} local back`;
    // When: Exercise `page.setViewportSize` with the prepared inputs.
    await page.setViewportSize({ width: 360, height: 640 });
    await fixture.apply(page);
    const local = await createAnonymousDeck(page);
    const { deck } = local;

    await page.goto(`/deck/${deck.id}`);
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add card" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
    // When: Exercise `page.getByRole("textbox", { name: "Front text" }).fill` with the prepared inputs.
    await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill(backText);
    await page.getByRole("button", { name: "Create card" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
    const dismiss = page.getByRole("button", { name: "Dismiss notification" });
    // When: Exercise `dismiss.locator` with the prepared inputs.
    const toast = dismiss.locator("..");
    const message = toast.getByText(`Created card “${frontText}”.`, { exact: true });
    for (const target of [toast, message, dismiss]) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `target.boundingBox` with the prepared inputs.
      const box = await target.boundingBox();
      if (box === null) throw new Error("Toast content has no rendered bounds");
      // Then: Verify the expected result in the assertions below.
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
      expect(box.y + box.height).toBeLessThanOrEqual(640);
    }
    // When: Exercise `message.evaluate` with the prepared inputs.
    const preview = await message.evaluate((element) => {
      const text = element.firstChild;
      if (text === null) throw new Error("Toast message is empty");
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, "Created card “CARD-MANAGEMENT-06 local front.".length);
      const prefix = range.getBoundingClientRect();
      const bounds = element.getBoundingClientRect();
      return {
        height: bounds.height,
        lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
        prefixTop: prefix.top,
        prefixBottom: prefix.bottom,
        top: bounds.top,
        bottom: bounds.bottom,
      };
    });
    // Then: Verify the expected result in the assertions below.
    expect(preview.height).toBeLessThanOrEqual(preview.lineHeight * 3);
    expect(preview.prefixTop).toBeGreaterThanOrEqual(preview.top);
    expect(preview.prefixBottom).toBeLessThanOrEqual(preview.bottom);
    // When: Exercise `dismiss.click` with the prepared inputs.
    await dismiss.click({ trial: true });
    await dismiss.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    // Then: Verify the expected result in the assertions below.
    await expect(dismiss).toBeFocused();
    expect(await dismiss.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
    await expect(dismiss).not.toHaveCSS("box-shadow", "none");
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Enter");
    // Then: Verify the expected result in the assertions below.
    await expect(dismiss).toHaveCount(0);
    await expect(page.getByRole("main")).toBeFocused();
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();

    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name: `View ${frontText}` })).toBeVisible();
    // When: Apply the operation or event under test.
    await page.getByRole("button", { name: `Open actions for ${frontText}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    const cardId = new URL(page.url()).pathname.split("/").at(-2);
    const downloaded = await downloadDeckCards(page, deck.name);
    // Then: Verify the expected result in the assertions below.
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

  test("CARD-MANAGEMENT-10 reveals the first invalid side without saving empty text", async ({ fixture, page }) => {
    // Given: Prepare `deck`, `card`, `before` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    const before = await requireDocument("card", card.id);
    await page.goto(`/deck/${deck.id}`);
    // When: Apply the operation or event under test.
    await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("textbox", { name: "Front text" }).fill("");
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    await page.getByRole("textbox", { name: "Back text" }).fill("");
    await page.getByRole("button", { name: "Save changes" }).click();

    const frontTab = page.getByRole("tab", { name: "Front", exact: true });
    const backTab = page.getByRole("tab", { name: "Back", exact: true });
    // Then: Verify the expected result in the assertions below.
    await expect(frontTab).toHaveAttribute("aria-selected", "true");
    await expect(frontTab.getByText("●", { exact: true })).toBeVisible();
    await expect(backTab.getByText("●", { exact: true })).toBeVisible();
    await expect(frontTab).toHaveAccessibleDescription("Front text is required.");
    await expect(backTab).toHaveAccessibleDescription("Back text is required.");
    await expect(page.getByRole("textbox", { name: "Front text" })).toBeFocused();
    await expect(page.getByText("Front text is required.")).toBeVisible();
    // When: Exercise `page.getByRole("tab", { name: "Back", exact: true }).click` with the prepared inputs.
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByText("Back text is required.")).toBeVisible();
    // When: Exercise `page.getByRole("button", { name: "Expand Back" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Expand Back" }).click();
    const expandedEditor = page.getByRole("dialog", { name: "Back text" });
    // Then: Verify the expected result in the assertions below.
    await expect(expandedEditor.getByRole("textbox", { name: "Back text" })).toHaveAttribute("aria-invalid", "true");
    await expect(expandedEditor.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription(
      "Back text is required."
    );
    await expect(expandedEditor.getByText("Back text is required.")).toBeVisible();
    // When: Exercise `expandedEditor.getByRole("button", { name: "Done" }).click` with the prepared inputs.
    await expandedEditor.getByRole("button", { name: "Done" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("");
    expect(await requireDocument("card", card.id)).toEqual(before);
  });

  test("CARD-MANAGEMENT-15 previews an unsaved answer while creating an incomplete Card", async ({ fixture, page }) => {
    // Given: Prepare `local` and any shared test state below.
    await fixture.apply(page);
    const local = await createAnonymousDeck(page);
    const { deck } = local;

    // When: Exercise `page.setViewportSize` with the prepared inputs.
    await page.setViewportSize({ width: 375, height: 812 });
    const before = await downloadDeckCards(page, deck.name);
    await page.goto(`/deck/${deck.id}/card/new`);
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("heading", { name: "Create card" })).toBeVisible();
    // When: Exercise `page.url` with the prepared inputs.
    const url = page.url();
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Back text" });
    await input.fill("First line\nSecond line");
    const trigger = page.getByRole("button", { name: "Preview answer" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const preview = page.getByRole("region", { name: "Answer preview" });
    // Then: Verify the expected result in the assertions below.
    await expect(preview.locator("pre")).toHaveText("First line\nSecond line");
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Enter");
    // Then: Verify the expected result in the assertions below.
    await expect(preview).toBeHidden();
    await expect(trigger).toBeFocused();
    // Native undo must survive opening and closing the preview.
    // When: Exercise `input.fill` with the prepared inputs.
    await input.fill("");
    await input.press("x");
    await trigger.click();
    await page.getByRole("button", { name: "Hide preview" }).click();
    await input.focus();
    await input.press("ControlOrMeta+z");
    // Then: Verify the expected result in the assertions below.
    await expect(input).toHaveValue("");
    // When: Exercise `input.fill` with the prepared inputs.
    await input.fill("**Draft answer**\n\n$x^2$\n\n| A | B |\n| - | - |\n| 1 | 2 |");
    await page.getByRole("button", { name: "Edit tags" }).click();
    await toggleTag(page, "math");
    await page.getByRole("button", { name: "Close tag editor" }).click();
    await trigger.click();
    // Then: Verify the expected result in the assertions below.
    await expect(preview.locator("strong")).toHaveText("Draft answer");
    await expect(preview.locator(".katex")).toBeVisible();
    await expect(preview.getByRole("table")).toBeVisible();
    // When: Exercise `page.getByRole("button", { name: "Expand Back" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Expand Back" }).click();
    const dialog = page.getByRole("dialog", { name: "Back text" });
    await dialog.getByRole("textbox").fill("**Expanded draft**\n\n$y^2$");
    await dialog.getByRole("button", { name: "Preview answer" }).press("Enter");
    // Then: Verify the expected result in the assertions below.
    await expect(dialog.getByRole("region").locator("strong")).toHaveText("Expanded draft");
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Escape");
    // Then: Verify the expected result in the assertions below.
    await expect(input).toHaveValue("**Expanded draft**\n\n$y^2$");
    await expect(preview.locator("strong")).toHaveText("Expanded draft");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page).toHaveURL(url);
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();
    // Then: Verify the expected result in the assertions below.
    expect(await downloadDeckCards(page, deck.name)).toEqual(before);
  });

  test("CARD-MANAGEMENT-16 previews current answer tags without saving the edited Card", async ({ fixture, page }) => {
    // Given: Prepare `local`, `before`, `url` and any shared test state below.
    await fixture.apply(page);
    const local = await createAnonymousDeck(page);
    const { deck, first: card } = local;

    const before = await downloadDeckCards(page, deck.name);
    await page.goto(`/card/${card.id}/edit`);
    await expect(page.getByRole("heading", { name: "Edit card" })).toBeVisible();
    const url = page.url();
    // When: Exercise `page.getByRole("tab", { name: "Back", exact: true }).click` with the prepared inputs.
    await page.getByRole("tab", { name: "Back", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Back text" });
    await input.fill("const answer = 42;");
    await page.getByRole("button", { name: "Edit tags" }).click();
    await toggleTag(page, "typescript");
    await page.getByRole("button", { name: "Close tag editor" }).click();
    await page.getByRole("button", { name: "Preview answer" }).click();
    const preview = page.getByRole("region", { name: "Answer preview" });
    // Then: Verify the expected result in the assertions below.
    await expect(preview.locator("code")).toHaveAttribute("data-language", "typescript");
    await expect(preview.locator(".hljs-keyword")).toHaveText("const");
    // When: Exercise `page.locator("html").evaluate` with the prepared inputs.
    const dark = await page.locator("html").evaluate((element) => element.classList.contains("dark"));
    // Then: Verify the expected result in the assertions below.
    await expect(preview.locator("code")).toHaveAttribute("data-theme", dark ? "dark" : "light");
    // When: Exercise `page.getByRole("button", { name: "Edit tags" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Edit tags" }).click();
    await toggleTag(page, "typescript");
    await toggleTag(page, "md");
    await page.getByRole("button", { name: "Close tag editor" }).click();
    await input.fill("**Markdown source** $x^2$");
    // Then: Verify the expected result in the assertions below.
    await expect(preview.locator("code")).toHaveAttribute("data-language", "md");
    await expect(preview.locator(".katex")).toHaveCount(0);
    // When: Exercise `page.getByRole("button", { name: "Edit tags" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Edit tags" }).click();
    await toggleTag(page, "md");
    await toggleTag(page, "python");
    await page.getByRole("button", { name: "Close tag editor" }).click();
    await input.fill("def draft():\n    return 42");
    // Then: Verify the expected result in the assertions below.
    await expect(preview.locator("code")).toHaveAttribute("data-language", "python");
    await expect(preview.locator(".hljs-title")).toHaveText("draft");
    // When: Exercise `page.getByRole("button", { name: "Expand Back" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Expand Back" }).click();
    const dialog = page.getByRole("dialog", { name: "Back text" });
    const expandedInput = dialog.getByRole("textbox");
    await expandedInput.fill("");
    await expandedInput.press("x");
    await dialog.getByRole("button", { name: "Preview answer" }).press("Enter");
    await dialog.getByRole("button", { name: "Hide preview" }).press("Enter");
    await expandedInput.focus();
    await expandedInput.press("ControlOrMeta+z");
    // Then: Verify the expected result in the assertions below.
    await expect(expandedInput).toHaveValue("");
    // When: Exercise `expandedInput.fill` with the prepared inputs.
    await expandedInput.fill("def updated():\n    return 43");
    await dialog.getByRole("button", { name: "Preview answer" }).press("Enter");
    // Then: Verify the expected result in the assertions below.
    await expect(dialog.getByRole("region").locator(".hljs-title")).toHaveText("updated");
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Escape");
    // Then: Verify the expected result in the assertions below.
    await expect(input).toHaveValue("def updated():\n    return 43");
    await expect(preview.locator(".hljs-title")).toHaveText("updated");
    await expect(page).toHaveURL(url);
    // When: Exercise `page.getByRole("button", { name: "tango" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "tango" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("alertdialog")).toBeVisible();
    // When: Exercise `page.getByRole("button", { name: "Keep editing" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Keep editing" }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(input).toHaveValue("def updated():\n    return 43");
    // When: Exercise `page.reload` with the prepared inputs.
    await page.reload();
    // Then: Verify the expected result in the assertions below.
    expect(await downloadDeckCards(page, deck.name)).toEqual(before);
  });
});

test("CARD-MANAGEMENT-07 retries a rejected remote Card create with a new ID and no duplicate", async ({
  fixture,
  page,
  browserErrors,
  namespace,
}) => {
  // Given: Prepare `deck`, `frontText`, `backText` and any shared test state below.
  const deck = fixture.deck();
  const frontText = `${namespace.caseId} retry front`;
  const backText = `${namespace.caseId} retry back`;
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  // When: Exercise `page.getByRole("button", { name: "Actions", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Add card" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));

  let attemptedCardId: string | undefined;
  // When: Exercise `page.on` with the prepared inputs.
  page.on("request", (request) => {
    if (!request.url().includes("google.firestore.v1.Firestore/Write/channel")) return;
    const body = decodeURIComponent((request.postData() ?? "").replaceAll("+", "%20"));
    attemptedCardId ??= body.match(/\/documents\/card\/([a-zA-Z0-9-]+)/)?.[1];
  });
  const fault = await failNextFirestoreWrite(page, { collection: "card" });
  allowExpectedFirestoreWriteFailure(browserErrors);
  await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
  await page.getByRole("tab", { name: "Back", exact: true }).click();
  await page.getByRole("textbox", { name: "Back text" }).fill(backText);
  await page.getByRole("button", { name: "Create card" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  // When: Exercise `fault.dispose` with the prepared inputs.
  await fault.dispose();
  // Then: Verify the expected result in the assertions below.
  expect(attemptedCardId).toBeDefined();

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/card/new`);
  await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
  await page.getByRole("tab", { name: "Back", exact: true }).click();
  await page.getByRole("textbox", { name: "Back text" }).fill(backText);
  await page.getByRole("button", { name: "Create card" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();

  // Then: Verify the expected result in the assertions below.
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
  expect(documentId(createdCard)).not.toBe(attemptedCardId);
  expect(createdCard.fields.backText?.stringValue).toBe(backText);
  expect(createdCard.fields.uniqueKey?.stringValue).toBe(documentId(createdCard));
  await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(1);
});
