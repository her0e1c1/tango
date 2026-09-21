import type { Page } from "@playwright/test";
import { expect, test, type E2EFixture } from "./fixtures";

async function completeStudy(page: Page, fixture: E2EFixture) {
  const deck = fixture.deck();
  const cards = [...fixture.state.remote.cards, ...fixture.state.browser.localCards].filter(
    (card) => card.deckId === deck.id
  );
  await page.goto(`/deck/${encodeURIComponent(deck.id)}/start`);
  await page.getByRole("button", { name: `Start ${String(cards.length)} cards` }).click();
  for (let index = 0; index < cards.length; index += 1) {
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(index));
    await page.getByRole("button", { name: "Swipe right" }).click();
  }
  await page.getByRole("button", { name: "Back to deck list" }).click();
  await page.getByRole("button", { name: "Study history", exact: true }).click();
}

async function expectCompletedHistory(page: Page) {
  await expect(page.getByRole("heading", { level: 1, name: "Study history" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(31);
  await expect(page.getByRole("row").last().getByRole("cell")).toHaveText(["1", "1"]);
  await expect(page.locator("dd")).toHaveText(["1", "1"]);
  await expect(page.getByRole("img", { name: /Daily starts and completions/ })).toBeVisible();
}

test("HISTORY-01 shows independent starts and completions after studying", async ({ fixture, page }) => {
  await fixture.apply(page);
  await completeStudy(page, fixture);
  await expectCompletedHistory(page);
});

test("HISTORY-02 keeps Deck selection in the URL across navigation and reload", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto("/");
  const deck = fixture.deck();
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Study history" }).click();
  await expect(page.getByRole("combobox", { name: "Deck", exact: true })).toHaveValue(deck.id);
  await page.getByRole("combobox").selectOption("");
  await page.goBack();
  await expect(page.getByRole("combobox")).toHaveValue(deck.id);
  await page.goForward();
  await expect(page.getByRole("combobox")).toHaveValue("");
  await page.reload();
  await expect(page.getByRole("combobox")).toHaveValue("");
  await expect(page.getByText("No study records in this period.")).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(31);
});

test("HISTORY-03 keeps unavailable Deck selection without displaying all history", async ({
  fixture,
  page,
  namespace,
}) => {
  await fixture.apply(page);
  const path = `/study-history?deckId=${namespace.id("missing")}`;
  await page.goto(path);
  await expect(page.getByRole("status").filter({ hasText: "The selected deck is unavailable." })).toHaveText(
    "The selected deck is unavailable.All decks"
  );
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(path);
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.getByRole("button", { name: "All decks" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("HISTORY-04 restores anonymous study history from the device cache", async ({ fixture, page }) => {
  await fixture.apply(page);
  await completeStudy(page, fixture);
  await expectCompletedHistory(page);
  await page.reload();
  await expectCompletedHistory(page);
  await expect(page.getByText(/Anonymous data is stored only on this browser/)).toBeVisible();
  await expect(page.getByText(/Cloud history may be incomplete/)).toBeVisible();
});
