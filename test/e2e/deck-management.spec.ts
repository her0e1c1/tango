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
  const name = `${namespace.caseId} local deck`;
  const category = "typescript";
  await fixture.apply(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("menuitem", { name: "Create deck" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("combobox").selectOption(category);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
  await expect(page.getByRole("status").filter({ hasText: `Created deck “${name}”.` })).toBeVisible();
  const deckId = new URL(page.url()).pathname.split("/").at(-1);
  if (deckId === undefined) throw new Error("Created local-only Deck ID is missing");
  await expect(page.getByText("0 cards")).toBeVisible();

  await page.goto("/");
  await page.reload();

  const deckArticle = page.getByRole("button", { name: `Open cards in ${name}` }).locator("xpath=ancestor::article[1]");
  await expect(deckArticle).toContainText("0 cards");
  await expect(page.getByRole("button", { name: `Open cards in ${name}`, exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: `Open cards in ${name}`, exact: true }).click();
  await expect(page.getByText("0 cards", { exact: true })).toBeVisible();
  expect(
    (await listDocuments("deck")).filter(
      (document) =>
        (document.fields.name as { stringValue?: string } | undefined)?.stringValue === name ||
        documentId(document) === deckId
    )
  ).toEqual([]);
});

const openDeckDeleteDialog = async (page: Page, deckName: string) => {
  await page.getByRole("button", { name: `Open actions for ${deckName}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  return page.getByRole("alertdialog", { name: "Delete deck?" });
};

// Click the visible Switch label because the Firebase emulator banner can intercept pointer events on its sr-only input.
const clickCheckboxLabel = async (page: Page, name: string) => {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await checkbox.locator("xpath=parent::label").click();
  return checkbox;
};

test("DECK-MANAGEMENT-01 persists edited name, category, and source URL across reload", async ({
  fixture,
  page,
  namespace,
}) => {
  const deck = fixture.deck();
  await fixture.apply(page);
  const updatedName = `${namespace.caseId} updated`;
  const updatedSourceUrl = "https://example.com/updated-deck.csv";

  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(updatedName);
  await page.getByRole("combobox").selectOption("typescript");
  await page.getByText("More settings").click();
  await page.getByRole("textbox", { name: "Source URL" }).fill(updatedSourceUrl);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: `Updated deck “${updatedName}”.` })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: `Open actions for ${updatedName}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(updatedName);
  await expect(page.getByRole("combobox")).toHaveValue("typescript");
  await page.getByText("More settings").click();
  await expect(page.getByRole("textbox", { name: "Source URL" })).toHaveValue(updatedSourceUrl);
});

test("DECK-MANAGEMENT-02 deletes one Deck and preserves unrelated Deck data", async ({ fixture, page }) => {
  const deck = fixture.deck("deck-a");
  const otherDeck = fixture.deck("deck-b");
  const otherCards = fixture.state.remote.cards.filter((card) => card.deckId === otherDeck.id);
  const otherSession = fixture.session("deck-b");
  await fixture.apply(page);
  await page.goto("/");

  const dialog = await openDeckDeleteDialog(page, deck.name);
  await dialog.getByRole("button", { name: "Delete deck" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: `Deleted deck “${deck.name}”.` })).toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
  await expect
    .poll(async () => Number((await requireDocument("deck", deck.id)).fields.deletedAt?.integerValue ?? 0))
    .toBeGreaterThan(0);
  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("heading", { name: "Deck not found" })).toBeVisible();
  await page.goto("/");

  expect(await getDocument("deck", otherDeck.id)).toBeDefined();
  expect((await Promise.all(otherCards.map((card) => getDocument("card", card.id)))).every(Boolean)).toBe(true);
  expect(await readSession(fixture.user().uid, otherDeck.id)).toEqual(otherSession);
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
  await expect(page.getByRole("button", { name: `Open cards in ${otherDeck.name}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `Continue ${otherDeck.name}` })).toBeVisible();
});

test("DECK-MANAGEMENT-03 cancels Deck deletion and preserves all related data", async ({ fixture, page }) => {
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
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await getDocument("deck", deck.id)).toBeDefined();
  expect((await Promise.all(cards.map((card) => getDocument("card", card.id)))).every(Boolean)).toBe(true);
  expect(await readSession(fixture.user().uid, deck.id)).toEqual(session);
});

test("DECK-MANAGEMENT-04 retries the same Deck deletion after a handled failure", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const deck = fixture.deck();
  const failureMessage = "A data save or sync failed. Check your connection and reload to review the saved data.";
  await fixture.apply(page);
  await page.goto("/");
  const fault = await failNextFirestoreWrite(page, { collection: "deck", id: deck.id });
  allowExpectedFirestoreWriteFailure(browserErrors);

  const dialog = await openDeckDeleteDialog(page, deck.name);
  await dialog.getByRole("button", { name: "Delete deck" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("alert")).toContainText(failureMessage);
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  const retryDialog = await openDeckDeleteDialog(page, deck.name);
  await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 480 });
  const retry = retryDialog.getByRole("button", { name: "Delete deck" });
  const retryBounds = await retry.boundingBox();
  if (retryBounds === null) throw new Error("Could not measure the Deck deletion retry control");
  const failureToast = page.getByText(failureMessage, { exact: true });
  // Force an overlap so the browser proves a visual-only Toast cannot intercept the modal action.
  await failureToast.evaluate((message, bounds) => {
    const toast = message.parentElement;
    if (!(toast instanceof HTMLElement)) throw new Error("Could not locate the visual Toast");
    Object.assign(toast.style, {
      position: "fixed",
      left: `${String(bounds.x)}px`,
      top: `${String(bounds.y)}px`,
      width: `${String(bounds.width)}px`,
      height: `${String(bounds.height)}px`,
      zIndex: "100",
    });
  }, retryBounds);
  await retry.click();

  // Firestore reopens its write stream after the injected non-retryable error before accepting this retry.
  await expect(retryDialog).not.toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: `Deleted deck “${deck.name}”.` })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toHaveCount(0);
  await expect
    .poll(async () => Number((await requireDocument("deck", deck.id)).fields.deletedAt?.integerValue ?? 0))
    .toBeGreaterThan(0);
  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("heading", { name: "Deck not found" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
});

test("DECK-MANAGEMENT-05 creates one empty remote Deck without a local duplicate", async ({
  fixture,
  page,
  namespace,
}) => {
  const name = `${namespace.caseId} created`;
  const category = "typescript";
  const sourceUrl = "https://example.com/created-deck.csv";
  const { uid } = fixture.user();
  await fixture.apply(page, { auth: { linked: true } });

  await page.goto("/");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("menuitem", { name: "Create deck" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("combobox").selectOption(category);
  await page.getByText("More settings").click();
  await page.getByRole("textbox", { name: "Source URL" }).fill(sourceUrl);
  await clickCheckboxLabel(page, "Convert line breaks");
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
  await expect(page.getByRole("status").filter({ hasText: `Created deck “${name}”.` })).toBeVisible();
  const deckId = new URL(page.url()).pathname.split("/").at(-1);
  if (deckId === undefined) throw new Error("Created Deck ID is missing");
  await expect(page.getByText("0 cards")).toBeVisible();

  await page.goto("/");
  await page.reload();

  const deckArticle = page.getByRole("button", { name: `Open cards in ${name}` }).locator("xpath=ancestor::article[1]");
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
  expect(owned.map(({ fields }) => fields.url?.stringValue)).toEqual([sourceUrl]);
  expect(owned.map(({ fields }) => fields.convertToBr?.booleanValue)).toEqual([true]);
  const ownedCardsForDeck = (await listDocuments("card")).filter(
    ({ fields }) => fields.uid?.stringValue === uid && fields.deckId?.stringValue === deckId
  );
  expect(ownedCardsForDeck).toEqual([]);
  await expect(page.getByRole("button", { name: `Open cards in ${name}`, exact: true })).toHaveCount(1);
});

test("DECK-MANAGEMENT-06 reports a failed remote create without locking the form", async ({
  fixture,
  page,
  browserErrors,
  namespace,
}) => {
  const name = `${namespace.caseId} failed deck`;
  const category = "typescript";
  const sourceUrl = "https://example.com/failed.csv";
  const { uid } = fixture.user();
  await fixture.apply(page, { auth: { linked: true } });
  await page.goto("/");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("menuitem", { name: "Create deck" }).click();
  const fault = await failNextFirestoreWrite(page, { collection: "deck" });
  allowExpectedFirestoreWriteFailure(browserErrors);
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("combobox").selectOption(category);
  await page.getByText("More settings").click();
  await page.getByRole("textbox", { name: "Source URL" }).fill(sourceUrl);
  await clickCheckboxLabel(page, "Convert line breaks");
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await expect(page.getByRole("alert")).toContainText("A data save or sync failed.");
  await fault.dispose();

  const remote = await listDocuments("deck");
  const owned = remote.filter(
    ({ fields }) =>
      fields.uid?.stringValue === uid && (fields.name as { stringValue?: string } | undefined)?.stringValue === name
  );
  expect(owned).toEqual([]);
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open cards in ${name}`, exact: true })).toHaveCount(0);
});

test("DECK-MANAGEMENT-08 confirms before discarding an unsaved Deck edit", async ({ fixture, page, namespace }) => {
  const deck = fixture.deck();
  const unsavedName = `${namespace.caseId} unsaved`;
  await fixture.apply(page);
  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const name = page.getByRole("textbox", { name: "Name" });
  await name.fill(unsavedName);

  await page.getByRole("button", { name: "tango" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(name).toHaveValue(unsavedName);
  await page.getByRole("button", { name: "tango" }).click();
  await dialog.getByRole("button", { name: "Discard changes" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
});
