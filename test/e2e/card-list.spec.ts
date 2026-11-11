import { expect, requireDocument, test } from "./utils/fixtures";
import type { Page } from "@playwright/test";

const cardArticle = (page: Page, frontText: string) =>
  page.getByRole("button", { name: `View ${frontText}`, exact: true }).locator("xpath=ancestor::article[1]");

const openPreview = async (page: Page, deckId: string, frontText: string) => {
  await page.goto(`/deck/${deckId}`);
  await page.getByRole("button", { name: `View ${frontText}`, exact: true }).click();
  const preview = page.getByRole("dialog", { name: frontText, exact: true });
  const reader = preview.getByRole("region", { name: "Answer", exact: true });
  await expect(reader).toBeVisible();
  return { preview, reader };
};

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

test("CARD-LIST-02 opens the selected Card answer with keyboard focus inside the preview", async ({
  fixture,
  page,
}) => {
  const { card } = await test.step("Given: A card in the deck card list", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);

    await page.goto(`/deck/${deck.id}`);
    return { card };
  });
  await test.step("When: Open the selected card answer", async () => {
    const opener = page.getByRole("button", { name: `View ${card.frontText}`, exact: true });
    for (let stops = 0; stops < 20; stops += 1) {
      if (await opener.evaluate((element) => element === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(opener).toBeFocused();
    await page.keyboard.press("Enter");
  });
  await test.step("Then: The named preview owns focus and background navigation is unavailable", async () => {
    const preview = page.getByRole("dialog", { name: card.frontText, exact: true });
    await expect(preview).toContainText(card.backText);
    await expect(preview.getByRole("heading", { name: card.frontText, exact: true })).toBeFocused();
    await page
      .getByRole("combobox", { name: "Sort order", includeHidden: true })
      .evaluate((element) => element.focus());
    await expect(preview.getByRole("heading", { name: card.frontText, exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(preview.getByRole("button", { name: "Close card" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(preview.getByRole("heading", { name: card.frontText, exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(preview.getByRole("region", { name: "Answer", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(preview.getByRole("heading", { name: card.frontText, exact: true })).toBeFocused();
    await page.keyboard.press("s");
    await page.keyboard.press("t");
    await expect(preview).toBeVisible();
    await expect(page).toHaveURL(/\/deck\/[^/]+$/);
  });
});

test("CARD-LIST-03 closes the answer and returns focus without changing saved data", async ({ fixture, page }) => {
  const { card, before, deckBefore, sortBefore, preferencesBefore, preview } =
    await test.step("Given: A saved card with its answer preview open", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      await fixture.apply(page);
      const before = await requireDocument("card", card.id);
      const deckBefore = await requireDocument("deck", deck.id);

      await page.goto(`/deck/${deck.id}`);
      const sortBefore = await page.getByRole("combobox", { name: "Sort order" }).inputValue();
      const preferencesBefore = await page.evaluate(() => localStorage.getItem("tango-config"));
      await page.getByRole("button", { name: `View ${card.frontText}` }).click();
      const preview = page.getByRole("dialog", { name: card.frontText, exact: true });
      await expect(preview).toContainText(card.backText);
      return { card, before, deckBefore, sortBefore, preferencesBefore, preview };
    });
  await test.step("When: Close the answer with Escape", async () => {
    await page.keyboard.press("Escape");
  });
  await test.step("Then: The same opener regains focus and saved data and list conditions are unchanged", async () => {
    await expect(preview).toHaveCount(0);
    await expect(page.getByRole("button", { name: `View ${card.frontText}`, exact: true })).toBeFocused();
    await expect(page.getByText(card.frontText)).toBeVisible();
    expect(await requireDocument("card", card.id)).toEqual(before);
    expect(await requireDocument("deck", card.deckId)).toEqual(deckBefore);
    await expect(page.getByRole("combobox", { name: "Sort order" })).toHaveValue(sortBefore);
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferencesBefore);
  });
});

test("CARD-LIST-06 selects answer text without dismissing the preview", async ({ fixture, page }) => {
  const { preview, reader } = await test.step("Given: A preview containing selectable answer text", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    return openPreview(page, deck.id, card.frontText);
  });
  await test.step("When: Drag across the answer text", async () => {
    const text = reader.getByText("Selectable answer text.", { exact: true });
    const box = await text.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    await page.mouse.move(box.x + 1, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
  });
  await test.step("Then: Text is selected and the preview remains open", async () => {
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toContain("answer");
    await expect(preview).toBeVisible();
  });
});

test("CARD-LIST-07 follows answer links and footnotes without dismissing the preview", async ({ fixture, page }) => {
  const { preview, reader } =
    await test.step("Given: A preview with a reference, note marker and backlink", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      await fixture.apply(page);
      return openPreview(page, deck.id, card.frontText);
    });
  await test.step("When: Follow both references and return to the note marker", async () => {
    await reader.getByRole("link", { name: "Reference", exact: true }).click();
    await expect(reader.getByText("Footnote answer.", { exact: false })).toBeInViewport();
    await reader.getByRole("link", { name: "Back to reference 1", exact: true }).click();
    await reader.locator("a[data-footnote-ref]").click();
    await expect(reader.getByText("Footnote answer.", { exact: false })).toBeInViewport();
    await reader.getByRole("link", { name: "Back to reference 1", exact: true }).click();
  });
  await test.step("Then: The note marker is readable within the same preview", async () => {
    await expect(reader.locator("a[data-footnote-ref]")).toBeInViewport();
    await expect(preview).toBeVisible();
  });
});

test("CARD-LIST-08 scrolls the answer vertically with the keyboard", async ({ fixture, page }) => {
  const { preview, reader } = await test.step("Given: A preview containing a long answer", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    return openPreview(page, deck.id, card.frontText);
  });
  const { scrollBefore } = await test.step("When: Focus the answer and press PageDown", async () => {
    await reader.focus();
    const scrollBefore = await reader.evaluate((element) => element.scrollTop);
    await page.keyboard.press("PageDown");
    return { scrollBefore };
  });
  await test.step("Then: The answer scrolls vertically and remains open", async () => {
    await expect.poll(() => reader.evaluate((element) => element.scrollTop)).toBeGreaterThan(scrollBefore);
    await expect(preview).toBeVisible();
  });
});

test("CARD-LIST-09 scrolls wide answer code with the keyboard", async ({ fixture, page }) => {
  const { preview, reader } = await test.step("Given: A preview containing wide code", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    return openPreview(page, deck.id, card.frontText);
  });
  const code = reader.locator("pre");
  await test.step("When: Focus the code and press ArrowRight", async () => {
    await code.focus();
    await expect(code).toBeFocused();
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: The code scrolls horizontally within the same preview", async () => {
    await expect.poll(() => code.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expect(preview).toBeVisible();
  });
});

test("CARD-LIST-10 scrolls wide answer math with the keyboard", async ({ fixture, page }) => {
  const { preview, reader } = await test.step("Given: A preview containing wide math", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    return openPreview(page, deck.id, card.frontText);
  });
  const formula = reader.locator(".katex-display");
  await test.step("When: Focus the math and press ArrowRight", async () => {
    await formula.focus();
    await expect(formula).toBeFocused();
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: The math can scroll horizontally without closing the preview", async () => {
    await expect.poll(() => formula.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expect(preview).toBeVisible();
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
