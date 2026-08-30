import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import {
  allowExpectedFirestoreWriteFailure,
  documentId,
  expect,
  failNextFirestoreWrite,
  getDocument,
  listDocuments,
  readLocalData,
  test,
} from "./fixtures";

const openDeckDeleteDialog = async (page: Page, deckName: string) => {
  await page.getByRole("button", { name: `Open actions for ${deckName}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  return page.getByRole("alertdialog", { name: "Delete deck?" });
};

const clickCheckboxLabel = async (page: Page, name: string) => {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await checkbox.locator("xpath=parent::label").click();
  return checkbox;
};

test("DECK-01 navigates from the Deck list to its Card list", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);

  await page.goto("/");
  await page.getByRole("button", { name: `View ${deck.name}` }).click();

  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByText(card.frontText)).toBeVisible();
});

test("DECK-02 persists edited name and category across reload", async ({ fixture, page, namespace }) => {
  const deck = fixture.deck();
  await fixture.apply(page);
  const updatedName = `${namespace.caseId} updated`;

  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(updatedName);
  await page.getByRole("combobox").selectOption("typescript");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: `Updated deck “${updatedName}”.` })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: `Open actions for ${updatedName}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(updatedName);
  await expect(page.getByRole("combobox")).toHaveValue("typescript");
});

test("DECK-03 deletes a Deck, all Cards, and its resumable session", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const { cards } = fixture.state.remote;
  await fixture.apply(page);
  await page.goto("/");

  const dialog = await openDeckDeleteDialog(page, deck.name);
  await dialog.getByRole("button", { name: "Delete deck" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: `Deleted deck “${deck.name}”.` })).toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: `View ${deck.name}` })).toHaveCount(0);
  await expect.poll(() => getDocument("deck", deck.id)).toBeUndefined();
  await Promise.all(cards.map((card) => expect.poll(() => getDocument("card", card.id)).toBeUndefined()));
  expect((await readLocalData(page)).sessionsByDeckId).not.toHaveProperty(deck.id);
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
});

test("DECK-04 cancels Deck deletion and preserves all related data", async ({ fixture, page }) => {
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
  expect((await readLocalData(page)).sessionsByDeckId).toHaveProperty(deck.id, session);
});

test("DECK-05 retries the same Deck deletion after a handled failure", async ({ fixture, page, browserErrors }) => {
  const deck = fixture.deck();
  const { cards } = fixture.state.remote;
  const card = fixture.card();
  await fixture.apply(page);
  await page.goto("/");
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
  allowExpectedFirestoreWriteFailure(browserErrors);

  const dialog = await openDeckDeleteDialog(page, deck.name);
  await dialog.getByRole("button", { name: "Delete deck" }).click();
  await expect(dialog.getByText("Unable to delete this deck. Check your connection and try again.")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "Unable to delete this deck. Check your connection and try again."
  );
  await expect(dialog).toBeVisible();
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  await dialog.getByRole("button", { name: "Delete deck" }).click();

  // Firestore reopens its write stream after the injected non-retryable error before accepting this retry.
  await expect(dialog).not.toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: `Deleted deck “${deck.name}”.` })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${deck.name}` })).toHaveCount(0);
  await expect.poll(() => getDocument("deck", deck.id)).toBeUndefined();
  await Promise.all(cards.map((candidate) => expect.poll(() => getDocument("card", candidate.id)).toBeUndefined()));
  expect((await readLocalData(page)).sessionsByDeckId).not.toHaveProperty(deck.id);
});

test("DECK-06 recovers home from a missing Deck route", async ({ fixture, page, namespace }) => {
  await fixture.apply(page);

  await page.goto(`/deck/${namespace.id("missing")}`);
  await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
});

test("DECK-07 migrates a local-only Deck and every Card to remote storage", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const { localCards: cards } = fixture.state.browser;
  await fixture.apply(page);

  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const localOnly = await clickCheckboxLabel(page, "Local only");
  await expect(localOnly).not.toBeChecked();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: `Updated deck “${deck.name}”.` })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: `View ${deck.name}` }).click();

  await Promise.all(cards.map((card) => expect(page.getByText(String(card.frontText))).toBeVisible()));
  expect(await getDocument("deck", deck.id)).toBeDefined();
  const remoteCards = await Promise.all(cards.map((card) => getDocument("card", String(card.id))));
  expect(remoteCards.every((card) => card !== undefined)).toBe(true);
  expect(await readLocalData(page)).toEqual({ decks: [], cards: [], sessionsByDeckId: {} });
});

test("DECK-08 downloads every Card field as one CSV row", async ({ fixture, page }, testInfo) => {
  const deck = fixture.deck();
  const { cards } = fixture.state.remote;
  await fixture.apply(page);
  await page.goto("/");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Download" }).click();
  const download = await downloadPromise;
  const path = testInfo.outputPath("deck.csv");
  await download.saveAs(path);
  const csv = await readFile(path, "utf8");

  expect(download.suggestedFilename()).toBe(`${deck.name}.csv`);
  const csvCell = (value: string) => (value.includes(",") ? `"${value.replaceAll('"', '""')}"` : value);
  for (const card of cards) {
    expect(csv).toContain([card.frontText, card.backText, card.tags.join(","), card.uniqueKey].map(csvCell).join(","));
  }
  expect(csv.trim().split("\n")).toHaveLength(cards.length);
});

