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
    await test.step("Given: A fresh browser without an authenticated account", async () => {
      await fixture.apply(page, { auth: false });
    });
    await test.step("When: Preview and confirm the Sample deck import", async () => {
      await previewSample(page);
      await confirmSample(page);
    });
    await test.step("Then: The imported deck appears with success feedback", async () => {
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("status").filter({ hasText: `Imported ${sampleCards.length} cards.` })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true })).toBeVisible();
    });
    await test.step("When: Open the account screen", async () => {
      await page.getByRole("button", { name: "Open account", exact: true }).click();
    });
    await test.step("Then: The account is anonymous and every imported card stays local", async () => {
      await expect(page.getByText("Anonymous account", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign in with Google", exact: true })).toBeVisible();
      const uid = (
        await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").textContent()
      )?.trim();
      if (!uid) throw new Error("The anonymous account has no User ID");
      expect(
        (await downloadDeckCards(page, sampleName)).sort((a, b) =>
          String(a.uniqueKey).localeCompare(String(b.uniqueKey))
        )
      ).toEqual(expectedCards);
      expect(await documentsForUid("deck", uid)).toEqual([]);
      expect(await documentsForUid("card", uid)).toEqual([]);
    });
    await test.step("When: Return to the deck list", async () => {
      await page.getByRole("button", { name: "tango", exact: true }).click();
    });
    await test.step("Then: The deck list opens", async () => {
      await expect(page).toHaveURL(/\/$/);
    });
    await test.step("When: Reload and open the imported deck", async () => {
      await page.reload();
      await page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true }).click();
    });
    await test.step("Then: All imported cards survive reload", async () => {
      await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
    });
  });

  test("DECK-IMPORT-08 A local Sample deck preserves every card and can be studied after reload", async ({
    fixture,
    page,
  }) => {
    const { uid } = await test.step("Given: An anonymous session with a Sample deck preview", async () => {
      const { uid } = fixture.user();
      await fixture.apply(page);
      await previewSample(page);
      return { uid };
    });
    await test.step("When: Leave the preview and open it again", async () => {
      await page.goto("/");
    });
    await test.step("Then: Leaving the preview creates no deck", async () => {
      await expect(page.getByRole("article")).toHaveCount(0);
    });
    await test.step("When: Preview the Sample deck again", async () => {
      await previewSample(page);
    });
    await test.step("Then: Previewing creates no remote data", async () => {
      expect(await documentsForUid("deck", uid)).toEqual([]);
      expect(await documentsForUid("card", uid)).toEqual([]);
    });
    await test.step("When: Confirm the Sample deck import", async () => {
      await confirmSample(page);
    });
    await test.step("Then: The imported deck appears with success feedback", async () => {
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("status").filter({ hasText: `Imported ${sampleCards.length} cards.` })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true })).toBeVisible();
    });
    await test.step("When: Reload and open the imported deck", async () => {
      await page.reload();
      await page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true }).click();
    });
    await test.step("Then: Every imported card is restored locally without a remote duplicate", async () => {
      await expect(page.getByRole("article")).toHaveCount(sampleCards.length);
      await expect(page.getByText("What is bisect_left?", { exact: true })).toBeVisible();

      expect(
        (await downloadDeckCards(page, sampleName)).sort((a, b) =>
          String(a.uniqueKey).localeCompare(String(b.uniqueKey))
        )
      ).toEqual(expectedCards);
      expect(await documentsForUid("deck", uid)).toEqual([]);
      expect(await documentsForUid("card", uid)).toEqual([]);
    });
    await test.step("When: Start studying the imported deck and reveal its answer", async () => {
      await page.goto("/");
      await page.getByRole("button", { name: `Study ${sampleName}`, exact: true }).click();
      await page.getByRole("button", { name: /^Start \d+ cards$/u }).click();
      await page.locator("#frontText").click();
    });
    await test.step("Then: The imported answer can be studied", async () => {
      await expect(page.getByRole("region", { name: "Study answer" })).toBeVisible();
      await expect(page.getByRole("region", { name: "Study answer" })).toContainText("import pytest");
    });
  });

  test("DECK-IMPORT-09 A linked account syncs every Sample deck card without duplicates", async ({ fixture, page }) => {
    const { uid } = await test.step("Given: A linked account ready to import the Sample deck", async () => {
      const { uid } = fixture.user();
      await fixture.apply(page, { auth: { linked: true } });
      return { uid };
    });
    await test.step("When: Preview and confirm the Sample deck import", async () => {
      await previewSample(page);
      await confirmSample(page);
    });
    await test.step("Then: The imported deck appears with success feedback", async () => {
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("status").filter({ hasText: `Imported ${sampleCards.length} cards.` })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true })).toBeVisible();
    });
    await test.step("When: Reload and open the imported deck", async () => {
      await page.reload();
      await page.getByRole("button", { name: `Open cards in ${sampleName}`, exact: true }).click();
    });
    await test.step("Then: All Sample deck fields sync once without duplicate cards", async () => {
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
});

