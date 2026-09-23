import { expect, listDocuments, requireDocument, test } from "./utils/fixtures";
import type { Locator, Page } from "@playwright/test";

const expectOrder = async (rows: Locator, names: string[]) => {
  await expect(rows).toHaveCount(names.length);
  for (const [index, name] of names.entries()) {
    await expect(rows.nth(index)).toHaveAccessibleName(`View ${name}`);
  }
};

const savedDocuments = async (uid: string) =>
  Promise.all(
    (["deck", "card", "studySession", "studyAnswer"] as const).map(async (collection) =>
      (await listDocuments(collection)).filter(({ fields }) => fields.uid?.stringValue === uid)
    )
  );

test("CARD-LIST-ACTIONS-02 sorts newest first with stable ties without changing saved data", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const oldest = fixture.card("card-1");
  const newest = fixture.card("card-2");
  const tied = fixture.card("card-3");
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  const rows = page.getByRole("button", { name: /^View / });
  await expectOrder(rows, [oldest.frontText, newest.frontText, tied.frontText]);
  const before = await savedDocuments(fixture.user().uid);
  const sort = page.getByRole("combobox", { name: "Sort order" });
  await sort.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(sort).toHaveValue("newest");
  await expectOrder(rows, [newest.frontText, tied.frontText, oldest.frontText]);
  await expect(page.getByText("3 cards", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: `View ${oldest.frontText}` }).click();
  await expect(page.getByRole("button", { name: "Close card" })).toContainText(oldest.backText);
  await page.getByRole("button", { name: "Close card" }).click();
  await expect(sort).toHaveValue("newest");
  expect(await savedDocuments(fixture.user().uid)).toEqual(before);
});

test("CARD-LIST-ACTIONS-03 restores standard order and resets sorting when revisiting", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const cards = [fixture.card("card-1"), fixture.card("card-2"), fixture.card("card-3")];
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  const sort = page.getByRole("combobox", { name: "Sort order" });
  await sort.selectOption("newest");
  const before = await savedDocuments(fixture.user().uid);
  await sort.focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Tab");
  await expect(sort).toHaveValue("standard");
  await expectOrder(
    page.getByRole("button", { name: /^View / }),
    cards.map(({ frontText }) => frontText)
  );
  await sort.selectOption("newest");
  await page.getByRole("button", { name: "tango", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  await page.goBack();
  await expect(sort).toHaveValue("standard");
  expect(await savedDocuments(fixture.user().uid)).toEqual(before);
});

const clickCheckboxLabel = async (page: Page, name: string) => {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await checkbox.locator("xpath=parent::label").click();
  return checkbox;
};

test("CARD-LIST-ACTIONS-01 persists tag filters and applies them after reload", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const matching = fixture.card("card-1");
  const wrongTag = fixture.card("card-2");
  const anotherCard = fixture.card("card-3");
  const [selectedTag] = matching.tags;
  if (selectedTag === undefined) throw new Error("CARD-LIST-ACTIONS-01 fixture requires a matching Card tag");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  await page.getByText("Filters", { exact: true }).click();
  await clickCheckboxLabel(page, selectedTag);
  const extraTag = wrongTag.tags[0];
  if (extraTag === undefined) throw new Error("CARD-LIST-ACTIONS-01 fixture requires another Card tag");
  await clickCheckboxLabel(page, extraTag);
  await page.getByText("Filters", { exact: true }).click();
  const selectedChip = page.getByRole("button", { name: `Remove ${selectedTag} filter` });
  const extraChip = page.getByRole("button", { name: `Remove ${extraTag} filter` });
  await extraChip.focus();
  await page.keyboard.press("Enter");
  await expect(selectedChip).toBeFocused();
  await page.keyboard.press("Space");
  const summary = page.locator("summary").filter({ hasText: "Filters" });
  await expect(summary).toBeFocused();
  await page.keyboard.press("Enter");
  await clickCheckboxLabel(page, selectedTag);
  await expect(page.getByRole("button", { name: "Save filters" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: `View ${matching.frontText}` })).toBeEnabled();
  await expect
    .poll(async () => (await requireDocument("deck", deck.id)).fields.selectedTags?.arrayValue?.values)
    .toEqual([{ stringValue: selectedTag }]);
  await page.reload();

  await page.getByText("Filters", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: selectedTag })).toBeChecked();
  await expect(page.getByRole("button", { name: `View ${matching.frontText}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${anotherCard.frontText}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${wrongTag.frontText}` })).toHaveCount(0);
  await expect
    .poll(async () => (await requireDocument("deck", deck.id)).fields.selectedTags?.arrayValue?.values)
    .toEqual([{ stringValue: selectedTag }]);
});
