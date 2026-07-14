import { expect, test, type Page } from "@playwright/test";

const e2eDeck = {
  id: "e2e-deck-1",
  name: "E2E Deck",
  category: "English",
  uid: "e2e-user",
  localMode: true,
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
  id: "e2e-card-1",
  deckId: "e2e-deck-1",
  uid: "e2e-user",
  frontText: "apple",
  backText: "りんご",
  tags: [],
  uniqueKey: "e2e-card-1",
  score: 0,
  numberOfSeen: 0,
  interval: 0,
  nextSeeingAt: new Date(0).toISOString(),
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
};

const persistedConfig = {
  useCardInterval: false,
  showSwipeButtonList: true,
  showScoreSlider: false,
  showHeader: true,
  fullscreen: false,
  maxNumberOfCardsToLearn: 10,
  hideBodyWhenCardChanged: true,
  sizeBackText: 0,
  shuffled: false,
  defaultAutoPlay: false,
  cardInterval: 60,
  keepBackTextViewed: false,
  showSwipeFeedback: false,
  cardSwipeUp: "GoToNextCardMastered",
  cardSwipeDown: "GoToNextCardNotMastered",
  cardSwipeLeft: "GoToPrevCard",
  cardSwipeRight: "GoToNextCard",
  darkMode: false,
  uid: "e2e-user",
  isAnonymous: false,
  displayName: "E2E User",
  selectedTags: [],
  lastUpdatedAt: 0,
  githubAccessToken: "",
  loadSample: false,
  localMode: true,
};

const seedDeckSession = async (page: Page) => {
  await page.route("https://identitytoolkit.googleapis.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        kind: "identitytoolkit#SignupNewUserResponse",
        idToken: "e2e-id-token",
        refreshToken: "e2e-refresh-token",
        expiresIn: "3600",
        localId: "e2e-user",
      }),
    });
  });

  await page.addInitScript(
    ({ config, deck, card }) => {
      window.localStorage.setItem(
        "persist:root",
        JSON.stringify({
          config: JSON.stringify(config),
          deck: JSON.stringify({ byId: { [deck.id]: deck }, categories: [deck.category] }),
          card: JSON.stringify({ byId: { [card.id]: card }, tags: [] }),
          _persist: JSON.stringify({ version: 1, rehydrated: true }),
        })
      );
    },
    { config: persistedConfig, deck: e2eDeck, card: e2eCard }
  );
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

test("navigates from the deck list to the card list", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("E2E Deck")).toBeVisible();
  await page.getByText("E2E Deck").click();

  await expect(page).toHaveURL(/\/deck\/e2e-deck-1$/);
  await expect(page.getByText("apple")).toBeVisible();
  await page.evaluate(() => (window as any).assertNoBrowserErrors());
});

test("saves deck edits and returns to the deck list", async ({ page }) => {
  await page.goto("/");

  await deckCard(page, "E2E Deck").locator("svg").nth(1).click();
  await expect(page).toHaveURL(/\/deck\/e2e-deck-1\/edit$/);

  await page.locator('input[name="name"]').fill("Updated E2E Deck");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Updated E2E Deck")).toBeVisible();
  await page.evaluate(() => (window as any).assertNoBrowserErrors());
});

test("deletes a deck from the deck list", async ({ page }) => {
  await page.goto("/");

  page.on("dialog", (dialog) => dialog.accept());
  await deckCard(page, "E2E Deck").locator("svg").nth(2).click();

  await expect(page.getByText("E2E Deck")).not.toBeVisible();
  await page.evaluate(() => (window as any).assertNoBrowserErrors());
});