test.describe("import", () => {
  const readSampleState = async (page: Page, sampleDeckId: string) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Open cards in Sample Deck", exact: true })).toHaveCount(1);
    await page.getByRole("button", { name: "Open cards in Sample Deck", exact: true }).click();
    await expect(page).toHaveURL(`/deck/${sampleDeckId}`);
    await expect(page.getByRole("button", { name: /^View / })).toHaveCount(sampleCards.length);
    const names = await page.getByRole("button", { name: /^View / }).allTextContents();
    const contents = await downloadDeckCards(page, "Sample Deck", sampleCards.length);
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

  test("DECK-IMPORT-03 A remote CSV import survives reload", async ({ fixture, page, namespace }) => {
    const { uid, csvNamespace, file } =
      await test.step("Given: A linked account with a valid CSV ready to import", async () => {
        const { uid } = fixture.user();
        await fixture.apply(page, { auth: { linked: true } });
        await page.goto("/import");
        const csvNamespace = namespace.id("remote");
        const file = validCsv(csvNamespace);
        return { uid, csvNamespace, file };
      });
    await test.step("When: Select the CSV file", async () => {
      await page.getByLabel("Upload a csv file").setInputFiles(file);
    });
    await test.step("Then: Two valid cards are previewed", async () => {
      await expect(page.getByText("2 valid")).toBeVisible();
    });
    await test.step("When: Confirm the remote CSV import", async () => {
      await page.getByRole("button", { name: /^Add \d+ cards?$/u }).click();
    });
    const { deckId } = await test.step("Then: One deck and its two cards are saved with success feedback", async () => {
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("status").filter({ hasText: "Imported 2 cards." })).toBeVisible();

      await expect.poll(async () => (await documentsForUid("deck", uid)).length).toBe(1);
      await expect.poll(async () => (await documentsForUid("card", uid)).length).toBe(2);
      const [remoteDeck] = await documentsForUid("deck", uid);
      if (remoteDeck == null) throw new Error("Imported remote Deck was not found");
      expect(remoteDeck.fields.name?.stringValue).toBe(file.name);
      const deckId = documentId(remoteDeck);
      if (deckId === "") throw new Error("Imported remote Deck id was not found");
      return { deckId };
    });
    await test.step("When: Reload and open the imported deck", async () => {
      await page.reload();
      await page.getByRole("button", { name: `Open cards in ${file.name}` }).click();
    });
    await test.step("Then: Both cards remain associated with the imported deck", async () => {
      await expect(page.getByText(`front ${csvNamespace} one`, { exact: true })).toBeVisible();
      await expect(page.getByText(`front ${csvNamespace} two`, { exact: true })).toBeVisible();
      expect(
        (await documentsForUid("card", uid)).every((document) => document.fields.deckId?.stringValue === deckId)
      ).toBe(true);
    });
  });

  test("DECK-IMPORT-04 A local-only CSV import survives reload and can be studied", async ({
    fixture,
    page,
    namespace,
  }) => {
    const { uid, csvNamespace, file } =
      await test.step("Given: An anonymous import page with a UTF-8 CSV ready", async () => {
        const { uid } = fixture.user();
        await fixture.apply(page);
        await page.goto("/import");
        const csvNamespace = namespace.id("local");
        const file = csvFile(`${csvNamespace}.csv`, [
          '"日本語�","回答�","タグ","utf8-key"',
          `"front ${csvNamespace} two","back ${csvNamespace} two","","second-key"`,
        ]);
        return { uid, csvNamespace, file };
      });
    await test.step("When: Select the valid UTF-8 CSV", async () => {
      await page.getByLabel("Upload a csv file").setInputFiles(file);
    });
    await test.step("Then: Unicode card text is previewed correctly", async () => {
      await expect(page.getByText("2 valid")).toBeVisible();
      await expect(page.getByText("日本語�", { exact: true })).toBeVisible();
      await expect(page.getByText("回答�", { exact: true })).toBeVisible();
    });
    await test.step("When: Confirm the local CSV import", async () => {
      await page.getByRole("button", { name: /^Add \d+ cards?$/u }).click();
    });
    await test.step("Then: The deck appears with import success feedback", async () => {
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("status").filter({ hasText: "Imported 2 cards." })).toBeVisible();
    });
    await test.step("When: Reload the deck list", async () => {
      await page.reload();
    });
    await test.step("Then: One local deck retains every imported field without remote writes", async () => {
      await expect(page.getByRole("button", { name: `Open cards in ${file.name}` })).toBeVisible();
      await expect(page.getByRole("button", { name: `Open cards in ${file.name}`, exact: true })).toHaveCount(1);
      const contents = await downloadDeckCards(page, file.name);
      expect(contents).toHaveLength(2);
      expect(contents).toContainEqual({
        frontText: "日本語�",
        backText: "回答�",
        tags: ["タグ"],
        uniqueKey: "utf8-key",
      });
      expect(await documentsForUid("deck", uid)).toEqual([]);
      expect(await documentsForUid("card", uid)).toEqual([]);
    });
    await test.step("When: Start studying the imported deck", async () => {
      await page.getByRole("button", { name: `Study ${file.name}` }).click();
      await page.getByRole("button", { name: "Start 2 cards" }).click();
    });
    await test.step("Then: An imported card is available for study", async () => {
      await expect(page.getByText(new RegExp(`^(日本語�|front ${csvNamespace} two)$`))).toBeVisible();
    });
  });

  test("DECK-IMPORT-07 Sample Deck is initialized once", async ({ fixture, page }) => {
    const { sampleDeckId, initialSample } =
      await test.step("Given: Sample Deck initialization is enabled with its initial cards loaded", async () => {
        const sampleDeckId = `${fixture.user().uid}-sample-v1`;
        expect(fixture.state.browser.preferences.loadSample).toBe(true);
        await fixture.apply(page);

        await page.goto("/");
        await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
        await expect(page.getByRole("article", { name: "Sample Deck", exact: true })).toContainText(
          `${sampleCards.length} cards`
        );
        const initialSample = await readSampleState(page, sampleDeckId);
        expect(initialSample.names.length).toBeGreaterThan(0);
        expect(initialSample.contents).toHaveLength(initialSample.names.length);
        return { sampleDeckId, initialSample };
      });
    await test.step("When: Reload the initialized Sample Deck", async () => {
      await page.reload();
    });
    await test.step("Then: The same cards and contents are restored without reinitialization", async () => {
      await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
      const reloadedSample = await readSampleState(page, sampleDeckId);
      expect(reloadedSample).toEqual(initialSample);
    });
  });

  test("DECK-IMPORT-05 A rejected queued import rolls back without automatic replay", async ({
    browserErrors,
    fixture,
    namespace,
    page,
  }) => {
    const { uid, fault } =
      await test.step("Given: A linked account with a valid import preview and write failure prepared", async () => {
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
        return { uid, fault };
      });
    await test.step("When: Confirm the import with the queued card write rejected", async () => {
      await page.getByRole("button", { name: /^Add \d+ cards?$/u }).click();
    });
    await test.step("Then: Permission feedback is shown and importing remains available", async () => {
      await expect.poll(fault.wasTriggered).toBe(true);
      await fault.waitForFailure();
      await expect(page.getByRole("alert")).toContainText("You do not have permission to import this data.");
      await expect(page).toHaveURL(/\/import$/);
      await expect(page.getByRole("status").filter({ hasText: "Imported 1 card." })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Add \d+ cards?$/u })).toBeEnabled();
    });
    await test.step("When: Remove the injected fault", async () => {
      await fault.dispose();
    });
    await test.step("Then: No card was saved while the deck remains", async () => {
      expect(await documentsForUid("card", uid)).toEqual([]);
      expect(await documentsForUid("deck", uid)).toHaveLength(1);
    });
    await test.step("When: Reload the import page", async () => {
      await page.reload();
    });
    await test.step("Then: The rejected card write is not replayed", async () => {
      expect(await documentsForUid("card", uid)).toEqual([]);
    });
  });
});
