import type { Page } from "@playwright/test";
import sampleCards from "../../sample/build/output.json";
import {
  allowExpectedFirestoreWriteFailure,
  documentId,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  readLocalData,
  test,
} from "./fixtures";

type SampleCard = (typeof sampleCards)[number];
const sampleName = "deck-sample.csv";
const byKey = (left: SampleCard, right: SampleCard) => left.uniqueKey.localeCompare(right.uniqueKey);
const expectedCards = [...sampleCards].sort(byKey);
const cardContent = ({ frontText, backText, tags, uniqueKey }: SampleCard) => ({
  frontText,
  backText,
  tags,
  uniqueKey,
});
const documentsForUid = async (collection: "deck" | "card", uid: string) =>
  (await listDocuments(collection)).filter((document) => document.fields.uid?.stringValue === uid);

const previewSample = async (page: Page, local: boolean) => {
  await page.goto("/import");
  await page.getByRole("button", { name: "Change", exact: true }).click();
  await page.getByRole("radio", { name: local ? /Local only/ : /Sync with account/ }).check();
  await page.getByRole("button", { name: "Sample deck", exact: true }).click();
  await page.getByRole("button", { name: "Try this example", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Review import", exact: true })).toBeVisible();
  await expect(page.getByText(`${sampleCards.length} valid`, { exact: true })).toBeVisible();
};

const confirmSample = (page: Page) =>
  page.getByRole("button", { name: `Add ${sampleCards.length} cards`, exact: true }).click();

test("IMPORT-10 A fresh anonymous session imports a remote Sample deck without Google sign-in", async ({
  fixture,
  page,
}) => {
  await fixture.apply(page, { auth: false });
  await previewSample(page, false);
  await confirmSample(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: `Imported ${sampleCards.length} cards.` })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${sampleName}`, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Open account", exact: true }).click();
  await expect(page.getByText("Anonymous account", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with Google", exact: true })).toBeVisible();
  const uid = (
    await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").textContent()
  )?.trim();
  if (!uid) throw new Error("The anonymous account has no User ID");
  const decks = await documentsForUid("deck", uid);
  expect(decks).toHaveLength(1);
  const [deck] = decks;
  if (!deck) throw new Error("The anonymous account has no imported Deck");
  expect(deck.fields.name?.stringValue).toBe(sampleName);
  const cards = await documentsForUid("card", uid);
  expect(cards).toHaveLength(sampleCards.length);
  expect(cards.every((card) => card.fields.deckId?.stringValue === documentId(deck))).toBe(true);
  expect((await readLocalData(page)).decks).toEqual([]);
  expect((await readLocalData(page)).cards).toEqual([]);

  await page.getByRole("button", { name: "tango", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await page.getByRole("button", { name: `View ${sampleName}`, exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
});

test("IMPORT-08 A local Sample deck preserves every card and can be studied after reload", async ({
  fixture,
  page,
}) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await previewSample(page, true);
  expect((await readLocalData(page)).decks).toEqual([]);
  expect((await readLocalData(page)).cards).toEqual([]);
  expect(await documentsForUid("deck", uid)).toEqual([]);
  expect(await documentsForUid("card", uid)).toEqual([]);

  await confirmSample(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: `Imported ${sampleCards.length} cards.` })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${sampleName}`, exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: `View ${sampleName}`, exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
  await expect(page.getByText("What is bisect_left?", { exact: true })).toBeVisible();

  const { decks, cards } = await readLocalData(page);
  expect(decks).toHaveLength(1);
  expect(decks[0]).toMatchObject({ name: sampleName, localMode: true });
  expect(cards).toHaveLength(sampleCards.length);
  expect(cards.every((card: { deckId: string }) => card.deckId === decks[0].id)).toBe(true);
  expect(cards.map(cardContent).sort(byKey)).toEqual(expectedCards);
  expect(await documentsForUid("deck", uid)).toEqual([]);
  expect(await documentsForUid("card", uid)).toEqual([]);

  await page.goto("/");
  await page.getByRole("button", { name: `Study ${sampleName}`, exact: true }).click();
  await page.getByRole("button", { name: /^Start \d+ cards$/u }).click();
  await page.locator("#frontText").click();
  await expect(page.getByRole("region", { name: "Study answer" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Study answer" })).toContainText("import pytest");
});

test("IMPORT-09 A failed remote Sample deck import retries without losing or duplicating cards", async ({
  browserErrors,
  fixture,
  page,
}) => {
  allowExpectedFirestoreWriteFailure(browserErrors);
  const { uid } = fixture.user();
  await fixture.apply(page);
  await previewSample(page, false);
  const fault = await failNextFirestoreWrite(page, { collection: "card" });
  await confirmSample(page);
  await expect(page.getByRole("alert")).toContainText("You do not have permission to import this data.");
  await expect(page.getByRole("heading", { name: "Review import", exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Sync with account/ })).toBeChecked();
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  const partialDecks = await documentsForUid("deck", uid);
  expect(partialDecks).toHaveLength(1);
  const partialDeck = partialDecks[0];
  if (partialDeck === undefined) throw new Error("The sample destination was not created");
  const partialCards = await documentsForUid("card", uid);
  expect(partialCards.length).toBeGreaterThan(0);
  expect(partialCards.length).toBeLessThan(sampleCards.length);

  await confirmSample(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: `Imported ${sampleCards.length} cards.` })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${sampleName}`, exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: `View ${sampleName}`, exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
  await expect(page.getByText("What is bisect_left?", { exact: true })).toBeVisible();

  expect((await documentsForUid("deck", uid)).map(documentId)).toEqual([documentId(partialDeck)]);
  const cards = await documentsForUid("card", uid);
  expect(cards).toHaveLength(sampleCards.length);
  expect(cards.map(documentId)).toEqual(expect.arrayContaining(partialCards.map(documentId)));
  expect(cards.every((card) => card.fields.deckId?.stringValue === documentId(partialDeck))).toBe(true);
  const contents = cards.map(({ fields }) => ({
    frontText: fields.frontText?.stringValue ?? "",
    backText: fields.backText?.stringValue ?? "",
    tags: fields.tags?.arrayValue?.values?.map((tag) => String(tag.stringValue)) ?? [],
    uniqueKey: fields.uniqueKey?.stringValue ?? "",
  }));
  expect(contents.sort(byKey)).toEqual(expectedCards);
  expect((await readLocalData(page)).decks).toEqual([]);
  expect((await readLocalData(page)).cards).toEqual([]);
});
