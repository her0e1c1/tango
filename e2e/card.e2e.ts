import { expect, test, type Page } from "@playwright/test";
import { getDocument, routeAnonymousAuth, seedConfig, seedDeckAndCards } from "./fixtures";

const e2eDeck = {
  id: "card-e2e-deck",
  name: "E2E Deck",
  category: "English",
  uid: "card-e2e-user",
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
  id: "card-e2e-card",
  deckId: "card-e2e-deck",
  uid: "card-e2e-user",
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

const seedCardSession = async (page: Page) => {
  await routeAnonymousAuth(page, e2eDeck.uid);
  await seedConfig(page);
  await seedDeckAndCards(e2eDeck, [e2eCard]);
};

const cardItem = (page: Page, frontText: string) =>
  page.getByText(frontText, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'rounded')][1]");

const expectScore = async (page: Page, frontText: string, score: number) => {
  await expect(cardItem(page, frontText).locator("span").filter({ hasText: new RegExp(`^${score}$`) })).toBeVisible();
};

const persistedScore = async () => {
  const document = await getDocument("card", e2eCard.id);
  return Number(document.fields.score?.integerValue);
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

test.describe.configure({ mode: "serial" });

test("shows cards for the deck", async ({ page }) => {
  await page.goto(`/deck/${e2eDeck.id}`);

  await expect(page.getByText("apple")).toBeVisible();
  await expect(cardItem(page, "apple").getByText("studied 0 time(s)")).toBeVisible();
  await expectScore(page, "apple", 0);
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("opens and closes the card back text overlay", async ({ page }) => {
  await page.goto(`/deck/${e2eDeck.id}`);

  await page.getByText("apple").click();
  await expect(page.getByText("りんご")).toBeVisible();

  await page.getByText("りんご").click();
  await expect(page.getByText("りんご")).not.toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("saves card edits and returns to the card list", async ({ page }) => {
  await page.goto(`/deck/${e2eDeck.id}`);

  await cardItem(page, "apple").locator("svg").first().click();
  await expect(page).toHaveURL(new RegExp(`/card/${e2eCard.id}/edit$`));

  await page.locator('textarea[name="frontText"]').fill("updated apple");
  await page.locator('textarea[name="backText"]').fill("updated りんご");
  await page.getByText("math", { exact: true }).click();
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(new RegExp(`/deck/${e2eDeck.id}$`));
  await expect(page.getByText("updated apple")).toBeVisible();
  await expect(cardItem(page, "updated apple").getByText("math")).toBeVisible();

  await page.getByText("updated apple").click();
  await expect(page.getByText("updated りんご")).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("deletes a card from the card list", async ({ page }) => {
  await page.goto(`/deck/${e2eDeck.id}`);

  page.on("dialog", (dialog) => dialog.accept());
  await cardItem(page, "apple").locator("svg").nth(1).click();

  await expect(page.getByText("apple")).not.toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("updates the card score with swipe gestures", async ({ page }) => {
  await page.goto(`/deck/${e2eDeck.id}`);

  const card = cardItem(page, "apple");
  const box = await card.boundingBox();
  if (box == null) throw new Error("Card bounding box is unavailable");

  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 20, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 20, y);
  await page.mouse.up();
  await expectScore(page, "apple", 1);
  await expect.poll(persistedScore).toBe(1);
  await expect(page.getByText("Saving…", { exact: true })).not.toBeVisible();

  await page.mouse.move(box.x + box.width - 20, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, y);
  await page.mouse.up();
  await expectScore(page, "apple", 0);
  await expect.poll(persistedScore).toBe(0);
  await page.evaluate(() => window.assertNoBrowserErrors());
});
