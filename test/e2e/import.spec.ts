import type { Page } from "@playwright/test";
import {
  documentId,
  expect,
  expectedFirestoreWriteBrowserError,
  failNextFirestoreWrite,
  listDocuments,
  readLocalData,
  routeAnonymousAuth,
  seedConfig,
  test,
  type TestNamespace,
} from "./fixtures";

const documentsForUid = async (collection: "deck" | "card", uid: string) =>
  (await listDocuments(collection)).filter((document) => document.fields.uid?.stringValue === uid);

const csvFile = (name: string, rows: readonly string[]) => ({
  name,
  mimeType: "text/csv",
  buffer: Buffer.from(rows.join("\n")),
});

const validCsv = (namespace: string) =>
  csvFile(`${namespace}.csv`, [
    `"front ${namespace} one","back ${namespace} one","tag-${namespace}","${namespace}-key-1"`,
    `"front ${namespace} two","back ${namespace} two","","${namespace}-key-2"`,
  ]);

const prepareImportPage = async (page: Page, namespace: TestNamespace) => {
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);
  await page.goto("/import");
};

test("IMPORT-01 A valid CSV is previewed without persistence", async ({ page, namespace }) => {
  await prepareImportPage(page, namespace);
  const file = validCsv(namespace.id("preview"));
  await page.getByLabel("Upload a csv file").setInputFiles(file);

  await expect(page.getByRole("heading", { level: 2, name: "Review import" })).toBeVisible();
  await expect(page.getByText(file.name, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("2 valid")).toBeVisible();
  await expect(page.getByText(`front ${namespace.id("preview")} one`, { exact: true })).toBeVisible();
  await expect(page.getByText(`back ${namespace.id("preview")} two`, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import", exact: true })).toBeEnabled();
  expect(await documentsForUid("deck", namespace.uid)).toEqual([]);
  expect(await documentsForUid("card", namespace.uid)).toEqual([]);
});

test("IMPORT-02 Invalid CSV rows block persistence", async ({ page, namespace }) => {
  await prepareImportPage(page, namespace);
  await page
    .getByLabel("Upload a csv file")
    .setInputFiles(
      csvFile(`${namespace.id("invalid")}.csv`, [
        `"valid front","valid back","","${namespace.id("valid-key")}"`,
        '"invalid front","invalid back","tag",""',
      ])
    );

  const validation = page.getByRole("alert");
  await expect(validation).toContainText("Row 2");
  await expect(validation).toContainText("Unique key is required.");
  await expect(page.getByText("1 invalid")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import", exact: true })).toBeDisabled();
  expect(await documentsForUid("deck", namespace.uid)).toEqual([]);
  expect(await documentsForUid("card", namespace.uid)).toEqual([]);
});

test("IMPORT-03 A remote CSV import survives reload", async ({ page, namespace }) => {
  await prepareImportPage(page, namespace);
  const csvNamespace = namespace.id("remote");
  const file = validCsv(csvNamespace);
  await page.getByRole("radio", { name: /Sync with account/ }).check();
  await page.getByLabel("Upload a csv file").setInputFiles(file);
  await expect(page.getByText("2 valid")).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  await expect.poll(async () => (await documentsForUid("deck", namespace.uid)).length).toBe(1);
  await expect.poll(async () => (await documentsForUid("card", namespace.uid)).length).toBe(2);
  const [remoteDeck] = await documentsForUid("deck", namespace.uid);
  if (remoteDeck == null) throw new Error("Imported remote Deck was not found");
  expect(remoteDeck.fields.name?.stringValue).toBe(file.name);
  const deckId = documentId(remoteDeck);
  if (deckId === "") throw new Error("Imported remote Deck id was not found");

  await page.reload();
  await page.getByRole("button", { name: `View ${file.name}` }).click();
  await expect(page.getByText(`front ${csvNamespace} one`, { exact: true })).toBeVisible();
  await expect(page.getByText(`front ${csvNamespace} two`, { exact: true })).toBeVisible();
  expect(
    (await documentsForUid("card", namespace.uid)).every((document) => document.fields.deckId?.stringValue === deckId)
  ).toBe(true);
});

test("IMPORT-04 A local-only CSV import survives reload and can be studied", async ({ page, namespace }) => {
  await prepareImportPage(page, namespace);
  const csvNamespace = namespace.id("local");
  const file = validCsv(csvNamespace);
  await page.getByRole("radio", { name: /Local only/ }).check();
  await page.getByLabel("Upload a csv file").setInputFiles(file);
  await expect(page.getByText("2 valid")).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.reload();
  await expect(page.getByRole("button", { name: `View ${file.name}` })).toBeVisible();
  const stored = await readLocalData(page);
  const decks = stored.decks.filter(({ name }: { name?: string }) => name === file.name);
  expect(decks).toHaveLength(1);
  const localDeck = decks[0] as { id: string; localMode: boolean };
  expect(localDeck.localMode).toBe(true);
  expect(stored.cards.filter(({ deckId }: { deckId?: string }) => deckId === localDeck.id)).toHaveLength(2);
  expect(await documentsForUid("deck", namespace.uid)).toEqual([]);
  expect(await documentsForUid("card", namespace.uid)).toEqual([]);

  await page.getByRole("button", { name: `Study ${file.name}` }).click();
  await page.getByRole("button", { name: "Start 2 cards" }).click();
  await expect(page.getByText(new RegExp(`^front ${csvNamespace} (one|two)$`))).toBeVisible();
});

test("IMPORT-05 A partial remote import retries without duplicates", async ({ page, namespace, browserErrors }) => {
  browserErrors.allow(expectedFirestoreWriteBrowserError);
  await prepareImportPage(page, namespace);
  const file = csvFile(`${namespace.id("retry")}.csv`, [
    `"retry front ${namespace.caseId}","retry back ${namespace.caseId}","","${namespace.id("retry-key")}"`,
  ]);
  await page.getByRole("radio", { name: /Sync with account/ }).check();
  await page.getByLabel("Upload a csv file").setInputFiles(file);
  await expect(page.getByText("1 valid")).toBeVisible();
  const fault = await failNextFirestoreWrite(page, { collection: "card" });

  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Import failed" })).toBeVisible();
  await expect(page.getByText(file.name, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("radio", { name: /Sync with account/ })).toBeChecked();
  await expect.poll(async () => (await documentsForUid("deck", namespace.uid)).length).toBe(1);
  expect(fault.wasTriggered()).toBe(true);
  await fault.dispose();
  expect(await documentsForUid("card", namespace.uid)).toEqual([]);
  const [partialDeck] = await documentsForUid("deck", namespace.uid);
  if (partialDeck == null) throw new Error("Partially imported remote Deck was not found");
  const partialDeckId = documentId(partialDeck);
  if (partialDeckId === "") throw new Error("Partially imported remote Deck id was not found");

  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(async () => (await documentsForUid("card", namespace.uid)).length).toBe(1);
  const decksAfterRetry = await documentsForUid("deck", namespace.uid);
  const cardsAfterRetry = await documentsForUid("card", namespace.uid);
  expect(decksAfterRetry.map(documentId)).toEqual([partialDeckId]);
  expect(cardsAfterRetry).toHaveLength(1);
  expect(cardsAfterRetry[0]?.fields.deckId?.stringValue).toBe(partialDeckId);
});

test("IMPORT-06 Adding Sample Deck repeatedly remains idempotent", async ({ page, namespace }) => {
  await prepareImportPage(page, namespace);
  await page.goto("/");
  await page.getByRole("button", { name: "Import decks" }).click();
  await page.getByRole("button", { name: "Add sample deck" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Import complete" })).toBeVisible();
  const before = await readLocalData(page);
  const beforeDecks = before.decks.filter(({ name }: { name?: string }) => name === "Sample Deck");
  expect(beforeDecks).toHaveLength(1);
  const sampleDeck = beforeDecks[0] as { id: string };
  const beforeCardIds = before.cards
    .filter(({ deckId }: { deckId?: string }) => deckId === sampleDeck.id)
    .map(({ id }: { id: string }) => id)
    .sort();
  expect(beforeCardIds.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Back to decks" }).click();
  await page.getByRole("button", { name: "Import decks" }).click();
  await page.getByRole("button", { name: "Add sample deck" }).click();
  await page.getByRole("button", { name: "Back to decks" }).click();
  await page.reload();
  await page.getByRole("button", { name: "View Sample Deck" }).click();

  const after = await readLocalData(page);
  const afterDecks = after.decks.filter(({ name }: { name?: string }) => name === "Sample Deck");
  expect(afterDecks).toHaveLength(1);
  expect(
    after.cards
      .filter(({ deckId }: { deckId?: string }) => deckId === sampleDeck.id)
      .map(({ id }: { id: string }) => id)
      .sort()
  ).toEqual(beforeCardIds);
});
