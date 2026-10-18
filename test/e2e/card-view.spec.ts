import { expect, getDocument, requireDocument, test } from "./utils/fixtures";
import { createAnonymousDeck } from "./utils/ui-helpers";
import type { Page } from "@playwright/test";

test("CARD-VIEW-06 shows FSRS memory after a rating, reload, and offline navigation", async ({
  fixture,
  page,
  context,
}) => {
  // Given: Prepare `local` and any shared test state below.
  await fixture.apply(page);
  const local = await createAnonymousDeck(page);
  const { deck, first: card } = local;

  await page.goto(`/card/${card.id}`);
  await expect(page.getByText("No FSRS memory state yet. It will appear after a rated study answer.")).toBeVisible();
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toHaveCount(0);
  await page.goto(`/deck/${deck.id}/start`);
  // When: Exercise `page.getByRole("button", { name: "Start 2 cards" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Start 2 cards" }).click();
  const frontText = await page.locator("#frontText").innerText();
  const rated = frontText === local.first.frontText ? local.first : local.second;
  const other = rated === local.first ? local.second : local.first;
  const ratedId = rated.id;
  await page.getByRole("button", { name: "Swipe right: Good" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(other.frontText, { exact: true })).toBeVisible();
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/card/${ratedId}`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  await expect(page.locator("p").filter({ hasText: /As of / })).toBeVisible();
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  // When: Exercise `context.setOffline` with the prepared inputs.
  await context.setOffline(true);
  // Keep the loaded shell and exercise cached navigation without a server response.
  await page.evaluate((id) => {
    window.history.pushState(window.history.state, "", `/card/${encodeURIComponent(id)}`);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  }, other.id);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toHaveCount(0);
  // When: Exercise `page.goBack` with the prepared inputs.
  await page.goBack();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  // When: Exercise `context.setOffline` with the prepared inputs.
  await context.setOffline(false);
});

const cardArticle = (page: Page, frontText: string) =>
  page.getByRole("button", { name: `View ${frontText}`, exact: true }).locator("xpath=ancestor::article[1]");

test("CARD-VIEW-01 shows front text and tags", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `card` and any shared test state below.
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);

  const article = cardArticle(page, card.frontText);
  // Then: Verify the expected result in the assertions below.
  await expect(article.getByText(card.frontText)).toBeVisible();
  await expect(article.getByRole("group", { name: `Tags: ${card.tags.join(", ")}` })).toBeVisible();
});

test("CARD-VIEW-02 opens the selected Card back-text overlay", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `card` and any shared test state below.
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}`);
  // When: Exercise `page.getByRole("button", { name: `View ${card.frontText}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `View ${card.frontText}` }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Close card" })).toContainText(card.backText);
});

test("CARD-VIEW-03 closes the back-text overlay without changing persistent Card data", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `card`, `before` and any shared test state below.
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  const before = await requireDocument("card", card.id);

  await page.goto(`/deck/${deck.id}`);
  // When: Exercise `page.getByRole("button", { name: `View ${card.frontText}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `View ${card.frontText}` }).click();
  const overlay = page.getByRole("button", { name: "Close card" });
  // Then: Verify the expected result in the assertions below.
  await expect(overlay).toContainText(card.backText);
  // When: Exercise `overlay.click` with the prepared inputs.
  await overlay.click();

  // Then: Verify the expected result in the assertions below.
  await expect(overlay).toHaveCount(0);
  await expect(page.getByText(card.frontText)).toBeVisible();
  expect(await requireDocument("card", card.id)).toEqual(before);
});

test("CARD-VIEW-04 opens a Card view route inside the application shell", async ({ fixture, page }) => {
  // Given: Prepare `card`, `nextCard` and any shared test state below.
  const card = fixture.card();
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/card/${card.id}`);

  await expect(page.getByRole("region", { name: "Card answer" })).toContainText(card.backText);
  await expect(page.getByRole("button", { name: "tango" })).toBeVisible();

  // Exercise a same-document history transition so the Page must consume the new route parameter.
  // When: Exercise `page.evaluate` with the prepared inputs.
  await page.evaluate((cardId) => {
    window.history.pushState(window.history.state, "", `/card/${encodeURIComponent(cardId)}`);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  }, nextCard.id);

  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(`/card/${nextCard.id}`);
  await expect(page.getByRole("region", { name: "Card answer" })).toContainText(nextCard.backText);
  await expect(page.getByRole("region", { name: "Card answer" })).not.toContainText(card.backText);
  await expect(page.getByRole("button", { name: "tango" })).toBeVisible();
});

test("CARD-VIEW-05 recovers home from a missing Card route", async ({ fixture, page, namespace }) => {
  // Given: Use this case's inputs and any shared test setup.
  await fixture.apply(page);

  await page.goto(`/card/${namespace.id("missing")}`);
  await expect(page.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "Go home" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Go home" }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  expect(await getDocument("card", namespace.id("missing"))).toBeUndefined();
});
