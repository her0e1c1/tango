import { createAnonymousDeck } from "./ui-helpers";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function completeStudy(page: Page, deck: { id: string }, cards: readonly unknown[]) {
  await page.goto(`/deck/${encodeURIComponent(deck.id)}/start`);
  await page.getByRole("button", { name: `Start ${String(cards.length)} cards` }).click();
  for (let index = 0; index < cards.length; index += 1) {
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(index));
    await page.getByRole("button", { name: "Swipe right" }).click();
  }
  await page.getByRole("button", { name: "Back to deck list" }).click();
  await page.getByRole("button", { name: "Study history", exact: true }).click();
}

async function expectCompletedHistory(page: Page, deck: { name: string }, cards: readonly unknown[]) {
  await expect(page.getByRole("heading", { level: 1, name: "Study history" })).toBeVisible();
  await page.getByText("Show daily counts · 30 days").click();
  await expect(page.getByRole("row")).toHaveCount(31);
  await expect(page.getByRole("row").nth(1).getByRole("cell")).toHaveText(["1", "1"]);
  await expect(page.locator("dl").first().locator("dd")).toHaveText(["1", "1"]);
  await expect(page.getByRole("img", { name: /Starts and completions in the selected period/ })).toBeVisible();
  const recent = page.getByRole("region", { name: "Recent sessions" });
  await expect(recent.getByRole("listitem")).toHaveCount(1);
  await expect(recent.getByRole("heading", { name: deck.name })).toBeVisible();
  await expect(recent.locator("dd").nth(2)).toHaveText(String(cards.length));
  await expect(recent.getByText("Completed", { exact: true })).toBeVisible();
  await expect(recent.locator("dd").nth(0)).not.toHaveText("—");
  await expect(recent.locator("dd").nth(1)).not.toHaveText("—");
}

test("STUDY-SESSION-09 shows independent starts and completions after studying", async ({ fixture, page }) => {
  await fixture.apply(page);
  await completeStudy(page, fixture.deck(), fixture.state.remote.cards);
  await expectCompletedHistory(page, fixture.deck(), fixture.state.remote.cards);
});

test("STUDY-SESSION-10 keeps Deck selection in the URL across navigation and reload", async ({ fixture, page }) => {
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
  await page.getByText("Show daily counts · 30 days").click();
  await expect(page.getByRole("row")).toHaveCount(31);
});

test("STUDY-SESSION-11 keeps unavailable Deck selection without displaying all history", async ({
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
  await page.getByText("Show daily counts · 30 days").click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("STUDY-SESSION-12 restores anonymous study history from the device cache", async ({ fixture, page }) => {
  await fixture.apply(page);
  const local = await createAnonymousDeck(page);
  const { deck, cards } = local;

  await completeStudy(page, deck, cards);
  await expectCompletedHistory(page, deck, cards);
  await page.reload();
  await expectCompletedHistory(page, deck, cards);
  await expect(page.getByText(/Anonymous data is stored only on this browser/)).toBeVisible();
  await expect(page.getByText(/Cloud history may be incomplete/)).toBeVisible();
});

test("STUDY-SESSION-13 selects presets and inclusive dates while preserving Deck and URL navigation", async ({
  fixture,
  page,
}) => {
  await fixture.apply(page);
  await page.goto("/study-history");
  await page.getByRole("button", { name: "7 days" }).click();
  await page.getByText("Show daily counts · 7 days").click();
  await expect(page.getByRole("row")).toHaveCount(8);
  await page.getByRole("button", { name: "90 days" }).click();
  await expect(page.getByText("Study counts per 7 days")).toBeVisible();
  await page.getByText("Show daily counts · 90 days").click();
  await expect(page.getByRole("row")).toHaveCount(31);
  await page.getByRole("button", { name: "Older dates" }).click();
  await page.getByRole("button", { name: "Older dates" }).click();
  await expect(page.getByText("61–90 of 90 days")).toBeVisible();
  await expect(page.getByRole("button", { name: "Older dates" })).toBeDisabled();
  await page.getByRole("button", { name: "Custom range" }).click();
  await page.getByLabel("Start date").fill("2020-12-31");
  await page.getByLabel("End date").fill("2021-01-02");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.getByRole("combobox").selectOption(fixture.deck().id);
  await page.goBack();
  await expect(page.getByRole("combobox")).toHaveValue("");
  await page.goForward();
  await page.reload();
  await expect(page.getByRole("combobox")).toHaveValue(fixture.deck().id);
  await expect(page.getByLabel("Start date")).toHaveValue("2020-12-31");
  await expect(page.getByLabel("End date")).toHaveValue("2021-01-02");
  await expect(page.getByText("No study records in this period.")).toBeVisible();
  await page.getByText("Show daily counts · 3 days").click();
  await expect(page.getByRole("row")).toHaveCount(4);
  await expect(page.getByRole("row", { name: "Dec 31, 2020 0 0" })).toBeVisible();
  await expect(page.getByRole("row", { name: "Jan 2, 2021 0 0" })).toBeVisible();
});
