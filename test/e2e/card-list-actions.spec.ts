import { expect, requireDocument, test } from "./utils/fixtures";
import type { Page } from "@playwright/test";

const clickCheckboxLabel = async (page: Page, name: string) => {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await checkbox.locator("xpath=parent::label").click();
  return checkbox;
};

test("CARD-LIST-ACTIONS-01 restores the selected tag filter and matching cards after reload", async ({
  fixture,
  page,
}) => {
  const { deck, matching, wrongTag, anotherCard, selectedTag } =
    await test.step("Given: a deck with cards carrying different tags", async () => {
      const deck = fixture.deck();
      const matching = fixture.card("card-1");
      const wrongTag = fixture.card("card-2");
      const anotherCard = fixture.card("card-3");
      const selectedTag = matching.tags[0];
      if (selectedTag === undefined) throw new Error("A matching Card tag is required");
      await fixture.apply(page);
      await page.goto(`/deck/${deck.id}`);
      return { deck, matching, wrongTag, anotherCard, selectedTag };
    });
  await test.step("When: select the tag to save the filter", async () => {
    await page.getByText("Filters", { exact: true }).click();
    await clickCheckboxLabel(page, selectedTag);
  });
  await test.step("Then: matching cards appear and the filter is accepted", async () => {
    await expect(page.getByRole("button", { name: "Save filters", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `View ${matching.frontText}` })).toBeVisible();
    await expect
      .poll(async () => (await requireDocument("deck", deck.id)).fields.cardFilter?.mapValue?.fields)
      .toEqual({
        selectedTags: { arrayValue: { values: [{ stringValue: selectedTag }] } },
        tagAndFilter: { booleanValue: false },
      });
  });
  await test.step("When: reload the deck and open its filters", async () => {
    await page.reload();
    await page.getByText("Filters", { exact: true }).click();
  });
  await test.step("Then: the saved selection still limits the card list", async () => {
    await expect(page.getByRole("checkbox", { name: selectedTag, exact: true })).toBeChecked();
    await expect(page.getByRole("button", { name: `View ${matching.frontText}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `View ${anotherCard.frontText}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `View ${wrongTag.frontText}` })).toHaveCount(0);
  });
});
