import { expect, requireDocument, test } from "./utils/fixtures";
import type { Page } from "@playwright/test";

const cardArticle = (page: Page, frontText: string) =>
  page.getByRole("button", { name: `View ${frontText}`, exact: true }).locator("xpath=ancestor::article[1]");

test("CARD-LIST-01 shows front text and tags", async ({ fixture, page }) => {
  const { deck, card } = await test.step("Given: A card with front text and tags", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    return { deck, card };
  });
  await test.step("When: Open its deck card list", async () => {
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: The card front and tags are visible", async () => {
    const article = cardArticle(page, card.frontText);
    await expect(article.getByText(card.frontText)).toBeVisible();
    await expect(article.getByRole("group", { name: `Tags: ${card.tags.join(", ")}` })).toBeVisible();
  });
});

test("CARD-LIST-02 opens the selected Card back-text overlay", async ({ fixture, page }) => {
  const { card } = await test.step("Given: A card in the deck card list", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);

    await page.goto(`/deck/${deck.id}`);
    return { card };
  });
  await test.step("When: Open the selected card answer", async () => {
    await page.getByRole("button", { name: `View ${card.frontText}` }).click();
  });
  await test.step("Then: The overlay shows that card back text", async () => {
    await expect(page.getByRole("button", { name: "Close card" })).toContainText(card.backText);
  });
});

test("CARD-LIST-03 closes the back-text overlay without changing persistent Card data", async ({ fixture, page }) => {
  const { card, before, overlay } = await test.step("Given: A saved card with its answer overlay open", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    const before = await requireDocument("card", card.id);

    await page.goto(`/deck/${deck.id}`);
    await page.getByRole("button", { name: `View ${card.frontText}` }).click();
    const overlay = page.getByRole("button", { name: "Close card" });
    await expect(overlay).toContainText(card.backText);
    return { card, before, overlay };
  });
  await test.step("When: Close the answer overlay", async () => {
    await overlay.click();
  });
  await test.step("Then: The front returns and saved card data is unchanged", async () => {
    await expect(overlay).toHaveCount(0);
    await expect(page.getByText(card.frontText)).toBeVisible();
    expect(await requireDocument("card", card.id)).toEqual(before);
  });
});

test("CARD-LIST-04 opens Card creation from an empty deck card list", async ({ fixture, page }) => {
  const { deck } = await test.step("Given: An empty deck card list with its Add card action", async () => {
    await fixture.apply(page);
    const deck = fixture.deck("deck-empty");
    await page.goto(`/deck/${deck.id}`);
    await expect(page.getByRole("button", { name: /^View / })).toHaveCount(0);
    await expect(page.getByText("0 cards", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No cards yet" })).toBeVisible();
    return { deck };
  });
  await test.step("When: Choose Add card", async () => {
    await page.getByRole("button", { name: "Add card", exact: true }).click();
  });
  await test.step("Then: Card creation opens for the empty deck", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/card/new$`));
  });
});

test("CARD-LIST-05 recovers home from a missing Deck route", async ({ fixture, page, namespace }) => {
  await test.step("Given: A missing deck route with home recovery", async () => {
    await fixture.apply(page);

    await page.goto(`/deck/${namespace.id("missing")}`);
    await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  });
  await test.step("When: Choose Go home", async () => {
    await page.getByRole("button", { name: "Go home" }).click();
  });
  await test.step("Then: The deck list opens", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  });
});
