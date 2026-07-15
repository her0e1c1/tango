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

const seedCardSession = async (page: Page) => {
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
          _persist: JSON.stringify({ version: 2, rehydrated: true }),
        })
      );
    },
    { config: persistedConfig, deck: e2eDeck, card: e2eCard }
  );
};

const cardItem = (page: Page, frontText: string) =>
  page.getByText(frontText, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'rounded')][1]");

const expectScore = async (page: Page, frontText: string, score: number) => {
  await expect(cardItem(page, frontText).locator("span").filter({ hasText: new RegExp(`^${score}$`) })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await seedCardSession(page);

  await page.exposeFunction("assertNoBrowserErrors", () => {
    expect(errors).toEqual([]);
  });
});

test("shows cards for the deck", async ({ page }) => {
  await page.goto("/deck/e2e-deck-1");

  await expect(page.getByText("apple")).toBeVisible();
  await expect(cardItem(page, "apple").getByText("studied 0 time(s)")).toBeVisible();
  await expectScore(page, "apple", 0);
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("opens and closes the card back text overlay", async ({ page }) => {
  await page.goto("/deck/e2e-deck-1");

  await page.getByText("apple").click();
  await expect(page.getByText("りんご")).toBeVisible();

  await page.getByText("りんご").click();
  await expect(page.getByText("りんご")).not.toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("saves card edits and returns to the card list", async ({ page }) => {
  await page.goto("/deck/e2e-deck-1");

  await cardItem(page, "apple").locator("svg").first().click();
  await expect(page).toHaveURL(/\/card\/e2e-card-1\/edit$/);

  await page.locator('textarea[name="frontText"]').fill("updated apple");
  await page.locator('textarea[name="backText"]').fill("updated りんご");
  await page.getByText("math", { exact: true }).click();
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(/\/deck\/e2e-deck-1$/);
  await expect(page.getByText("updated apple")).toBeVisible();
  await expect(cardItem(page, "updated apple").getByText("math")).toBeVisible();

  await page.getByText("updated apple").click();
  await expect(page.getByText("updated りんご")).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("deletes a card from the card list", async ({ page }) => {
  await page.goto("/deck/e2e-deck-1");

  page.on("dialog", (dialog) => dialog.accept());
  await cardItem(page, "apple").locator("svg").nth(1).click();

  await expect(page.getByText("apple")).not.toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("updates the card score with swipe gestures", async ({ page }) => {
  await page.goto("/deck/e2e-deck-1");

  const card = cardItem(page, "apple");
  const box = await card.boundingBox();
  if (box == null) throw new Error("Card bounding box is unavailable");

  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 20, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 20, y);
  await page.mouse.up();
  await expectScore(page, "apple", 1);

  await page.mouse.move(box.x + box.width - 20, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, y);
  await page.mouse.up();
  await expectScore(page, "apple", 0);
  await page.evaluate(() => window.assertNoBrowserErrors());
});