test("DECK-09 creates one empty remote Deck without a local duplicate", async ({ fixture, page, namespace }) => {
  const name = `${namespace.caseId} created`;
  const category = "typescript";
  const { uid } = fixture.user();
  await fixture.apply(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Create deck" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("combobox").selectOption(category);
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
  await expect(page.getByRole("status").filter({ hasText: `Created deck “${name}”.` })).toBeVisible();
  const deckId = new URL(page.url()).pathname.split("/").at(-1);
  if (deckId === undefined) throw new Error("Created Deck ID is missing");
  await expect(page.getByText("0 cards")).toBeVisible();

  await page.goto("/");
  await page.reload();

  const deckArticle = page.getByRole("button", { name: `View ${name}` }).locator("xpath=ancestor::article[1]");
  await expect(deckArticle).toContainText(category);
  const remote = await listDocuments("deck");
  const owned = remote.filter(
    ({ fields }) =>
      fields.uid?.stringValue === uid && (fields.name as { stringValue?: string } | undefined)?.stringValue === name
  );
  expect(owned.map(documentId)).toEqual([deckId]);
  expect(owned.map(({ fields }) => fields.category?.stringValue)).toEqual([category]);
  const ownedCardsForDeck = (await listDocuments("card")).filter(
    ({ fields }) => fields.uid?.stringValue === uid && fields.deckId?.stringValue === deckId
  );
  expect(ownedCardsForDeck).toEqual([]);
  const local = await readLocalData(page);
  expect(local.decks).toEqual([]);
  expect(local.cards).toEqual([]);
});

test("DECK-10 retries a failed remote create with the same ID and no duplicate", async ({
  fixture,
  page,
  browserErrors,
  namespace,
}) => {
  const name = `${namespace.caseId} retry deck`;
  const category = "typescript";
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Create deck" }).click();
  let attemptedDeckId: string | undefined;
  page.on("request", (request) => {
    if (!request.url().includes("google.firestore.v1.Firestore/Write/channel")) return;
    const body = decodeURIComponent((request.postData() ?? "").replaceAll("+", "%20"));
    attemptedDeckId ??= /\/documents\/deck\/([a-zA-Z0-9-]+)/.exec(body)?.[1];
  });
  const fault = await failNextFirestoreWrite(page, { collection: "deck" });
  allowExpectedFirestoreWriteFailure(browserErrors);
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("combobox").selectOption(category);
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page.getByRole("alert")).toContainText("Unable to create this deck. Try again.");
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  expect(attemptedDeckId).toBeDefined();

  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(name);
  await expect(page.getByRole("combobox")).toHaveValue(category);
  await expect(page.getByRole("checkbox", { name: "Local only" })).not.toBeChecked();
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: `Created deck “${name}”.` })).toBeVisible();
  const deckId = new URL(page.url()).pathname.split("/").at(-1);
  if (deckId === undefined) throw new Error("Created Deck ID is missing");
  expect(deckId).toBe(attemptedDeckId);

  await page.goto("/");
  await page.reload();
  const deckArticle = page.getByRole("button", { name: `View ${name}` }).locator("xpath=ancestor::article[1]");
  await expect(deckArticle).toContainText(category);
  const remote = await listDocuments("deck");
  const owned = remote.filter(
    ({ fields }) =>
      fields.uid?.stringValue === uid && (fields.name as { stringValue?: string } | undefined)?.stringValue === name
  );
  expect(owned.map(documentId)).toEqual([deckId]);
  expect(owned.map(({ fields }) => fields.category?.stringValue)).toEqual([category]);
  const local = await readLocalData(page);
  expect(local.decks).toEqual([]);
  expect(local.cards).toEqual([]);
});
