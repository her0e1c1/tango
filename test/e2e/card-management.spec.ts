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
      await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
      await expect
        .poll(async () => (await requireDocument("card", card.id)).fields.deletedAt?.integerValue)
        .not.toBeUndefined();
    });
  });

  test("CARD-MANAGEMENT-09 confirms before discarding an unsaved Card edit", async ({ fixture, page, namespace }) => {
    const { deck, card, unsavedFrontText } =
      await test.step("Given: A saved card ready for an unsaved front-text edit", async () => {
        const deck = fixture.deck();
        const card = fixture.card();
        const unsavedFrontText = `${namespace.caseId} unsaved front`;
        await fixture.apply(page);
        await page.goto(`/deck/${deck.id}`);
        return { deck, card, unsavedFrontText };
      });
    const { frontText, leaveTrigger } = await test.step("When: Edit the card and attempt to leave", async () => {
      await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      const frontText = page.getByRole("textbox", { name: "Front text" });
      await frontText.fill(unsavedFrontText);

      const leaveTrigger = page.getByRole("button", { name: "tango", exact: true });
      await leaveTrigger.click();
      return { frontText, leaveTrigger };
    });
    const { dialog, keepEditing, discardChanges } =
      await test.step("Then: The leave dialog initially focuses Keep editing", async () => {
        const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
        const keepEditing = dialog.getByRole("button", { name: "Keep editing" });
        const discardChanges = dialog.getByRole("button", { name: "Discard changes" });
        await expect(keepEditing).toBeFocused();
        return { dialog, keepEditing, discardChanges };
      });
    await test.step("When: Tab to Discard changes", async () => {
      await page.keyboard.press("Tab");
    });
    await test.step("Then: Discard changes receives focus", async () => {
      await expect(discardChanges).toBeFocused();
    });
    await test.step("When: Tab past the last dialog action", async () => {
      await page.keyboard.press("Tab");
    });
    await test.step("Then: Focus wraps to Keep editing", async () => {
      await expect(keepEditing).toBeFocused();
    });
    await test.step("When: Shift-Tab before the first dialog action", async () => {
      await page.keyboard.press("Shift+Tab");
    });
    await test.step("Then: Focus wraps to Discard changes", async () => {
      await expect(discardChanges).toBeFocused();
    });
    await test.step("When: Shift-Tab back to Keep editing", async () => {
      await page.keyboard.press("Shift+Tab");
    });
    await test.step("Then: Keep editing receives focus", async () => {
      await expect(keepEditing).toBeFocused();
    });
    await test.step("When: Dismiss the leave dialog with Escape", async () => {
      await page.keyboard.press("Escape");
    });
    await test.step("Then: The draft and editor route remain with focus restored", async () => {
      await expect(dialog).not.toBeVisible();
      await expect(page).toHaveURL(`/card/${card.id}/edit`);
      await expect(frontText).toHaveValue(unsavedFrontText);
      await expect(leaveTrigger).toBeFocused();
    });
    await test.step("When: Attempt to leave again and choose Keep editing", async () => {
      await leaveTrigger.click();
      await keepEditing.click();
    });
    await test.step("Then: The unsaved front text remains", async () => {
      await expect(frontText).toHaveValue(unsavedFrontText);
    });
    await test.step("When: Leave again and discard changes", async () => {
      await leaveTrigger.click();
      await discardChanges.click();
    });
    await test.step("Then: The original card stays saved on the deck list", async () => {
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
      await expect
        .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
        .toBe(card.frontText);
    });
  });

  test("CARD-MANAGEMENT-11 CARD-MANAGEMENT-24 confirms before discarding an unsaved Card create", async ({
    fixture,
    page,
    namespace,
  }) => {
    const { deck, unsavedFrontText } = await test.step("Given: A deck ready for a new card draft", async () => {
      const deck = fixture.deck();
      const unsavedFrontText = `${namespace.caseId} unsaved front`;
      await fixture.apply(page);
      await page.goto(`/deck/${deck.id}`);
      return { deck, unsavedFrontText };
    });
    await test.step("When: Open card creation and cancel without editing", async () => {
      await page.getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Add card" }).click();

      // Clean exit has no confirmation
      await page.getByRole("button", { name: "Cancel" }).click();
    });
    await test.step("Then: A clean form exits directly to the deck", async () => {
      await expect(page).toHaveURL(`/deck/${deck.id}`);
    });
    const { frontText, dialog } =
      await test.step("When: Create an unsaved draft, cancel and keep editing", async () => {
        // Dirty exit prompts confirmation
        await page.getByRole("button", { name: "Actions", exact: true }).click();
        await page.getByRole("menuitem", { name: "Add card" }).click();
        const frontText = page.getByRole("textbox", { name: "Front text" });
        await frontText.fill(unsavedFrontText);

        await page.getByRole("button", { name: "Cancel" }).click();
        const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
        await dialog.getByRole("button", { name: "Keep editing" }).click();
        return { frontText, dialog };
      });
    await test.step("Then: The card draft remains intact", async () => {
      await expect(frontText).toHaveValue(unsavedFrontText);
    });
    await test.step("When: Cancel again and discard the draft", async () => {
      await page.getByRole("button", { name: "Cancel" }).click();
      await dialog.getByRole("button", { name: "Discard changes" }).click();
    });
    await test.step("Then: The deck opens without an unsaved card", async () => {
      await expect(page).toHaveURL(`/deck/${deck.id}`);
      await expect(page.getByRole("button", { name: `View ${unsavedFrontText}` })).toHaveCount(0);
    });
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
    await page.reload();
    await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toBeVisible();
  };

  test("CARD-MANAGEMENT-12 waits for server acceptance before completing an unanswered leave dialog", async ({
    fixture,
    page,
    namespace,
  }) => {
    const { deck, frontText, write } =
      await test.step("Given: A card creation is waiting for server acceptance", async () => {
        const deck = fixture.deck();
        const frontText = `${namespace.caseId} pending front`;
        await fixture.apply(page);
        const write = await beginCardCreation(page, deck.id, frontText);
        return { deck, frontText, write };
      });
    try {
      await test.step("Given: The pending card form is still open", async () => {
        await expect(page).toHaveURL(`/deck/${deck.id}/card/new`);
      });
      const { dialog } = await test.step("When: Attempt to leave and choose Keep editing", async () => {
        await page.getByRole("button", { name: "tango", exact: true }).click();
        const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
        await dialog.getByRole("button", { name: "Keep editing" }).click();
        return { dialog };
      });
      await test.step("Then: The pending back text is preserved", async () => {
        await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Pending back");
      });
      await test.step("When: Attempt to leave again without answering the dialog", async () => {
        await page.getByRole("button", { name: "tango", exact: true }).click();
      });
      await test.step("Then: The leave dialog is still open", async () => {
        await expect(dialog).toBeVisible();
      });
      await test.step("When: Let the pending creation reach the server", async () => {
        write.release();
      });
      await test.step("Then: Creation completes and the saved card survives reload", async () => {
        await expectCreatedCard(page, deck.id, frontText);
      });
    } finally {
      write.release();
    }
  });

  test("CARD-MANAGEMENT-13 keeps a pending creation after explicitly leaving the form", async ({
    fixture,
    page,
    namespace,
  }) => {
    const { deck, frontText, write } =
      await test.step("Given: A card creation is waiting for server acceptance", async () => {
        const deck = fixture.deck();
        const frontText = `${namespace.caseId} background front`;
        await fixture.apply(page);
        const write = await beginCardCreation(page, deck.id, frontText);
        return { deck, frontText, write };
      });
    try {
      await test.step("When: Leave the pending form and confirm discarding the draft", async () => {
        await page.getByRole("button", { name: "tango", exact: true }).click();
        await page.getByRole("alertdialog").getByRole("button", { name: "Discard changes" }).click();
      });
      await test.step("Then: Navigation reaches the deck list", async () => {
        await expect(page).toHaveURL(/\/$/);
      });
      await test.step("When: Let the pending creation finish after navigation", async () => {
        write.release();
      });
      await test.step("Then: The card saves without redirecting or showing stale success feedback", async () => {
        await expect
          .poll(async () =>
            (await listDocuments("card")).some((item) => item.fields.frontText?.stringValue === frontText)
          )
          .toBe(true);
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByRole("status", { name: "Toast notifications" })).not.toContainText(
          `Created card “${frontText}”.`
        );
      });
      await test.step("When: Open the destination deck", async () => {
        await page.getByRole("button", { name: `Open cards in ${deck.name}`, exact: true }).click();
      });
      await test.step("Then: The saved card is available there", async () => {
        await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toBeVisible();
      });
      await test.step("When: Reload the destination deck", async () => {
        await page.reload();
      });
      await test.step("Then: The card appears exactly once", async () => {
        await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(1);
      });
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
    const { deck, frontText, fault, write } =
      await test.step("Given: A pending card creation whose write will be rejected", async () => {
        const deck = fixture.deck();
        const frontText = `${namespace.caseId} rejected front`;
        await fixture.apply(page);
        const fault = await failNextFirestoreWrite(page, { collection: "card" });
        allowExpectedFirestoreWriteFailure(browserErrors);
        const write = await beginCardCreation(page, deck.id, frontText);
        return { deck, frontText, fault, write };
      });
    try {
      await test.step("When: Attempt to leave the pending form", async () => {
        await page.getByRole("button", { name: "tango", exact: true }).click();
      });
      const { dialog } = await test.step("Then: The leave dialog is shown", async () => {
        const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
        await expect(dialog).toBeVisible();
        return { dialog };
      });
      await test.step("When: Release the write and let the rejection settle", async () => {
        write.release();
        await fault.waitForFailure();
        await fault.dispose();
      });
      await test.step("Then: The failure message leaves the dialog open", async () => {
        await expect(page.getByRole("alert")).toContainText("Unable to create this card. Try again.");
        await expect(dialog).toBeVisible();
      });
      await test.step("When: Choose Keep editing after the rejection", async () => {
        await dialog.getByRole("button", { name: "Keep editing" }).click();
      });
      await test.step("Then: The back-text draft remains intact", async () => {
        await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("Pending back");
      });
      await test.step("When: Switch to the front-text editor", async () => {
        await page.getByRole("tab", { name: "Front", exact: true }).click();
      });
      await test.step("Then: The front-text draft remains intact", async () => {
        await expect(page.getByRole("textbox", { name: "Front text" })).toHaveValue(frontText);
      });
      await test.step("When: Retry creating the card", async () => {
        await page.getByRole("button", { name: "Create card", exact: true }).click();
      });
      await test.step("Then: The saved card is created and restored after reload", async () => {
        await expectCreatedCard(page, deck.id, frontText);
      });
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

  test("CARD-MANAGEMENT-01 CARD-MANAGEMENT-17 CARD-MANAGEMENT-18 persists edited front, back, and tags across reload", async ({
    fixture,
    page,
    namespace,
  }) => {
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
    await test.step("When: Edit the front and expanded back text", async () => {
      await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      await page.getByRole("textbox", { name: "Front text" }).fill(changed.frontText);
      await page.getByRole("tab", { name: "Back", exact: true }).click();
      await page.getByRole("button", { name: "Expand Back" }).click();
      const expandedEditor = page.getByRole("dialog", { name: "Back text" });
      await expandedEditor.getByRole("textbox", { name: "Back text" }).fill(changed.backText);
      await expandedEditor.getByRole("button", { name: "Done" }).click();
    });
    await test.step("Then: Closing the expanded editor restores its trigger focus", async () => {
      await expect(page.getByRole("button", { name: "Expand Back" })).toBeFocused();
    });
    await test.step("When: Open the tag editor", async () => {
      await page.getByRole("button", { name: "Edit tags" }).click();
    });
    await test.step("Then: Tags from other decks are unavailable", async () => {
      await expect(page.getByRole("checkbox", { name: "python" })).toHaveCount(0);
    });
    await test.step("When: Change tags and save the card", async () => {
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
      await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
      await expect
        .poll(async () => (await requireDocument("card", card.id)).fields.deletedAt?.integerValue)
        .not.toBeUndefined();
    });
  });

  test("CARD-MANAGEMENT-03 cancels deletion, restores focus, and preserves persistent data", async ({
    fixture,
    page,
  }) => {
    const { card, before, trigger, dialog } =
      await test.step("Given: A saved card deletion dialog describing the irreversible action", async () => {
        const deck = fixture.deck();
        const card = fixture.card();
        await fixture.apply(page);
        const before = await requireDocument("card", card.id);

        await page.goto(`/deck/${deck.id}`);
        const trigger = page.getByRole("button", { name: `Open actions for ${card.frontText}` });
        const dialog = await openCardDeleteDialog(page, card.frontText);
        await expect(dialog).toContainText(card.frontText);
        await expect(dialog).toContainText("cannot be undone");
        return { card, before, trigger, dialog };
      });
    await test.step("When: Cancel card deletion", async () => {
      await dialog.getByRole("button", { name: "Cancel" }).click();
    });
    await test.step("Then: Focus returns and saved card data is unchanged", async () => {
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      expect(await requireDocument("card", card.id)).toEqual(before);
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
      await expect(page.getByRole("button", { name: "Close card" })).toContainText(changedBack);

      const after = await requireDocument("card", card.id);
      const { frontText: _front, backText: _back, updatedAt: _updatedAt, ...preservedFields } = before.fields;
      expect(after.fields).toMatchObject(preservedFields);
      expect(documentId(after)).toBe(card.id);
    });
  });

  test("CARD-MANAGEMENT-05 CARD-MANAGEMENT-22 creates one remote Card and keeps it across reload", async ({
    fixture,
    page,
    namespace,
  }) => {
    const { deck, frontText, backText, viewport, viewportBounds } =
      await test.step("Given: A remote deck in a narrow viewport ready for card creation", async () => {
        const deck = fixture.deck();
        const frontText = `${namespace.caseId} remote front`;
        const backText = `${namespace.caseId} remote back`;
        const viewport = { width: 390, height: 844 };
        const viewportBounds = { x: 0, y: 0, ...viewport };

        await page.setViewportSize(viewport);
        await fixture.apply(page);

        await page.goto(`/deck/${deck.id}`);
        return { deck, frontText, backText, viewport, viewportBounds };
      });
    await test.step("When: Open card creation", async () => {
      await page.getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Add card" }).click();
    });
    await test.step("Then: The deck-specific card creation route is active", async () => {
      await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
    });
    for (const { side, value } of [
      { side: "Front", value: frontText },
      { side: "Back", value: backText },
    ]) {
      await test.step("When: Expand the current card side editor", async () => {
        await page.getByRole("tab", { name: side, exact: true }).click();
        await page.getByRole("button", { name: `Expand ${side}` }).click();
      });
      const { editor } = await test.step("Then: The editor and backdrop fill the viewport", async () => {
        const editor = page.getByRole("dialog", { name: `${side} text` });
        await expect(editor).toBeVisible();
        expect(await editor.boundingBox()).toEqual(viewportBounds);
        expect(await page.getByTestId("card-fields-backdrop").boundingBox()).toEqual(viewportBounds);
        return { editor };
      });
      await test.step("When: Enter the side text and close the expanded editor", async () => {
        await editor.getByRole("textbox", { name: `${side} text` }).fill(value);
        await editor.getByRole("button", { name: "Done" }).click();
      });
      await test.step("Then: The side draft is preserved in the form", async () => {
        await expect(page.getByRole("textbox", { name: `${side} text` })).toHaveValue(value);
      });
    }
    await test.step("When: Open tag selection", async () => {
      await page.getByRole("button", { name: "Edit tags" }).click();
    });
    const { tagsDialog } =
      await test.step("Then: Tag selection fits the viewport and excludes other-deck tags", async () => {
        const tagsDialog = page.getByRole("dialog", { name: "Select tags" });
        await expect(tagsDialog).toBeVisible();
        expect(await page.getByTestId("card-fields-backdrop").boundingBox()).toEqual(viewportBounds);
        const tagsBounds = await tagsDialog.boundingBox();
        if (tagsBounds === null) throw new Error("Tag selection dialog bounding box is unavailable");
        expect(tagsBounds.y + tagsBounds.height).toBe(viewport.height);
        await expect(tagsDialog.getByRole("checkbox", { name: "python" })).toHaveCount(0);
        return { tagsDialog };
      });
    await test.step("When: Add tags and double-click Create card", async () => {
      await toggleTag(page, "chapter-1");
      await tagsDialog.getByRole("button", { name: "Add tag" }).click();
      await tagsDialog.getByRole("textbox", { name: "Tag name 2", exact: true }).fill(" new tag ");
      await tagsDialog.getByRole("button", { name: "Close tag editor" }).click();
      await page.getByRole("button", { name: "Create card" }).dblclick();
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
      expect(createdCard.fields.deckId?.stringValue).toBe(deck.id);
      expect(createdCard.fields.uid?.stringValue).toBe(deck.uid);
      expect(createdCard.fields.uniqueKey?.stringValue).toBe(documentId(createdCard));
      await expect(page.getByRole("button", { name: `View ${frontText}`, exact: true })).toHaveCount(1);
    });
  });

  test("CARD-MANAGEMENT-06 creates one local Card and keeps it across reload", async ({ fixture, page, namespace }) => {
    const { frontText, backText, deck } =
      await test.step("Given: An anonymous deck in a narrow viewport ready for card creation", async () => {
        const frontText =
          `${namespace.caseId} local front. ${"This paragraph explains a useful idea with enough detail to study later. ".repeat(26)}`.slice(
            0,
            1748
          );
        const backText = `${namespace.caseId} local back`;

        await page.setViewportSize({ width: 360, height: 640 });
        await fixture.apply(page);
        const local = await createAnonymousDeck(page);
        const { deck } = local;

        await page.goto(`/deck/${deck.id}`);
        return { frontText, backText, deck };
      });
    await test.step("When: Open card creation", async () => {
      await page.getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Add card" }).click();
    });
    await test.step("Then: The deck-specific card creation route is active", async () => {
      await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
    });
    await test.step("When: Enter both sides and create the local card", async () => {
      await page.getByRole("textbox", { name: "Front text" }).fill(frontText);
      await page.getByRole("tab", { name: "Back", exact: true }).click();
      await page.getByRole("textbox", { name: "Back text" }).fill(backText);
      await page.getByRole("button", { name: "Create card" }).click();
    });
    const { dismiss } = await test.step("Then: Creation feedback remains readable inside the viewport", async () => {
      await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
      await expect(page.getByRole("status").filter({ hasText: `Created card “${frontText}”.` })).toBeVisible();
      const dismiss = page.getByRole("button", { name: "Dismiss notification" });
      const toast = dismiss.locator("..");
      const message = toast.getByText(`Created card “${frontText}”.`, { exact: true });
      for (const target of [toast, message, dismiss]) {
        const box = await target.boundingBox();
        if (box === null) throw new Error("Toast content has no rendered bounds");
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(360);
        expect(box.y + box.height).toBeLessThanOrEqual(640);
      }
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
      expect(preview.height).toBeLessThanOrEqual(preview.lineHeight * 3);
      expect(preview.prefixTop).toBeGreaterThanOrEqual(preview.top);
      expect(preview.prefixBottom).toBeLessThanOrEqual(preview.bottom);
      return { dismiss };
    });
    await test.step("When: Focus the notification dismiss control using the keyboard", async () => {
      await dismiss.click({ trial: true });
      await dismiss.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
    });
    await test.step("Then: Its focus indicator remains visible", async () => {
      await expect(dismiss).toBeFocused();
      expect(await dismiss.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
      await expect(dismiss).not.toHaveCSS("box-shadow", "none");
    });
    await test.step("When: Dismiss the notification with Enter", async () => {
      await page.keyboard.press("Enter");
    });
    await test.step("Then: The notification disappears and focus returns to main content", async () => {
      await expect(dismiss).toHaveCount(0);
      await expect(page.getByRole("main")).toBeFocused();
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

  test("CARD-MANAGEMENT-10 reveals the first invalid side without saving empty text", async ({ fixture, page }) => {
    const { card, before } = await test.step("Given: A saved card ready to validate empty text", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      await fixture.apply(page);
      const before = await requireDocument("card", card.id);
      await page.goto(`/deck/${deck.id}`);
      return { card, before };
    });
    await test.step("When: Clear both sides and submit the card edit", async () => {
      await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      await page.getByRole("textbox", { name: "Front text" }).fill("");
      await page.getByRole("tab", { name: "Back", exact: true }).click();
      await page.getByRole("textbox", { name: "Back text" }).fill("");
      await page.getByRole("button", { name: "Save changes" }).click();
    });
    await test.step("Then: Both invalid sides are indicated and the first invalid field is focused", async () => {
      const frontTab = page.getByRole("tab", { name: "Front", exact: true });
      const backTab = page.getByRole("tab", { name: "Back", exact: true });
      await expect(frontTab).toHaveAttribute("aria-selected", "true");
      await expect(frontTab.getByText("●", { exact: true })).toBeVisible();
      await expect(backTab.getByText("●", { exact: true })).toBeVisible();
      await expect(frontTab).toHaveAccessibleDescription("Front text is required.");
      await expect(backTab).toHaveAccessibleDescription("Back text is required.");
      await expect(page.getByRole("textbox", { name: "Front text" })).toBeFocused();
      await expect(page.getByText("Front text is required.")).toBeVisible();
    });
    await test.step("When: Switch to the invalid back-text side", async () => {
      await page.getByRole("tab", { name: "Back", exact: true }).click();
    });
    await test.step("Then: The back-text validation error is visible", async () => {
      await expect(page.getByText("Back text is required.")).toBeVisible();
    });
    await test.step("When: Expand the invalid back-text editor", async () => {
      await page.getByRole("button", { name: "Expand Back" }).click();
    });
    const { expandedEditor } =
      await test.step("Then: The expanded field exposes the same validation error", async () => {
        const expandedEditor = page.getByRole("dialog", { name: "Back text" });
        await expect(expandedEditor.getByRole("textbox", { name: "Back text" })).toHaveAttribute(
          "aria-invalid",
          "true"
        );
        await expect(expandedEditor.getByRole("textbox", { name: "Back text" })).toHaveAccessibleDescription(
          "Back text is required."
        );
        await expect(expandedEditor.getByText("Back text is required.")).toBeVisible();
        return { expandedEditor };
      });
    await test.step("When: Close the expanded editor", async () => {
      await expandedEditor.getByRole("button", { name: "Done" }).click();
    });
    await test.step("Then: The empty draft remains without changing the saved card", async () => {
      await expect(page.getByRole("textbox", { name: "Back text" })).toHaveValue("");
      expect(await requireDocument("card", card.id)).toEqual(before);
    });
  });

  test("CARD-MANAGEMENT-15 previews an unsaved answer while creating an incomplete Card", async ({ fixture, page }) => {
    const { deck, before } =
      await test.step("Given: An anonymous deck and mobile viewport ready for a new card", async () => {
        await fixture.apply(page);
        const local = await createAnonymousDeck(page);
        const { deck } = local;

        await page.setViewportSize({ width: 375, height: 812 });
        const before = await downloadDeckCards(page, deck.name);
        return { deck, before };
      });
    await test.step("When: Open card creation", async () => {
      await page.goto(`/deck/${deck.id}/card/new`);
    });
    const { url } = await test.step("Then: The incomplete card creation form is visible", async () => {
      await expect(page.getByRole("heading", { name: "Create card" })).toBeVisible();
      const url = page.url();
      return { url };
    });
    const { input, trigger } =
      await test.step("When: Enter multiline back text and open its preview with Enter", async () => {
        await page.getByRole("tab", { name: "Back", exact: true }).click();
        const input = page.getByRole("textbox", { name: "Back text" });
        await input.fill("First line\nSecond line");
        const trigger = page.getByRole("button", { name: "Preview answer" });
        await trigger.focus();
        await page.keyboard.press("Enter");
        return { input, trigger };
      });
    const { preview } = await test.step("Then: The preview preserves both text lines", async () => {
      const preview = page.getByRole("region", { name: "Answer preview" });
      await expect(preview.locator("pre")).toHaveText("First line\nSecond line");
      return { preview };
    });
    await test.step("When: Close the preview with Enter", async () => {
      await page.keyboard.press("Enter");
    });
    await test.step("Then: Focus returns to the preview trigger", async () => {
      await expect(preview).toBeHidden();
      await expect(trigger).toBeFocused();
    });
    await test.step("When: Type text, open and close preview, then undo", async () => {
      // Native undo must survive opening and closing the preview.
      await input.fill("");
      await input.press("x");
      await trigger.click();
      await page.getByRole("button", { name: "Hide preview" }).click();
      await input.focus();
      await input.press("ControlOrMeta+z");
    });
    await test.step("Then: Native undo restores the empty draft", async () => {
      await expect(input).toHaveValue("");
    });
    await test.step("When: Preview a draft containing Markdown, math and a table", async () => {
      await input.fill("**Draft answer**\n\n$x^2$\n\n| A | B |\n| - | - |\n| 1 | 2 |");
      await page.getByRole("button", { name: "Edit tags" }).click();
      await toggleTag(page, "math");
      await page.getByRole("button", { name: "Close tag editor" }).click();
      await trigger.click();
    });
    await test.step("Then: All requested answer formats render in the preview", async () => {
      await expect(preview.locator("strong")).toHaveText("Draft answer");
      await expect(preview.locator(".katex")).toBeVisible();
      await expect(preview.getByRole("table")).toBeVisible();
    });
    const { dialog } = await test.step("When: Expand the editor and preview a changed draft", async () => {
      await page.getByRole("button", { name: "Expand Back" }).click();
      const dialog = page.getByRole("dialog", { name: "Back text" });
      await dialog.getByRole("textbox").fill("**Expanded draft**\n\n$y^2$");
      await dialog.getByRole("button", { name: "Preview answer" }).press("Enter");
      return { dialog };
    });
    await test.step("Then: The expanded draft is rendered", async () => {
      await expect(dialog.getByRole("region").locator("strong")).toHaveText("Expanded draft");
    });
    await test.step("When: Close the expanded editor with Escape", async () => {
      await page.keyboard.press("Escape");
    });
    await test.step("Then: The draft and preview stay in sync without saving or navigating", async () => {
      await expect(input).toHaveValue("**Expanded draft**\n\n$y^2$");
      await expect(preview.locator("strong")).toHaveText("Expanded draft");
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page).toHaveURL(url);
    });
    await test.step("When: Reload the creation page", async () => {
      await page.reload();
    });
    await test.step("Then: The deck still contains only its saved cards", async () => {
      expect(await downloadDeckCards(page, deck.name)).toEqual(before);
    });
  });

  test("CARD-MANAGEMENT-16 previews current answer tags without saving the edited Card", async ({ fixture, page }) => {
    const { deck, before, url } =
      await test.step("Given: A saved anonymous card ready for an unsaved preview", async () => {
        await fixture.apply(page);
        const local = await createAnonymousDeck(page);
        const { deck, first: card } = local;

        const before = await downloadDeckCards(page, deck.name);
        await page.goto(`/card/${card.id}/edit`);
        await expect(page.getByRole("heading", { name: "Edit card" })).toBeVisible();
        const url = page.url();
        return { deck, before, url };
      });
    const { input } = await test.step("When: Enter code, select TypeScript and open its preview", async () => {
      await page.getByRole("tab", { name: "Back", exact: true }).click();
      const input = page.getByRole("textbox", { name: "Back text" });
      await input.fill("const answer = 42;");
      await page.getByRole("button", { name: "Edit tags" }).click();
      await toggleTag(page, "typescript");
      await page.getByRole("button", { name: "Close tag editor" }).click();
      await page.getByRole("button", { name: "Preview answer" }).click();
      return { input };
    });
    const { preview } = await test.step("Then: Syntax highlighting follows the current tag and theme", async () => {
      const preview = page.getByRole("region", { name: "Answer preview" });
      await expect(preview.locator("code")).toHaveAttribute("data-language", "typescript");
      await expect(preview.locator(".hljs-keyword")).toHaveText("const");
      const dark = await page.locator("html").evaluate((element) => element.classList.contains("dark"));
      await expect(preview.locator("code")).toHaveAttribute("data-theme", dark ? "dark" : "light");
      return { preview };
    });
    await test.step("When: Change the draft language to Markdown source", async () => {
      await page.getByRole("button", { name: "Edit tags" }).click();
      await toggleTag(page, "typescript");
      await toggleTag(page, "md");
      await page.getByRole("button", { name: "Close tag editor" }).click();
      await input.fill("**Markdown source** $x^2$");
    });
    await test.step("Then: Markdown source remains code without math rendering", async () => {
      await expect(preview.locator("code")).toHaveAttribute("data-language", "md");
      await expect(preview.locator(".katex")).toHaveCount(0);
    });
    await test.step("When: Change the draft language to Python", async () => {
      await page.getByRole("button", { name: "Edit tags" }).click();
      await toggleTag(page, "md");
      await toggleTag(page, "python");
      await page.getByRole("button", { name: "Close tag editor" }).click();
      await input.fill("def draft():\n    return 42");
    });
    await test.step("Then: Python highlighting follows the new draft", async () => {
      await expect(preview.locator("code")).toHaveAttribute("data-language", "python");
      await expect(preview.locator(".hljs-title")).toHaveText("draft");
    });
    const { dialog, expandedInput } =
      await test.step("When: Expand the editor, toggle preview and undo typed text", async () => {
        await page.getByRole("button", { name: "Expand Back" }).click();
        const dialog = page.getByRole("dialog", { name: "Back text" });
        const expandedInput = dialog.getByRole("textbox");
        await expandedInput.fill("");
        await expandedInput.press("x");
        await dialog.getByRole("button", { name: "Preview answer" }).press("Enter");
        await dialog.getByRole("button", { name: "Hide preview" }).press("Enter");
        await expandedInput.focus();
        await expandedInput.press("ControlOrMeta+z");
        return { dialog, expandedInput };
      });
    await test.step("Then: Expanded preview preserves native undo", async () => {
      await expect(expandedInput).toHaveValue("");
    });
    await test.step("When: Enter updated Python and reopen the expanded preview", async () => {
      await expandedInput.fill("def updated():\n    return 43");
      await dialog.getByRole("button", { name: "Preview answer" }).press("Enter");
    });
    await test.step("Then: The updated function name is highlighted", async () => {
      await expect(dialog.getByRole("region").locator(".hljs-title")).toHaveText("updated");
    });
    await test.step("When: Close the expanded editor with Escape", async () => {
      await page.keyboard.press("Escape");
    });
    await test.step("Then: The inline input and preview retain the updated draft", async () => {
      await expect(input).toHaveValue("def updated():\n    return 43");
      await expect(preview.locator(".hljs-title")).toHaveText("updated");
      await expect(page).toHaveURL(url);
    });
    await test.step("When: Attempt to leave the unsaved card editor", async () => {
      await page.getByRole("button", { name: "tango" }).click();
    });
    await test.step("Then: The unsaved-changes dialog appears", async () => {
      await expect(page.getByRole("alertdialog")).toBeVisible();
    });
    await test.step("When: Choose Keep editing", async () => {
      await page.getByRole("button", { name: "Keep editing" }).click();
    });
    await test.step("Then: The updated draft remains intact", async () => {
      await expect(input).toHaveValue("def updated():\n    return 43");
    });
    await test.step("When: Reload the card editor", async () => {
      await page.reload();
    });
    await test.step("Then: The saved card data is unchanged", async () => {
      expect(await downloadDeckCards(page, deck.name)).toEqual(before);
    });
  });
});

test("CARD-MANAGEMENT-07 retries a rejected remote Card create with a new ID and no duplicate", async ({
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

  let attemptedCardId: string | undefined;
  const { fault } = await test.step("When: Record the attempted card ID and reject its creation write", async () => {
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
    return { fault };
  });
  await test.step("Then: The injected creation rejection completes", async () => {
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
  });
  await test.step("When: Remove the injected fault", async () => {
    await fault.dispose();
  });
  await test.step("Then: The failed creation had an identifiable attempted card ID", async () => {
    expect(attemptedCardId).toBeDefined();
  });
  await test.step("When: Retry creating the card from a fresh form", async () => {
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
  await test.step("Then: Exactly one card is saved with a new ID and the requested contents", async () => {
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
});
