import { default as sampleCards } from "../../sample/build/output.json";
import {
  allowExpectedFirestoreWriteFailure,
  documentId,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  test,
} from "./utils/fixtures";
import { downloadDeckCards } from "./utils/ui-helpers";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import * as Papa from "papaparse";

test.describe("import-sample", () => {
  type SampleCard = (typeof sampleCards)[number];

  const sampleName = "deck-sample.csv";

  const byKey = (left: SampleCard, right: SampleCard) => left.uniqueKey.localeCompare(right.uniqueKey);

  const expectedCards = [...sampleCards].sort(byKey);

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

  test("DECK-IMPORT-10 A fresh anonymous session keeps the imported Sample deck local", async ({ fixture, page }) => {
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
    expect(
      (await downloadDeckCards(page, sampleName)).sort((a, b) => String(a.uniqueKey).localeCompare(String(b.uniqueKey)))
    ).toEqual(expectedCards);
    expect(await documentsForUid("deck", uid)).toEqual([]);
    expect(await documentsForUid("card", uid)).toEqual([]);

    await page.getByRole("button", { name: "tango", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.reload();
    await page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true }).click();
    await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
  });

  test("DECK-IMPORT-08 A local Sample deck preserves every card and can be studied after reload", async ({
    fixture,
    page,
  }) => {
    const { uid } = fixture.user();
    await fixture.apply(page);
    await previewSample(page);
    await page.goto("/");
    await expect(page.getByRole("article")).toHaveCount(0);
    await previewSample(page);
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

    expect(
      (await downloadDeckCards(page, sampleName)).sort((a, b) => String(a.uniqueKey).localeCompare(String(b.uniqueKey)))
    ).toEqual(expectedCards);
    expect(await documentsForUid("deck", uid)).toEqual([]);
    expect(await documentsForUid("card", uid)).toEqual([]);

    await page.goto("/");
    await page.getByRole("button", { name: `Study ${sampleName}`, exact: true }).click();
    await page.getByRole("button", { name: /^Start \d+ cards$/u }).click();
    await page.locator("#frontText").click();
    await expect(page.getByRole("region", { name: "Study answer" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Study answer" })).toContainText("import pytest");
  });

  test("DECK-IMPORT-09 A linked account syncs every Sample deck card without duplicates", async ({ fixture, page }) => {
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

    await expect
      .poll(async () => (await documentsForUid("deck", uid)).map(({ fields }) => fields.name?.stringValue))
      .toEqual([sampleName]);
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
    await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
  });
});

test.describe("import", () => {
  const readSampleState = async (page: Page, sampleDeckId: string) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Open cards in Sample Deck", exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: "Open cards in Sample Deck", exact: true }).click();
    await expect(page).toHaveURL(`/deck/${sampleDeckId}`);
    const names = await page.getByRole("button", { name: /^View / }).allTextContents();
    const contents = await downloadDeckCards(page, "Sample Deck");
    return { names, contents };
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

  test("DECK-IMPORT-01 A valid CSV is previewed without persistence", async ({ fixture, page, namespace }) => {
    const { uid } = fixture.user();
    await fixture.apply(page);
    await page.goto("/import");
    const upload = page.getByLabel("Upload a csv file");
    const uploadArea = page.locator("label").filter({ has: upload });
    await upload.focus();
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

  test("DECK-IMPORT-02 Invalid CSV rows block persistence", async ({ fixture, page, namespace }) => {
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
    await expect(page.getByRole("button", { name: /^Add \d+ cards?$/u })).toBeDisabled();
    expect(await documentsForUid("deck", uid)).toEqual([]);
    expect(await documentsForUid("card", uid)).toEqual([]);
  });

  test("DECK-IMPORT-03 A remote CSV import survives reload", async ({ fixture, page, namespace }) => {
    const { uid } = fixture.user();
    await fixture.apply(page, { auth: { linked: true } });
    await page.goto("/import");
    const csvNamespace = namespace.id("remote");
    const file = validCsv(csvNamespace);
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
    await page.getByRole("button", { name: `Open cards in ${file.name}` }).click();
    await expect(page.getByText(`front ${csvNamespace} one`, { exact: true })).toBeVisible();
    await expect(page.getByText(`front ${csvNamespace} two`, { exact: true })).toBeVisible();
    expect(
      (await documentsForUid("card", uid)).every((document) => document.fields.deckId?.stringValue === deckId)
    ).toBe(true);
  });

  test("DECK-IMPORT-04 A local-only CSV import survives reload and can be studied", async ({
    fixture,
    page,
    namespace,
  }) => {
    const { uid } = fixture.user();
    await fixture.apply(page);
    await page.goto("/import");
    const csvNamespace = namespace.id("local");
    const file = csvFile(`${csvNamespace}.csv`, [
      '"日本語�","回答�","タグ","utf8-key"',
      `"front ${csvNamespace} two","back ${csvNamespace} two","","second-key"`,
    ]);
    await page.getByLabel("Upload a csv file").setInputFiles(validCsv(namespace.id("previous")));
    await expect(page.getByText("2 valid")).toBeVisible();
    await page.getByRole("button", { name: "Choose file or example" }).click();
    await page.getByLabel("Upload a csv file").setInputFiles({
      name: "invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from([0x82, 0xa0, 44, 98, 44, 44, 107]),
    });
    await expect(page.getByRole("alert")).toContainText(
      "This CSV cannot be read as UTF-8. Save it as UTF-8 and select it again."
    );
    await expect(page.getByRole("button", { name: /^Add \d+ cards?$/u })).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByRole("article")).toHaveCount(0);
    await page.goto("/import");
    expect(await documentsForUid("deck", uid)).toEqual([]);
    expect(await documentsForUid("card", uid)).toEqual([]);
    await page.getByLabel("Upload a csv file").setInputFiles(file);
    await expect(page.getByText("2 valid")).toBeVisible();
    await expect(page.getByText("日本語�", { exact: true })).toBeVisible();
    await expect(page.getByText("回答�", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /^Add \d+ cards?$/u }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("status").filter({ hasText: "Imported 2 cards." })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: `Open cards in ${file.name}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `Open cards in ${file.name}`, exact: true })).toHaveCount(1);
    const contents = await downloadDeckCards(page, file.name);
    expect(contents).toHaveLength(2);
    expect(contents).toContainEqual({ frontText: "日本語�", backText: "回答�", tags: ["タグ"], uniqueKey: "utf8-key" });
    expect(await documentsForUid("deck", uid)).toEqual([]);
    expect(await documentsForUid("card", uid)).toEqual([]);

    await page.getByRole("button", { name: `Study ${file.name}` }).click();
    await page.getByRole("button", { name: "Start 2 cards" }).click();
    await expect(page.getByText(new RegExp(`^(日本語�|front ${csvNamespace} two)$`))).toBeVisible();
  });

  test("DECK-IMPORT-05 A rejected queued import reports failure without automatic replay", async ({
    browserErrors,
    fixture,
    namespace,
    page,
  }) => {
    allowExpectedFirestoreWriteFailure(browserErrors);
    const { uid } = fixture.user();
    await fixture.apply(page, { auth: { linked: true } });
    await page.goto("/import");
    const file = csvFile(`${namespace.id("retry")}.csv`, [
      `"retry front ${namespace.caseId}","retry back ${namespace.caseId}","","${namespace.id("retry-key")}"`,
    ]);
    await page.getByLabel("Upload a csv file").setInputFiles(file);
    await expect(page.getByText("1 valid")).toBeVisible();
    const fault = await failNextFirestoreWrite(page, { collection: "card" });

    await page.getByRole("button", { name: /^Add \d+ cards?$/u }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
    await expect(page.getByRole("alert")).toContainText("A data save or sync failed.");
    await fault.dispose();
    expect(await documentsForUid("card", uid)).toEqual([]);
    expect(await documentsForUid("deck", uid)).toHaveLength(1);
    await page.reload();
    expect(await documentsForUid("card", uid)).toEqual([]);
  });

  const examples = [
    {
      label: "Basic",
      file: "basic-sample.csv",
      count: 3,
      local: false,
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
      local: false,
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
  // Each example gets a fresh browser context and UID instead of accumulating reloads and pending streams.
  for (const example of examples) {
    test(`DECK-IMPORT-06 ${example.label} supports preview, download, and destination-aware import`, async ({
      fixture,
      page,
    }, testInfo) => {
      const { uid } = fixture.user();
      await fixture.apply(page, { auth: { linked: true } });
      await page.goto("/import");
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
      await page.getByRole("button", { name: example.label, exact: true }).click();
      await page.getByRole("button", { name: "Try this example", exact: true }).click();
      await expect(page.getByText(`uniqueKey: ${firstRow[3]}`, { exact: true })).toBeVisible();
      expect(
        (await documentsForUid("deck", uid)).some((document) => document.fields.name?.stringValue === example.file)
      ).toBe(false);
      await page.getByRole("button", { name: `Add ${example.count} cards`, exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("status").filter({ hasText: `Imported ${example.count} cards.` })).toBeVisible();
      await page.reload();
      await expect(page.getByRole("button", { name: `Open cards in ${example.file}`, exact: true })).toBeVisible();
      await page.getByRole("button", { name: `Open cards in ${example.file}`, exact: true }).click();
      const deckId = decodeURIComponent(new URL(page.url()).pathname.split("/").at(-1) ?? "");
      await expect
        .poll(
          async () =>
            (await documentsForUid("card", uid)).filter((card) => card.fields.deckId?.stringValue === deckId).length
        )
        .toBe(example.count);
      await expect(page.getByRole("heading", { name: "Cards", exact: true })).toBeVisible();
      await expect(page.getByRole("article")).toHaveCount(example.count);
    });
  }

  test("DECK-IMPORT-07 Sample Deck is initialized once", async ({ fixture, page }) => {
    const sampleDeckId = `${fixture.user().uid}-sample-v1`;
    expect(fixture.state.browser.preferences.loadSample).toBe(true);
    await fixture.apply(page);

    await page.goto("/");
    await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
    const initialSample = await readSampleState(page, sampleDeckId);
    expect(initialSample.names.length).toBeGreaterThan(0);
    expect(initialSample.contents).toHaveLength(initialSample.names.length);

    await page.reload();
    await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
    const reloadedSample = await readSampleState(page, sampleDeckId);
    expect(reloadedSample).toEqual(initialSample);
  });
});
