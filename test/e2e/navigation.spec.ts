import { expect, requireDocument, test } from "./fixtures";

test("NAVIGATION-01 An unknown route recovers to the Deck list", async ({ fixture, page, namespace }) => {
  await fixture.apply(page);

  await page.goto(`/${namespace.id("not-a-route")}`);
  const notFound = page.getByRole("heading", { level: 1, name: "Page not found" });
  await expect(notFound).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(notFound).toHaveCount(0);
});

test("NAVIGATION-02 Screen shortcuts navigate to their configured routes", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  const deckBefore = await requireDocument("deck", deck.id);
  const cardBefore = await requireDocument("card", card.id);

  await page.goto("/");
  await page.keyboard.press("s");
  await expect(page).toHaveURL(/\/settings$/);

  await page.goto("/");
  await page.keyboard.press("i");
  await expect(page).toHaveURL(/\/import$/);

  await page.goto(`/deck/${deck.id}`);
  await page.keyboard.press("t");
  await expect(page).toHaveURL(/\/$/);

  await page.goto(`/deck/${deck.id}`);
  await page.keyboard.press("s");
  await expect(page).toHaveURL(/\/settings$/);

  expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
  expect(await requireDocument("card", card.id)).toEqual(cardBefore);
});
