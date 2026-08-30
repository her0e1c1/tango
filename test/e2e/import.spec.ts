import {
  allowExpectedFirestoreWriteFailure,
  documentId,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  readLocalData,
  test,
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

test("IMPORT-01 A valid CSV is previewed without persistence", async ({ fixture, page, namespace }) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/import");
  const file = validCsv(namespace.id("preview"));
  await page.getByLabel("Upload a csv file").setInputFiles(file);

  await expect(page.getByRole("heading", { level: 2, name: "Review import" })).toBeVisible();
  await expect(page.getByText(file.name, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("2 valid")).toBeVisible();
  await expect(page.getByText(`front ${namespace.id("preview")} one`, { exact: true })).toBeVisible();
  await expect(page.getByText(`back ${namespace.id("preview")} two`, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import", exact: true })).toBeEnabled();
  expect(await documentsForUid("deck", uid)).toEqual([]);
  expect(await documentsForUid("card", uid)).toEqual([]);
});

test("IMPORT-02 Invalid CSV rows block persistence", async ({ fixture, page, namespace }) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/import");
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
  expect(await documentsForUid("deck", uid)).toEqual([]);
  expect(await documentsForUid("card", uid)).toEqual([]);
});

test("IMPORT-03 A remote CSV import survives reload", async ({ fixture, page, namespace }) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/import");
  const csvNamespace = namespace.id("remote");
  const file = validCsv(csvNamespace);
  await page.getByRole("radio", { name: /Sync with account/ }).check();
  await page.getByLabel("Upload a csv file").setInputFiles(file);
  await expect(page.getByText("2 valid")).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  await expect.poll(async () => (await documentsForUid("deck", uid)).length).toBe(1);
  await expect.poll(async () => (await documentsForUid("card", uid)).length).toBe(2);
  const [remoteDeck] = await documentsForUid("deck", uid);
  if (remoteDeck == null) throw new Error("Imported remote Deck was not found");
  expect(remoteDeck.fields.name?.stringValue).toBe(file.name);
  const deckId = documentId(remoteDeck);
  if (deckId === "") throw new Error("Imported remote Deck id was not found");

  await page.reload();
  await page.getByRole("button", { name: `View ${file.name}` }).click();
  await expect(page.getByText(`front ${csvNamespace} one`, { exact: true })).toBeVisible();
  await expect(page.getByText(`front ${csvNamespace} two`, { exact: true })).toBeVisible();
  expect((await documentsForUid("card", uid)).every((document) => document.fields.deckId?.stringValue === deckId)).toBe(
    true
  );
});

test("IMPORT-04 A local-only CSV import survives reload and can be studied", async ({ fixture, page, namespace }) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/import");
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
  expect(await documentsForUid("deck", uid)).toEqual([]);
  expect(await documentsForUid("card", uid)).toEqual([]);

  await page.getByRole("button", { name: `Study ${file.name}` }).click();
  await page.getByRole("button", { name: "Start 2 cards" }).click();
  await expect(page.getByText(new RegExp(`^front ${csvNamespace} (one|two)$`))).toBeVisible();
});

test("IMPORT-05 A partial remote import retries without duplicates", async ({
  browserErrors,
  fixture,
  namespace,
  page,
}) => {
  allowExpectedFirestoreWriteFailure(browserErrors);
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/import");
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
  await expect.poll(async () => (await documentsForUid("deck", uid)).length).toBe(1);
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  expect(await documentsForUid("card", uid)).toEqual([]);
  const [partialDeck] = await documentsForUid("deck", uid);
  if (partialDeck == null) throw new Error("Partially imported remote Deck was not found");
  const partialDeckId = documentId(partialDeck);
  if (partialDeckId === "") throw new Error("Partially imported remote Deck id was not found");

  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(async () => (await documentsForUid("card", uid)).length).toBe(1);
  const decksAfterRetry = await documentsForUid("deck", uid);
  const cardsAfterRetry = await documentsForUid("card", uid);
  expect(decksAfterRetry.map(documentId)).toEqual([partialDeckId]);
  expect(cardsAfterRetry).toHaveLength(1);
  expect(cardsAfterRetry[0]?.fields.deckId?.stringValue).toBe(partialDeckId);
});

test("IMPORT-06 Adding Sample Deck saves it, returns to the list, and remains idempotent", async ({
  fixture,
  page,
}) => {
  await fixture.apply(page);
  await page.goto("/import");
  const addSample = page.getByRole("button", { name: "Add sample deck" });
  // Local persistence can finish before Playwright polls again, so observe loading before clicking.
  await addSample.evaluate((element) => {
    if (!(element instanceof HTMLButtonElement)) throw new Error("Add sample deck control is not a button");
    const { documentElement } = element.ownerDocument;
    documentElement.dataset.sampleDeckLoadingObserved = "false";
    const observer = new MutationObserver(() => {
      if (element.getAttribute("aria-busy") === "true" && element.disabled) {
        documentElement.dataset.sampleDeckLoadingObserved = "true";
        observer.disconnect();
      }
    });
    observer.observe(element, { attributeFilter: ["aria-busy", "disabled"], attributes: true });
  });

  await addSample.click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.locator("html").getAttribute("data-sample-deck-loading-observed")).toBe("true");
  await expect(page.getByRole("button", { name: "View Sample Deck" })).toBeVisible();

  const first = await readLocalData(page);
  const firstDecks = first.decks.filter(({ id }: { id: string }) => id === "sample-v1");
  const firstCardIds = first.cards
    .filter(({ deckId }: { deckId?: string }) => deckId === "sample-v1")
    .map(({ id }: { id: string }) => id)
    .sort();
  expect(firstDecks).toHaveLength(1);
  expect(firstCardIds.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Import decks" }).click();
  await page.getByRole("button", { name: "Add sample deck" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await page.getByRole("button", { name: "View Sample Deck" }).click();

  const after = await readLocalData(page);
  const afterDecks = after.decks.filter(({ id }: { id: string }) => id === "sample-v1");
  expect(afterDecks).toHaveLength(1);
  expect(
    after.cards
      .filter(({ deckId }: { deckId?: string }) => deckId === "sample-v1")
      .map(({ id }: { id: string }) => id)
      .sort()
  ).toEqual(firstCardIds);
});
