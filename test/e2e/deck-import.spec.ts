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
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
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

  test("DECK-IMPORT-01 A valid CSV is previewed without persistence", async ({ fixture, page, namespace }) => {
    const { uid, upload, uploadArea } =
      await test.step("Given: The CSV upload control has a visible keyboard focus outline", async () => {
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
        return { uid, upload, uploadArea };
      });
    await test.step("When: Tab from upload to the CSV format disclosure", async () => {
      await page.keyboard.press("Tab");
    });
    await test.step("Then: Focus moves and the upload outline is removed", async () => {
      await expect(page.getByText("CSV format", { exact: true })).toBeFocused();
      await expect(uploadArea).toHaveCSS("outline-style", "none");
    });
    await test.step("When: Shift-Tab back to upload", async () => {
      await page.keyboard.press("Shift+Tab");
    });
    await test.step("Then: Upload focus and its outline return", async () => {
      await expect(upload).toBeFocused();
      await expect(uploadArea).toHaveCSS("outline-style", "solid");
    });
    await test.step("When: Shift-Tab away from upload", async () => {
      await page.keyboard.press("Shift+Tab");
    });
    await test.step("Then: The upload outline is removed again", async () => {
      await expect(uploadArea).toHaveCSS("outline-style", "none");
    });
    const { file } = await test.step("When: Select a valid CSV file", async () => {
      const file = validCsv(namespace.id("preview"));
      await page.getByLabel("Upload a csv file").setInputFiles(file);
      return { file };
    });
    await test.step("Then: A valid preview is shown without saving any data", async () => {
      await expect(page.getByRole("heading", { level: 2, name: "Review import" })).toBeVisible();
      await expect(page.getByText(file.name, { exact: true }).first()).toBeVisible();
      await expect(page.getByText("2 valid")).toBeVisible();
      await expect(page.getByText(`front ${namespace.id("preview")} one`, { exact: true })).toBeVisible();
      await expect(page.getByText(`back ${namespace.id("preview")} two`, { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Add \d+ cards?$/u })).toBeEnabled();
      expect(await documentsForUid("deck", uid)).toEqual([]);
      expect(await documentsForUid("card", uid)).toEqual([]);
    });
  });

  for (const invalid of [
    {
      name: "Blank unique keys",
      row: '"invalid front","invalid back","tag",""',
      message: "Unique key is required.",
    },
    {
      name: "Three-column rows",
      row: '"invalid front","invalid back","key"',
      message: "Expected 4 columns, found 3.",
    },
  ]) {
    test(`DECK-IMPORT-02 ${invalid.name} block persistence`, async ({ fixture, page, namespace }) => {
      const { uid } = await test.step("Given: A CSV import page with an isolated account", async () => {
        const { uid } = fixture.user();
        await fixture.apply(page);
        await page.goto("/import");
        return { uid };
      });
      await test.step("When: Select a CSV containing the invalid row", async () => {
        await page
          .getByLabel("Upload a csv file")
          .setInputFiles(
            csvFile(`${namespace.id("invalid")}.csv`, [
              `"valid front","valid back","","${namespace.id("valid-key")}"`,
              invalid.row,
            ])
          );
      });
      await test.step("Then: Row diagnostics block importing and preserve saved data", async () => {
        const validation = page.getByRole("alert");
        await expect(validation).toContainText("Row 2");
        await expect(validation).toContainText(invalid.message);
        await expect(page.getByText("1 invalid")).toBeVisible();
        await expect(page.getByRole("button", { name: /^Add \d+ cards?$/u })).toBeDisabled();
        expect(await documentsForUid("deck", uid)).toEqual([]);
        expect(await documentsForUid("card", uid)).toEqual([]);
      });
    });
  }

  test("DECK-IMPORT-11 A corrected file at the same path can be selected repeatedly", async ({
    fixture,
    page,
  }, testInfo) => {
    const { uid, path, upload } =
      await test.step("Given: An invalid UTF-8 file ready for repeated selection", async () => {
        const { uid } = fixture.user();
        await fixture.apply(page);
        await page.goto("/import");
        const path = testInfo.outputPath("retry.csv");
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, Buffer.from([0x82, 0xa0, 44, 98, 44, 44, 107]));
        const upload = page.getByLabel("Upload a csv file");
        return { uid, path, upload };
      });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await test.step("When: Select the invalid file from the same path", async () => {
        await upload.setInputFiles(path);
      });
      await test.step("Then: Encoding diagnostics appear and the picker is reset", async () => {
        await expect(page.getByRole("alert")).toContainText("This CSV cannot be read as UTF-8.");
        await expect(upload).toHaveValue("");
      });
    }
    await test.step("When: Correct the file contents and select it again", async () => {
      await writeFile(path, "corrected front,corrected back,,corrected-key");
      await upload.setInputFiles(path);
    });
    await test.step("Then: The corrected card can be imported", async () => {
      await expect(page.getByText("corrected front", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Add 1 card", exact: true })).toBeEnabled();
    });
    await test.step("When: Cancel the file picker without changing its selection", async () => {
      // Model the picker's cancel event without clearing or replacing its selected files.
      await upload.dispatchEvent("cancel");
    });
    await test.step("Then: The valid preview remains available", async () => {
      await expect(page.getByText("corrected front", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Add 1 card", exact: true })).toBeEnabled();
    });
    await test.step("When: Replace the file with a row missing its unique key", async () => {
      await writeFile(path, "invalid front,back,,");
      await upload.setInputFiles(path);
    });
    await test.step("Then: Validation blocks importing the invalid row", async () => {
      await expect(page.getByRole("alert")).toContainText("Unique key is required.");
      await expect(page.getByRole("button", { name: "Add 0 cards", exact: true })).toBeDisabled();
    });
    await test.step("When: Correct the file again at the same path", async () => {
      await writeFile(path, "latest front,latest back,,latest-key");
      await upload.setInputFiles(path);
    });
    await test.step("Then: The latest valid preview replaces stale diagnostics without saving", async () => {
      await expect(page.getByText("latest front", { exact: true })).toBeVisible();
      await expect(page.getByText("latest back", { exact: true })).toBeVisible();
      await expect(page.getByText("retry.csv", { exact: true }).first()).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Add 1 card", exact: true })).toBeEnabled();
      expect(await documentsForUid("deck", uid)).toEqual([]);
      expect(await documentsForUid("card", uid)).toEqual([]);
    });
  });

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
    await test.step("When: Preview an earlier valid file", async () => {
      await page.getByLabel("Upload a csv file").setInputFiles(validCsv(namespace.id("previous")));
    });
    await test.step("Then: Its valid card count is shown", async () => {
      await expect(page.getByText("2 valid")).toBeVisible();
    });
    await test.step("When: Replace the selection with an invalid UTF-8 file", async () => {
      await page.getByRole("button", { name: "Choose file or example" }).click();
      await page.getByLabel("Upload a csv file").setInputFiles({
        name: "invalid.csv",
        mimeType: "text/csv",
        buffer: Buffer.from([0x82, 0xa0, 44, 98, 44, 44, 107]),
      });
    });
    await test.step("Then: Encoding errors remove the previous import action", async () => {
      await expect(page.getByRole("alert")).toContainText(
        "This CSV cannot be read as UTF-8. Save it as UTF-8 and select it again."
      );
      await expect(page.getByRole("button", { name: /^Add \d+ cards?$/u })).toHaveCount(0);
    });
    await test.step("When: Leave the failed preview", async () => {
      await page.goto("/");
    });
    await test.step("Then: No deck was imported", async () => {
      await expect(page.getByRole("article")).toHaveCount(0);
    });
    await test.step("When: Reopen the import page", async () => {
      await page.goto("/import");
    });
    await test.step("Then: Previewing created no remote records", async () => {
      expect(await documentsForUid("deck", uid)).toEqual([]);
      expect(await documentsForUid("card", uid)).toEqual([]);
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
      const { uid } = await test.step("Given: A linked account ready to use a built-in CSV example", async () => {
        const { uid } = fixture.user();
        await fixture.apply(page, { auth: { linked: true } });
        await page.goto("/import");
        return { uid };
      });
      const { download } = await test.step("When: Open the example source and download its CSV", async () => {
        await page.getByRole("button", { name: example.label, exact: true }).click();
        await page.getByText("View CSV source", { exact: true }).click();
        const downloadReady = page.waitForEvent("download");
        await page.getByRole("button", { name: "Download CSV", exact: true }).click();
        const download = await downloadReady;
        return { download };
      });
      const { parsed } =
        await test.step("Then: The download matches the displayed source and documented card fields", async () => {
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
          return { parsed };
        });
      await test.step("When: Preview the example for import", async () => {
        await page.getByRole("button", { name: "Try this example", exact: true }).click();
      });
      const { firstRow } =
        await test.step("Then: The preview displays the valid cards and their unique keys", async () => {
          await expect(page.getByRole("heading", { name: "Review import" })).toBeVisible();
          await expect(page.getByText(`${example.count} valid`, { exact: true })).toBeVisible();
          const firstRow = parsed.data[0];
          if (firstRow === undefined) throw new Error("Example CSV has no cards");
          await expect(page.getByText(`uniqueKey: ${firstRow[3]}`, { exact: true })).toBeVisible();
          return { firstRow };
        });
      await test.step("When: Return to file or example selection", async () => {
        await page.getByRole("button", { name: "Choose file or example", exact: true }).click();
      });
      await test.step("Then: Built-in examples are available again", async () => {
        await expect(page.getByRole("button", { name: "Basic", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Sample deck", exact: true })).toBeVisible();
      });
      await test.step("When: Reopen the same example preview", async () => {
        await page.getByRole("button", { name: example.label, exact: true }).click();
        await page.getByRole("button", { name: "Try this example", exact: true }).click();
      });
      await test.step("Then: The same unique key is shown without creating a deck", async () => {
        await expect(page.getByText(`uniqueKey: ${firstRow[3]}`, { exact: true })).toBeVisible();
        expect(
          (await documentsForUid("deck", uid)).some((document) => document.fields.name?.stringValue === example.file)
        ).toBe(false);
      });
      await test.step("When: Confirm the example import", async () => {
        await page.getByRole("button", { name: `Add ${example.count} cards`, exact: true }).click();
      });
      await test.step("Then: The deck list shows import success feedback", async () => {
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByRole("status").filter({ hasText: `Imported ${example.count} cards.` })).toBeVisible();
      });
      await test.step("When: Reload the deck list", async () => {
        await page.reload();
      });
      await test.step("Then: The imported example deck remains available", async () => {
        await expect(page.getByRole("button", { name: `Open cards in ${example.file}`, exact: true })).toBeVisible();
      });
      await test.step("When: Open the imported example deck", async () => {
        await page.getByRole("button", { name: `Open cards in ${example.file}`, exact: true }).click();
      });
      await test.step("Then: Its saved card count matches the example", async () => {
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
    });
  }

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
});
