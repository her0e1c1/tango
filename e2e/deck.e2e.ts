import { expect, test, type Page } from "@playwright/test";
import { routeAnonymousAuth, seedConfig, seedDeckAndCards } from "./fixtures";

const e2eDeck = {
  id: "deck-e2e-deck",
  name: "E2E Deck",
  category: "English",
  uid: "deck-e2e-user",
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  scoreMax: null,
  scoreMin: null,
  isPublic: false,
  selectedTags: [],
  tagAndFilter: false,
  convertToBr: false,
};

const e2eCard = {
  id: "deck-e2e-card",
  deckId: "deck-e2e-deck",
  uid: "deck-e2e-user",
  frontText: "apple",
  backText: "りんご",
  tags: [],
  uniqueKey: "e2e-card-1",
  score: 0,
  numberOfSeen: 0,
  interval: 0,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
};

const seedDeckSession = async (page: Page) => {
  await routeAnonymousAuth(page, e2eDeck.uid);
  await seedConfig(page);
  await seedDeckAndCards(e2eDeck, [e2eCard]);
};

const deckCard = (page: Page, name: string) =>
  page.getByText(name).locator("xpath=ancestor::div[contains(@class, 'rounded')][1]");

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await seedDeckSession(page);

  await page.exposeFunction("assertNoBrowserErrors", () => {
    expect(errors).toEqual([]);
  });
});

test.describe.configure({ mode: "serial" });

test("navigates from the deck list to the card list", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("E2E Deck")).toBeVisible();
  await page.getByText("E2E Deck").click();

  await expect(page).toHaveURL(new RegExp(`/deck/${e2eDeck.id}$`));
  await expect(page.getByText("apple")).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("saves deck edits and returns to the deck list", async ({ page }) => {
  await page.goto("/");

  await deckCard(page, "E2E Deck").locator("svg").nth(1).click();
  await expect(page).toHaveURL(new RegExp(`/deck/${e2eDeck.id}/edit$`));

  await page.locator('input[name="name"]').fill("Updated E2E Deck");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Updated E2E Deck")).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("deletes a deck from the deck list", async ({ page }) => {
  await page.goto("/");

  page.on("dialog", (dialog) => dialog.accept());
  await deckCard(page, "E2E Deck").locator("svg").nth(2).click();

  await expect(page.getByText("E2E Deck")).not.toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});
