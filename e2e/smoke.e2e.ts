import { expect, test, type Page } from "@playwright/test";

const persistedConfig = {
  useCardInterval: false,
  showSwipeButtonList: true,
  showScoreSlider: false,
  showHeader: true,
  showBackText: false,
  fullscreen: false,
  maxNumberOfCardsToLearn: 10,
  hideBodyWhenCardChanged: true,
  sizeBackText: 0,
  shuffled: false,
  autoPlay: false,
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
  loadSample: true,
  localMode: true,
};

const seedLocalModeSession = async (page: Page) => {
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

  await page.addInitScript((config) => {
    window.localStorage.setItem(
      "persist:root",
      JSON.stringify({
        config: JSON.stringify(config),
        _persist: JSON.stringify({ version: -1, rehydrated: true }),
      })
    );
  }, persistedConfig);
};

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await seedLocalModeSession(page);

  await page.exposeFunction("assertNoBrowserErrors", () => {
    expect(errors).toEqual([]);
  });
});

test("shows the deck list smoke screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("tango")).toBeVisible();
  await expect(page.getByText("Sample Deck")).toBeVisible();
  await page.evaluate(() => (window as any).assertNoBrowserErrors());
});

test("shows settings and allows changing a local setting", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByText("Settings")).toBeVisible();
  await expect(page.getByText("Local Mode")).toBeVisible();

  const localMode = page.locator('input[name="localMode"]');
  await expect(localMode).toBeChecked();
  await page.locator('input[name="localMode"] + span').click();
  await expect(localMode).not.toBeChecked();
  await page.evaluate(() => (window as any).assertNoBrowserErrors());
});

test("shows the import screen", async ({ page }) => {
  await page.goto("/import");

  await expect(page.getByText("Deck Upload")).toBeVisible();
  await expect(page.getByText("CSV File Format")).toBeVisible();
  await expect(page.getByText("CSV Sample")).toBeVisible();
  await page.evaluate(() => (window as any).assertNoBrowserErrors());
});
