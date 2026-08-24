import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import {
  createLocalCardFixture,
  createLocalDeckFixture,
  createRemoteCardFixture,
  createRemoteDeckFixture,
  documentId,
  expect,
  expectedFirestoreWriteBrowserError,
  failNextFirestoreWrite,
  getDocument,
  listDocuments,
  readLocalData,
  routeAnonymousAuth,
  seedConfig,
  seedDeckAndCards,
  seedLocalData,
  test,
  type TestNamespace,
} from "./fixtures";

const prepareRemote = async (
  page: Page,
  namespace: TestNamespace,
  deck: ReturnType<typeof createRemoteDeckFixture>,
  cards: ReturnType<typeof createRemoteCardFixture>[] = []
) => {
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);
  await seedDeckAndCards(deck, cards);
};

const openDeckDeleteDialog = async (page: Page, deckName: string) => {
  await page.getByRole("button", { name: `Open actions for ${deckName}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  return page.getByRole("alertdialog", { name: "Delete deck?" });
};

const startResumableStudy = async (page: Page, deckId: string, deckName: string, cardCount: number) => {
  const cardsLabel = `${String(cardCount)} ${cardCount === 1 ? "card" : "cards"}`;
  await page.goto(`/deck/${deckId}/start`);
  await page.getByRole("button", { name: `Start ${cardsLabel}` }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deckId}/study$`));
  await page.getByRole("button", { name: "Exit" }).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${deckId}$`));
  await page.getByRole("button", { name: "tango" }).click();
  await expect(page.getByRole("button", { name: `Continue ${deckName}` })).toBeVisible();

  const session = (await readLocalData(page)).sessionsByDeckId[deckId];
  if (session === undefined) throw new Error(`Study session was not persisted for ${deckId}`);
  return session;
};

const clickCheckboxLabel = async (page: Page, name: string) => {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await checkbox.locator("xpath=parent::label").click();
  return checkbox;
};

test("DECK-01 navigates from the Deck list to its Card list", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id);
  await prepareRemote(page, namespace, deck, [card]);

  await page.goto("/");
  await page.getByRole("button", { name: `View ${deck.name}` }).click();

  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByText(card.frontText)).toBeVisible();
});

test("DECK-02 persists edited name and category across reload", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace, { name: `${namespace.caseId} original` });
  await prepareRemote(page, namespace, deck);
  const updatedName = `${namespace.caseId} updated`;

  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(updatedName);
  await page.getByRole("combobox").selectOption("typescript");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await page.getByRole("button", { name: `Open actions for ${updatedName}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(updatedName);
  await expect(page.getByRole("combobox")).toHaveValue("typescript");
});

test("DECK-03 deletes a Deck, all Cards, and its resumable session", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = [
    createRemoteCardFixture(namespace, deck.id, { id: namespace.id("card-a"), frontText: "DECK-03 front a" }),
    createRemoteCardFixture(namespace, deck.id, { id: namespace.id("card-b"), frontText: "DECK-03 front b" }),
  ];
  await prepareRemote(page, namespace, deck, cards);
  await startResumableStudy(page, deck.id, deck.name, cards.length);

  const dialog = await openDeckDeleteDialog(page, deck.name);
  await dialog.getByRole("button", { name: "Delete deck" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: `View ${deck.name}` })).toHaveCount(0);
  await expect.poll(() => getDocument("deck", deck.id)).toBeUndefined();
  await Promise.all(cards.map((card) => expect.poll(() => getDocument("card", card.id)).toBeUndefined()));
  expect((await readLocalData(page)).sessionsByDeckId).not.toHaveProperty(deck.id);
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
});

test("DECK-04 cancels Deck deletion and preserves all related data", async ({ page, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id);
  await prepareRemote(page, namespace, deck, [card]);
  const session = await startResumableStudy(page, deck.id, deck.name, 1);

  const trigger = page.getByRole("button", { name: `Open actions for ${deck.name}` });
  const dialog = await openDeckDeleteDialog(page, deck.name);
  await expect(dialog).toContainText(deck.name);
  await expect(dialog).toContainText("1 card");
  await expect(dialog).toContainText("in-progress study session");
  await expect(dialog).toContainText("cannot be undone");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await getDocument("deck", deck.id)).toBeDefined();
  expect(await getDocument("card", card.id)).toBeDefined();
  expect((await readLocalData(page)).sessionsByDeckId).toHaveProperty(deck.id, session);
});

test("DECK-05 retries the same Deck deletion after a handled failure", async ({ page, browserErrors, namespace }) => {
  const deck = createRemoteDeckFixture(namespace);
  const card = createRemoteCardFixture(namespace, deck.id);
  await prepareRemote(page, namespace, deck, [card]);
  await startResumableStudy(page, deck.id, deck.name, 1);
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
  browserErrors.allow(expectedFirestoreWriteBrowserError);

  const dialog = await openDeckDeleteDialog(page, deck.name);
  await dialog.getByRole("button", { name: "Delete deck" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  expect(fault.wasTriggered()).toBe(true);
  await fault.dispose();
  await dialog.getByRole("button", { name: "Delete deck" }).click();

  // Firestore reopens its write stream after the injected non-retryable error before accepting this retry.
  await expect(dialog).not.toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: `View ${deck.name}` })).toHaveCount(0);
  await expect.poll(() => getDocument("deck", deck.id)).toBeUndefined();
  await expect.poll(() => getDocument("card", card.id)).toBeUndefined();
  expect((await readLocalData(page)).sessionsByDeckId).not.toHaveProperty(deck.id);
});

