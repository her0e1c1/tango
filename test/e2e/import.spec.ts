import { readFile } from "node:fs/promises";
import * as Papa from "papaparse";
import type { Page } from "@playwright/test";
import {
  allowExpectedFirestoreWriteFailure,
  documentId,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  readLocalData,
  test,
} from "./fixtures";

const readSampleState = async (page: Page, sampleDeckId: string) => {
  const { decks, cards } = await readLocalData(page);
  const sampleDecks = decks.filter((candidate: { id?: string }) => candidate.id === sampleDeckId);
  return {
    deckIds: sampleDecks.map(({ id }: { id: string }) => id),
    cardIds: cards
      .filter(({ deckId }: { deckId?: string }) => deckId === sampleDeckId)
      .map(({ id }: { id: string }) => id)
      .sort(),
  };
};

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
  await page.getByRole("button", { name: "Change", exact: true }).click();
  const upload = page.getByLabel("Upload a csv file");
  const uploadArea = page.locator("label").filter({ has: upload });
  const destination = page.getByRole("radio", { name: /Local only/ });
  await destination.check();
  await destination.focus();
  await page.keyboard.press("Tab");
  await expect(upload).toBeFocused();
  await expect(uploadArea).toHaveCSS("outline-style", "solid");
  await expect(uploadArea).toHaveCSS("outline-width", "2px");
  await expect(uploadArea).toHaveCSS("outline-offset", "3px");
  await expect(uploadArea).toHaveCSS("opacity", "1");
  await page.keyboard.press("Tab");
  await expect(page.getByText("CSV format", { exact: true })).toBeFocused();
  await expect(uploadArea).toHaveCSS("outline-style", "none");
  await page.keyboard.press("Shift+Tab");
  await expect(upload).toBeFocused();
  await expect(uploadArea).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Shift+Tab");
  await expect(destination).toBeFocused();
  await expect(uploadArea).toHaveCSS("outline-style", "none");

  const file = validCsv(namespace.id("preview"));
  await page.getByLabel("Upload a csv file").setInputFiles(file);

  await expect(page.getByRole("heading", { level: 2, name: "Review import" })).toBeVisible();
  await expect(page.getByText(file.name, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("2 valid")).toBeVisible();
  await expect(page.getByText(`front ${namespace.id("preview")} one`, { exact: true })).toBeVisible();
  await expect(page.getByText(`back ${namespace.id("preview")} two`, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Add \d+ cards?$/u })).toBeEnabled();
  expect(await documentsForUid("deck", uid)).toEqual([]);
  expect(await documentsForUid("card", uid)).toEqual([]);
});

test("IMPORT-02 Invalid CSV rows block persistence", async ({ fixture, page, namespace }) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/import");
  await page.getByRole("button", { name: "Change", exact: true }).click();
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
  await expect(page.getByRole("button", { name: /^Add \d+ cards?$/u })).toBeDisabled();
  expect(await documentsForUid("deck", uid)).toEqual([]);
  expect(await documentsForUid("card", uid)).toEqual([]);
});

test("IMPORT-03 A remote CSV import survives reload", async ({ fixture, page, namespace }) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/import");
  await page.getByRole("button", { name: "Change", exact: true }).click();
  const csvNamespace = namespace.id("remote");
  const file = validCsv(csvNamespace);
  await page.getByRole("radio", { name: /Sync with account/ }).check();
  await page.getByLabel("Upload a csv file").setInputFiles(file);
  await expect(page.getByText("2 valid")).toBeVisible();
  await page.getByRole("button", { name: /^Add \d+ cards?$/u }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: "Imported 2 cards." })).toBeVisible();

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
  await page.getByRole("button", { name: "Change", exact: true }).click();
  const csvNamespace = namespace.id("local");
  const file = validCsv(csvNamespace);
  await page.getByRole("radio", { name: /Local only/ }).check();
  await page.getByLabel("Upload a csv file").setInputFiles(file);
  await expect(page.getByText("2 valid")).toBeVisible();
  await page.getByRole("button", { name: /^Add \d+ cards?$/u }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status").filter({ hasText: "Imported 2 cards." })).toBeVisible();

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
  await page.getByRole("button", { name: "Change", exact: true }).click();
  const file = csvFile(`${namespace.id("retry")}.csv`, [
    `"retry front ${namespace.caseId}","retry back ${namespace.caseId}","","${namespace.id("retry-key")}"`,
  ]);
  await page.getByRole("radio", { name: /Sync with account/ }).check();
  await page.getByLabel("Upload a csv file").setInputFiles(file);
  await expect(page.getByText("1 valid")).toBeVisible();
  const fault = await failNextFirestoreWrite(page, { collection: "card" });

  await page.getByRole("button", { name: /^Add \d+ cards?$/u }).click();
  await expect(page.getByRole("alert")).toContainText("Import failed.");
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

  await page.getByRole("button", { name: /^Add \d+ cards?$/u }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Imported 1 card." })).toBeVisible();
  await expect.poll(async () => (await documentsForUid("card", uid)).length).toBe(1);
  const decksAfterRetry = await documentsForUid("deck", uid);
  const cardsAfterRetry = await documentsForUid("card", uid);
  expect(decksAfterRetry.map(documentId)).toEqual([partialDeckId]);
  expect(cardsAfterRetry).toHaveLength(1);
  expect(cardsAfterRetry[0]?.fields.deckId?.stringValue).toBe(partialDeckId);
});

