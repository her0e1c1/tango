import type { Page } from "@playwright/test";

import { allowExpectedFirestoreWriteFailure, expect, failNextFirestoreWrite, requireDocument, test } from "./fixtures";

const cardArticle = (page: Page, frontText: string) =>
  page.getByRole("button", { name: `View ${frontText}`, exact: true }).locator("xpath=ancestor::article[1]");

const expectDifficulty = async (page: Page, frontText: string, difficulty: number) => {
  await expect(
    cardArticle(page, frontText)
      .locator("span")
      .filter({ hasText: new RegExp(`^${String(difficulty)}$`) })
  ).toBeVisible();
};

const swipeRight = async (page: Page, frontText: string) => {
  const target = page.getByRole("button", { name: `View ${frontText}`, exact: true });
  const box = await target.boundingBox();
  if (box === null) throw new Error("Card swipe target bounding box is unavailable");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 20, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 20, y);
  await page.mouse.up();
};

const openCardDeleteDialog = async (page: Page, frontText: string) => {
  await page.getByRole("button", { name: `Open actions for ${frontText}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  return page.getByRole("alertdialog", { name: "Delete card?" });
};

test("CARD-16 retries the same Card deletion after a handled failure", async ({ fixture, page, browserErrors }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
  allowExpectedFirestoreWriteFailure(browserErrors);

  const dialog = await openCardDeleteDialog(page, card.frontText);
  await dialog.getByRole("button", { name: "Delete card" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "Unable to delete this card. Check your connection and try again."
  );
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  const retryDialog = await openCardDeleteDialog(page, card.frontText);
  await retryDialog.getByRole("button", { name: "Delete card" }).click();

  await expect(retryDialog).not.toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toHaveCount(0);
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.deletedAt?.integerValue)
    .not.toBeUndefined();
});

test("CARD-17 confirms before discarding an unsaved Card edit", async ({ fixture, page, namespace }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const unsavedFrontText = `${namespace.caseId} unsaved front`;
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const frontText = page.getByRole("textbox", { name: "Front text" });
  await frontText.fill(unsavedFrontText);

  await page.getByRole("button", { name: "tango" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(frontText).toHaveValue(unsavedFrontText);
  await page.getByRole("button", { name: "tango" }).click();
  await dialog.getByRole("button", { name: "Discard changes" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: `View ${deck.name}` })).toBeVisible();
  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.frontText?.stringValue)
    .toBe(card.frontText);
});

test("CARD-18 retries the same Card-list difficulty change after a handled failure", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const deck = fixture.deck();
  const card = fixture.card("card-1");
  const unrelatedCard = fixture.card("card-2");
  const expectedDifficulty = card.difficulty - 1;
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: card.id });
  allowExpectedFirestoreWriteFailure(browserErrors);

  await swipeRight(page, card.frontText);
  await expect(page.getByText("Unable to save changes. Try again.", { exact: true })).toBeVisible();
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  await expectDifficulty(page, card.frontText, card.difficulty);
  await swipeRight(page, card.frontText);

  await expect
    .poll(async () => (await requireDocument("card", card.id)).fields.difficulty?.integerValue)
    .toBe(String(expectedDifficulty));
  await expect
    .poll(async () => (await requireDocument("card", unrelatedCard.id)).fields.difficulty?.integerValue)
    .toBe(String(unrelatedCard.difficulty));
  await expect(page.getByText("Unable to save changes. Try again.", { exact: true })).toHaveCount(0);
  await page.reload();
  await expectDifficulty(page, card.frontText, expectedDifficulty);
});

test("CARD-20 retries a partially failed bulk difficulty change with the same absolute value", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const deck = fixture.deck();
  const failedCard = fixture.card("card-1");
  const successfulCard = fixture.card("card-2");
  const excludedCard = fixture.card("card-3");
  const newDifficulty = 7;
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  await page.getByText("Filters", { exact: true }).click();
  await page.getByRole("combobox", { name: "Maximum difficulty" }).selectOption("4");
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: failedCard.id });
  allowExpectedFirestoreWriteFailure(browserErrors);

  const difficulty = page.getByRole("combobox", { name: "New difficulty" });
  await difficulty.selectOption(String(newDifficulty));
  await page.getByRole("button", { name: "Change difficulty" }).click();
  const dialog = page.getByRole("dialog", { name: "Change card difficulty?" });
  const applyChange = dialog.getByRole("button", { name: "Apply change" });
  await dialog.evaluate((element) => {
    const { documentElement } = element.ownerDocument;
    documentElement.dataset.bulkDifficultyPendingObserved = "false";
    const observer = new MutationObserver(() => {
      const buttons = [...element.querySelectorAll("button")];
      if (
        element.getAttribute("aria-busy") === "true" &&
        buttons.length > 0 &&
        buttons.every((button) => button.disabled) &&
        element.contains(element.ownerDocument.activeElement)
      ) {
        documentElement.dataset.bulkDifficultyPendingObserved = "true";
        observer.disconnect();
      }
    });
    observer.observe(element, { attributeFilter: ["aria-busy", "disabled"], attributes: true, subtree: true });
  });
  await applyChange.click();

  await expect(page.getByRole("alert")).toContainText("Updated 1 of 2. 1 card could not be updated. Try again.");
  expect(await page.locator("html").getAttribute("data-bulk-difficulty-pending-observed")).toBe("true");
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await fault.dispose();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(`Set 2 visible cards to difficulty ${String(newDifficulty)}.`);
  await expect(difficulty).toHaveValue(String(newDifficulty));
  await expect
    .poll(async () => (await requireDocument("card", failedCard.id)).fields.difficulty?.integerValue)
    .toBe(String(failedCard.difficulty));
  await expect
    .poll(async () => (await requireDocument("card", successfulCard.id)).fields.difficulty?.integerValue)
    .toBe(String(newDifficulty));

  await applyChange.click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await Promise.all(
    [failedCard, successfulCard].map((card) =>
      expect
        .poll(async () => (await requireDocument("card", card.id)).fields.difficulty?.integerValue)
        .toBe(String(newDifficulty))
    )
  );
  await expect
    .poll(async () => (await requireDocument("card", excludedCard.id)).fields.difficulty?.integerValue)
    .toBe(String(excludedCard.difficulty));
  await page.reload();

  await expectDifficulty(page, failedCard.frontText, newDifficulty);
  await expectDifficulty(page, successfulCard.frontText, newDifficulty);
  await expectDifficulty(page, excludedCard.frontText, excludedCard.difficulty);
});