test("DECK-06 recovers home from a missing Deck route", async ({ page, namespace }) => {
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);

  await page.goto(`/deck/${namespace.id("missing")}`);
  await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
});

test("DECK-07 migrates a local-only Deck and every Card to remote storage", async ({ page, namespace }) => {
  const deck = createLocalDeckFixture(namespace);
  const cards = [
    createLocalCardFixture(namespace, deck.id, { id: namespace.id("card-a"), frontText: "DECK-07 front a" }),
    createLocalCardFixture(namespace, deck.id, { id: namespace.id("card-b"), frontText: "DECK-07 front b" }),
  ];
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);
  await seedLocalData(page, { decks: [deck], cards });

  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const localOnly = await clickCheckboxLabel(page, "Local only");
  await expect(localOnly).not.toBeChecked();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await page.getByRole("button", { name: `View ${deck.name}` }).click();

  await Promise.all(cards.map((card) => expect(page.getByText(String(card.frontText))).toBeVisible()));
  expect(await getDocument("deck", deck.id)).toBeDefined();
  const remoteCards = await Promise.all(cards.map((card) => getDocument("card", String(card.id))));
  expect(remoteCards.every((card) => card !== undefined)).toBe(true);
  expect(await readLocalData(page)).toEqual({ decks: [], cards: [], sessionsByDeckId: {} });
});

test("DECK-08 downloads every Card field as one CSV row", async ({ page, namespace }, testInfo) => {
  const deck = createRemoteDeckFixture(namespace, { name: `${namespace.caseId} export` });
  const cards = [
    createRemoteCardFixture(namespace, deck.id, {
      id: namespace.id("card-a"),
      frontText: "front one",
      backText: "back one",
      tags: ["alpha", "beta"],
      uniqueKey: "key-one",
    }),
    createRemoteCardFixture(namespace, deck.id, {
      id: namespace.id("card-b"),
      frontText: "front two",
      backText: "back two",
      tags: ["gamma"],
      uniqueKey: "key-two",
    }),
  ];
  await prepareRemote(page, namespace, deck, cards);
  await page.goto("/");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Download" }).click();
  const download = await downloadPromise;
  const path = testInfo.outputPath("deck.csv");
  await download.saveAs(path);
  const csv = await readFile(path, "utf8");

  expect(download.suggestedFilename()).toBe(`${deck.name}.csv`);
  expect(csv).toContain('front one,back one,"alpha,beta",key-one');
  expect(csv).toContain("front two,back two,gamma,key-two");
  expect(csv.trim().split("\n")).toHaveLength(2);
});

test("DECK-09 creates one empty remote Deck without a local duplicate", async ({ page, namespace }) => {
  const name = `${namespace.caseId} created`;
  const category = "typescript";
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Create deck" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("combobox").selectOption(category);
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
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
      fields.uid?.stringValue === namespace.uid &&
      (fields.name as { stringValue?: string } | undefined)?.stringValue === name
  );
  expect(owned.map(documentId)).toEqual([deckId]);
  expect(owned.map(({ fields }) => fields.category?.stringValue)).toEqual([category]);
  const ownedCardsForDeck = (await listDocuments("card")).filter(
    ({ fields }) => fields.uid?.stringValue === namespace.uid && fields.deckId?.stringValue === deckId
  );
  expect(ownedCardsForDeck).toEqual([]);
  const local = await readLocalData(page);
  expect(local.decks).toEqual([]);
  expect(local.cards).toEqual([]);
});

test("DECK-10 retries a failed remote create with the same ID and no duplicate", async ({
  page,
  browserErrors,
  namespace,
}) => {
  const name = `${namespace.caseId} retry deck`;
  const category = "typescript";
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Create deck" }).click();
  let attemptedDeckId: string | undefined;
  page.on("request", (request) => {
    if (!request.url().includes("google.firestore.v1.Firestore/Write/channel")) return;
    const body = decodeURIComponent((request.postData() ?? "").replaceAll("+", "%20"));
    attemptedDeckId ??= /\/documents\/deck\/([a-zA-Z0-9-]+)/.exec(body)?.[1];
  });
  const fault = await failNextFirestoreWrite(page, { collection: "deck" });
  browserErrors.allow(expectedFirestoreWriteBrowserError);
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("combobox").selectOption(category);
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page.getByRole("status")).toContainText("Unable to create this deck");
  expect(fault.wasTriggered()).toBe(true);
  await fault.dispose();
  expect(attemptedDeckId).toBeDefined();

  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(name);
  await expect(page.getByRole("combobox")).toHaveValue(category);
  await expect(page.getByRole("checkbox", { name: "Local only" })).not.toBeChecked();
  await page.getByRole("button", { name: "Create deck" }).click();
  await expect(page).toHaveURL(/\/deck\/(?!new$)[^/]+$/);
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
      fields.uid?.stringValue === namespace.uid &&
      (fields.name as { stringValue?: string } | undefined)?.stringValue === name
  );
  expect(owned.map(documentId)).toEqual([deckId]);
  expect(owned.map(({ fields }) => fields.category?.stringValue)).toEqual([category]);
  const local = await readLocalData(page);
  expect(local.decks).toEqual([]);
  expect(local.cards).toEqual([]);
});
