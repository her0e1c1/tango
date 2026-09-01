import { expect, requireDocument, test } from "./fixtures";
import { readSession } from "./study-helpers";

const readSelectedTags = async (deckId: string): Promise<string[]> =>
  ((await requireDocument("deck", deckId)).fields.selectedTags?.arrayValue?.values ?? [])
    .map((value) => value.stringValue)
    .filter((value): value is string => value !== undefined);

test("SWIPE-26 reveals, persists, and applies an additional Study tag", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const targetCard = fixture.card("card-10");
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}/start`);

  const targetTag = page.getByRole("checkbox", { name: "tag-10", exact: true });
  await expect(targetTag).toHaveCount(0);
  await page.getByRole("button", { name: "Show 2 more tags" }).click();
  await expect(targetTag).toBeVisible();
  await targetTag.locator("xpath=parent::label").click();
  await expect(targetTag).toBeChecked();
  await expect(page.getByRole("button", { name: "Start 1 card" })).toBeEnabled();
  await page.getByRole("button", { name: "Save filters" }).click();
  await expect.poll(() => readSelectedTags(deck.id)).toEqual(["tag-10"]);

  await page.reload();
  await expect(targetTag).toBeVisible();
  await expect(targetTag).toBeChecked();
  await page.getByRole("button", { name: "Start 1 card" }).click();

  await expect(page.getByText(targetCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readSession(page, deck.id))?.cardOrderIds).toEqual([targetCard.id]);
});
