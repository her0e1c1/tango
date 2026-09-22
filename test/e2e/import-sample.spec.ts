import type { Page } from "@playwright/test";
import sampleCards from "../../sample/build/output.json";
import { documentId, expect, listDocuments, readLocalData, test } from "./fixtures";

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

const previewSample = async (page: Page) => {
  await page.goto("/import");
  await page.getByRole("button", { name: "Sample deck", exact: true }).click();
  await page.getByRole("button", { name: "Try this example", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Review import", exact: true })).toBeVisible();
  await expect(page.getByText(`${sampleCards.length} valid`, { exact: true })).toBeVisible();
};

const confirmSample = (page: Page) =>
  page.getByRole("button", { name: `Add ${sampleCards.length} cards`, exact: true }).click();

test("IMPORT-10 A fresh anonymous session keeps the imported Sample deck local", async ({ fixture, page }) => {
  await fixture.apply(page, { auth: false });
  await previewSample(page);
  await confirmSample(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: `Imported ${sampleCards.length} cards.` })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Open account", exact: true }).click();
  await expect(page.getByText("Anonymous account", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with Google", exact: true })).toBeVisible();
  const uid = (
    await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").textContent()
  )?.trim();
  if (!uid) throw new Error("The anonymous account has no User ID");
  const { decks, cards } = await readLocalData(page);
  expect(decks).toHaveLength(1);
  const [deck] = decks;
  if (!deck) throw new Error("The anonymous account has no imported Deck");
  expect(deck).toMatchObject({ name: sampleName });
  expect(cards).toHaveLength(sampleCards.length);
  expect(cards.every((card: { deckId: string }) => card.deckId === deck.id)).toBe(true);
  expect(cards.map(cardContent).sort(byKey)).toEqual(expectedCards);
  expect(await documentsForUid("deck", uid)).toEqual([]);
  expect(await documentsForUid("card", uid)).toEqual([]);

  await page.getByRole("button", { name: "tango", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
});

test("IMPORT-08 A local Sample deck preserves every card and can be studied after reload", async ({
  fixture,
  page,
}) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await previewSample(page);
  expect((await readLocalData(page)).decks).toEqual([]);
  expect((await readLocalData(page)).cards).toEqual([]);
  expect(await documentsForUid("deck", uid)).toEqual([]);
  expect(await documentsForUid("card", uid)).toEqual([]);

  await confirmSample(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: `Imported ${sampleCards.length} cards.` })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
  await expect(page.getByText("What is bisect_left?", { exact: true })).toBeVisible();

  const { decks, cards } = await readLocalData(page);
  expect(decks).toHaveLength(1);
  expect(decks[0]).toMatchObject({ name: sampleName });
  expect(cards).toHaveLength(sampleCards.length);
  expect(cards.every((card: { deckId: string }) => card.deckId === decks[0]?.id)).toBe(true);
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

test("IMPORT-09 A linked account syncs every Sample deck card without duplicates", async ({ fixture, page }) => {
  const { uid } = fixture.user();
  await fixture.apply(page, { auth: { linked: true } });
  await previewSample(page);
  await confirmSample(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: `Imported ${sampleCards.length} cards.` })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
  await expect(page.getByText("What is bisect_left?", { exact: true })).toBeVisible();

  const [savedDeck] = await documentsForUid("deck", uid);
  if (!savedDeck) throw new Error("Missing imported Deck");
  await expect.poll(async () => (await documentsForUid("card", uid)).length).toBe(sampleCards.length);
  const cards = await documentsForUid("card", uid);
  expect(cards).toHaveLength(sampleCards.length);
  expect(cards.every((card) => card.fields.deckId?.stringValue === documentId(savedDeck))).toBe(true);
  const contents = cards.map(({ fields }) => ({
    frontText: fields.frontText?.stringValue ?? "",
    backText: fields.backText?.stringValue ?? "",
    tags: fields.tags?.arrayValue?.values?.map((tag) => String(tag.stringValue)) ?? [],
    uniqueKey: fields.uniqueKey?.stringValue ?? "",
  }));
  expect(contents.sort(byKey)).toEqual(expectedCards);
  expect((await readLocalData(page)).cards).toHaveLength(sampleCards.length);
});
