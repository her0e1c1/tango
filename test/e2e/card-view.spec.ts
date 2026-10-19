import { expect, getDocument, requireDocument, test } from "./utils/fixtures";
import { createAnonymousDeck } from "./utils/ui-helpers";
import type { Page } from "@playwright/test";

test("CARD-VIEW-06 CARD-VIEW-08 CARD-VIEW-09 shows FSRS memory after a rating, reload, and offline navigation", async ({
  fixture,
  page,
  context,
}) => {
  const { local } = await test.step("Given: An anonymous deck with unrated cards", async () => {
    await fixture.apply(page);
    const local = await createAnonymousDeck(page);
    const { deck, first: card } = local;

    await page.goto(`/card/${card.id}`);
    await expect(page.getByText("No FSRS memory state yet. It will appear after a rated study answer.")).toBeVisible();
    await expect(page.getByRole("img", { name: /Forgetting curve/ })).toHaveCount(0);
    await page.goto(`/deck/${deck.id}/start`);
    return { local };
  });
  const { other, ratedId } = await test.step("When: Start study and rate the current card Good", async () => {
    await page.getByRole("button", { name: "Start 2 cards" }).click();
    const frontText = await page.locator("#frontText").innerText();
    const rated = frontText === local.first.frontText ? local.first : local.second;
    const other = rated === local.first ? local.second : local.first;
    const ratedId = rated.id;
    await page.getByRole("button", { name: "Swipe right: Good" }).click();
    return { other, ratedId };
  });
  await test.step("Then: Study advances to the other card", async () => {
    await expect(page.getByText(other.frontText, { exact: true })).toBeVisible();
  });
  await test.step("When: Open the rated card", async () => {
    await page.goto(`/card/${ratedId}`);
  });
  await test.step("Then: FSRS memory and its timestamp are visible", async () => {
    await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
    await expect(page.locator("p").filter({ hasText: /As of / })).toBeVisible();
  });
  await test.step("When: Reload the rated card", async () => {
    await page.reload();
  });
  await test.step("Then: FSRS memory survives reload", async () => {
    await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  });
  await test.step("When: Go offline and open the unrated card from cache", async () => {
    await context.setOffline(true);
    // Keep the loaded shell and exercise cached navigation without a server response.
    await page.evaluate((id) => {
      window.history.pushState(window.history.state, "", `/card/${encodeURIComponent(id)}`);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    }, other.id);
  });
  await test.step("Then: The unrated card has no FSRS memory", async () => {
    await expect(page.getByRole("img", { name: /Forgetting curve/ })).toHaveCount(0);
  });
  await test.step("When: Return to the rated card offline", async () => {
    await page.goBack();
  });
  await test.step("Then: Cached FSRS memory remains visible", async () => {
    await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  });
  await test.step("When: Reconnect the browser", async () => {
    await context.setOffline(false);
  });
});

const cardArticle = (page: Page, frontText: string) =>
  page.getByRole("button", { name: `View ${frontText}`, exact: true }).locator("xpath=ancestor::article[1]");

test("CARD-VIEW-01 shows front text and tags", async ({ fixture, page }) => {
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

test("CARD-VIEW-02 opens the selected Card back-text overlay", async ({ fixture, page }) => {
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

test("CARD-VIEW-03 closes the back-text overlay without changing persistent Card data", async ({ fixture, page }) => {
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

test("CARD-VIEW-04 CARD-VIEW-07 opens a Card view route inside the application shell", async ({ fixture, page }) => {
  const { card, nextCard } = await test.step("Given: A card route open inside the application shell", async () => {
    const card = fixture.card();
    const nextCard = fixture.card("card-2");
    await fixture.apply(page);

    await page.goto(`/card/${card.id}`);

    await expect(page.getByRole("region", { name: "Card answer" })).toContainText(card.backText);
    await expect(page.getByRole("button", { name: "tango" })).toBeVisible();
    return { card, nextCard };
  });
  await test.step("When: Navigate to another card through browser history", async () => {
    // Exercise a same-document history transition so the Page must consume the new route parameter.
    await page.evaluate((cardId) => {
      window.history.pushState(window.history.state, "", `/card/${encodeURIComponent(cardId)}`);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    }, nextCard.id);
  });
  await test.step("Then: The route and answer update inside the same shell", async () => {
    await expect(page).toHaveURL(`/card/${nextCard.id}`);
    await expect(page.getByRole("region", { name: "Card answer" })).toContainText(nextCard.backText);
    await expect(page.getByRole("region", { name: "Card answer" })).not.toContainText(card.backText);
    await expect(page.getByRole("button", { name: "tango" })).toBeVisible();
  });
});

test("CARD-VIEW-05 recovers home from a missing Card route", async ({ fixture, page, namespace }) => {
  await test.step("Given: A missing card route with home recovery", async () => {
    await fixture.apply(page);

    await page.goto(`/card/${namespace.id("missing")}`);
    await expect(page.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
  });
  await test.step("When: Choose Go home", async () => {
    await page.getByRole("button", { name: "Go home" }).click();
  });
  await test.step("Then: The deck list opens without creating the missing card", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    expect(await getDocument("card", namespace.id("missing"))).toBeUndefined();
  });
});
