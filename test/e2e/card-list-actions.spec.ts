import { expect, listDocuments, requireDocument, test } from "./utils/fixtures";
import type { Locator, Page } from "@playwright/test";

const expectOrder = async (rows: Locator, names: string[]) => {
  // Given: Use this case's inputs and any shared test setup.
  // When: Observe the prepared result through the following checks.
  // Then: Verify the expected result in the assertions below.
  await expect(rows).toHaveCount(names.length);
  for (const [index, name] of names.entries()) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
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
  // Given: Prepare `deck`, `oldest`, `newest` and any shared test state below.
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
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  // Then: Verify the expected result in the assertions below.
  await expect(sort).toHaveValue("newest");
  await expectOrder(rows, [newest.frontText, tied.frontText, oldest.frontText]);
  await expect(page.getByText("3 cards", { exact: true })).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: `View ${oldest.frontText}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `View ${oldest.frontText}` }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Close card" })).toContainText(oldest.backText);
  // When: Exercise `page.getByRole("button", { name: "Close card" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Close card" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(sort).toHaveValue("newest");
  expect(await savedDocuments(fixture.user().uid)).toEqual(before);
});

test("CARD-LIST-ACTIONS-03 restores standard order and resets sorting when revisiting", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `cards`, `sort` and any shared test state below.
  const deck = fixture.deck();
  const cards = [fixture.card("card-1"), fixture.card("card-2"), fixture.card("card-3")];
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}`);
  const sort = page.getByRole("combobox", { name: "Sort order" });
  // When: Exercise `sort.selectOption` with the prepared inputs.
  await sort.selectOption("newest");
  const before = await savedDocuments(fixture.user().uid);
  await sort.focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Tab");
  // Then: Verify the expected result in the assertions below.
  await expect(sort).toHaveValue("standard");
  await expectOrder(
    page.getByRole("button", { name: /^View / }),
    cards.map(({ frontText }) => frontText)
  );
  // When: Exercise `sort.selectOption` with the prepared inputs.
  await sort.selectOption("newest");
  await page.getByRole("button", { name: "tango", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  // When: Exercise `page.goBack` with the prepared inputs.
  await page.goBack();
  // Then: Verify the expected result in the assertions below.
  await expect(sort).toHaveValue("standard");
  expect(await savedDocuments(fixture.user().uid)).toEqual(before);
});

const clickCheckboxLabel = async (page: Page, name: string) => {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await checkbox.locator("xpath=parent::label").click();
  return checkbox;
};

test("CARD-LIST-ACTIONS-01 persists tag filters and applies them after reload", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `matching`, `wrongTag` and any shared test state below.
  const deck = fixture.deck();
  const matching = fixture.card("card-1");
  const wrongTag = fixture.card("card-2");
  const anotherCard = fixture.card("card-3");
  const [selectedTag] = matching.tags;
  if (selectedTag === undefined) throw new Error("CARD-LIST-ACTIONS-01 fixture requires a matching Card tag");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  // When: Exercise `page.getByText("Filters", { exact: true }).click` with the prepared inputs.
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
  // Then: Verify the expected result in the assertions below.
  await expect(selectedChip).toBeFocused();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("Space");
  const summary = page.locator("summary").filter({ hasText: "Filters" });
  // Then: Verify the expected result in the assertions below.
  await expect(summary).toBeFocused();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("Enter");
  await clickCheckboxLabel(page, selectedTag);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Save filters" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: `View ${matching.frontText}` })).toBeEnabled();
  await expect
    .poll(async () => (await requireDocument("deck", deck.id)).fields.cardFilter?.mapValue?.fields)
    .toEqual({
      selectedTags: { arrayValue: { values: [{ stringValue: selectedTag }] } },
      tagAndFilter: { booleanValue: false },
    });
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();

  await page.getByText("Filters", { exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("checkbox", { name: selectedTag })).toBeChecked();
  await expect(page.getByRole("button", { name: `View ${matching.frontText}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${anotherCard.frontText}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `View ${wrongTag.frontText}` })).toHaveCount(0);
  await expect
    .poll(async () => (await requireDocument("deck", deck.id)).fields.cardFilter?.mapValue?.fields)
    .toEqual({
      selectedTags: { arrayValue: { values: [{ stringValue: selectedTag }] } },
      tagAndFilter: { booleanValue: false },
    });
});