test("IMPORT-06 All four examples share preview, download, and destination-aware import", async ({
  fixture,
  page,
}, testInfo) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  const examples = [
    {
      label: "Basic",
      file: "basic-sample.csv",
      count: 3,
      local: true,
      representativeRow: ["apple", "りんご", "果物", "apple-001"],
    },
    {
      label: "Math",
      file: "math-sample.csv",
      count: 2,
      local: false,
      representativeRow: ["半径 $r$ の円の面積は？", "$\\pi r^2$", "math", "circle-area"],
    },
    {
      label: "Markdown",
      file: "markdown-sample.csv",
      count: 2,
      local: true,
      representativeRow: ["Markdownで強調するには？", "**重要**な語句を強調します。", "md", "markdown-source"],
    },
    {
      label: "Sample deck",
      file: "deck-sample.csv",
      count: 11,
      local: false,
      representativeRow: [
        "What is bisect_left?",
        expect.stringContaining("def my_bisect_left(sl, a):\n    lo, hi = 0, len(sl)"),
        "py,binarysearch",
        "test/binarysearch/test_bisect_left.py",
      ],
    },
  ];
  for (const example of examples) {
    await page.goto("/import");
    await page.getByRole("button", { name: "Change", exact: true }).click();
    await page.getByRole("radio", { name: example.local ? /Local only/ : /Sync with account/ }).check();
    await page.getByRole("button", { name: example.label, exact: true }).click();
    await page.getByText("View CSV source", { exact: true }).click();
    const downloadReady = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download CSV", exact: true }).click();
    const download = await downloadReady;
    expect(download.suggestedFilename()).toBe(example.file);
    const path = testInfo.outputPath(example.file);
    await download.saveAs(path);
    const csv = await readFile(path, "utf8");
    const displayedCsv = await page.locator("details[data-import-sample] code").textContent();
    expect(displayedCsv?.replaceAll("\r\n", "\n")).toBe(csv.replaceAll("\r\n", "\n"));
    const parsed = Papa.parse<string[]>(csv);
    expect(parsed.errors).toEqual([]);
    // Generated sample cards follow filesystem traversal order; their contents must match regardless of position.
    expect(parsed.data).toContainEqual(example.representativeRow);
    expect(parsed.data).toHaveLength(example.count);
    expect(parsed.data.every((row) => row.length === 4 && row[3] !== "")).toBe(true);

    await page.getByRole("button", { name: "Try this example", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Review import" })).toBeVisible();
    await expect(page.getByText(`${example.count} valid`, { exact: true })).toBeVisible();
    const firstRow = parsed.data[0];
    if (firstRow === undefined) throw new Error("Example CSV has no cards");
    await expect(page.getByText(`uniqueKey: ${firstRow[3]}`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Choose file or example", exact: true }).click();
    await expect(page.getByRole("button", { name: "Basic", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sample deck", exact: true })).toBeVisible();
    await expect(page.getByRole("radio", { name: example.local ? /Local only/ : /Sync with account/ })).toBeChecked();
    await page.getByRole("button", { name: example.label, exact: true }).click();
    await page.getByRole("button", { name: "Try this example", exact: true }).click();
    await expect(page.getByText(`uniqueKey: ${firstRow[3]}`, { exact: true })).toBeVisible();
    const localBefore = await readLocalData(page);
    expect(localBefore.decks.some(({ name }: { name?: string }) => name === example.file)).toBe(false);
    expect((await documentsForUid("deck", uid)).some((deck) => deck.fields.name?.stringValue === example.file)).toBe(
      false
    );
    await page.getByRole("button", { name: `Add ${example.count} cards`, exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("status").filter({ hasText: `Imported ${example.count} cards.` })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: `View ${example.file}`, exact: true })).toBeVisible();
    const local = await readLocalData(page);
    const remoteDecks = await documentsForUid("deck", uid);
    if (example.local) {
      const deck = local.decks.find(({ name }: { name?: string }) => name === example.file);
      expect(deck).toBeDefined();
      const cards = local.cards.filter(({ deckId }: { deckId?: string }) => deckId === deck.id);
      expect(cards).toHaveLength(example.count);
      expect(remoteDecks.some((item) => item.fields.name?.stringValue === example.file)).toBe(false);
    } else {
      const deck = remoteDecks.find((item) => item.fields.name?.stringValue === example.file);
      if (deck == null) throw new Error("Example deck was not saved remotely");
      const cards = (await documentsForUid("card", uid)).filter(
        (card) => card.fields.deckId?.stringValue === documentId(deck)
      );
      expect(cards).toHaveLength(example.count);
      expect(local.decks.some(({ name }: { name?: string }) => name === example.file)).toBe(false);
    }
    await page.getByRole("button", { name: `View ${example.file}`, exact: true }).click();
    await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(example.count);
  }
});

test("IMPORT-07 Sample Deck is initialized once", async ({ fixture, page }) => {
  const sampleDeckId = fixture.id("sample-v1");
  expect(fixture.state.browser.preferences.loadSample).toBe(true);
  await fixture.apply(page);

  await page.goto("/");
  await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
  const initialSample = await readSampleState(page, sampleDeckId);
  expect(initialSample.deckIds).toHaveLength(1);
  expect(initialSample.cardIds.length).toBeGreaterThan(0);

  await page.reload();
  await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
  const reloadedSample = await readSampleState(page, sampleDeckId);
  expect(reloadedSample).toEqual(initialSample);
});
