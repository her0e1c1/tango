import { expect, test, type Page } from "@playwright/test";
import { routeAnonymousAuth, seedConfig, seedDeckAndCards } from "./fixtures";

const uid = "deck-list-e2e-user";

const createDeck = (id: string, name: string) => ({
  id,
  name,
  category: "English",
  uid,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  scoreMax: null,
  scoreMin: null,
  isPublic: false,
  selectedTags: [],
  tagAndFilter: false,
  convertToBr: false,
});

const createCard = (id: string, deckId: string, frontText: string) => ({
  id,
  deckId,
  uid,
  frontText,
  backText: `${frontText} back`,
  tags: [],
  uniqueKey: id,
  score: 0,
  numberOfSeen: 0,
  interval: 0,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
});

const deckA = createDeck("deck-list-e2e-a", "Deck A");
const deckB = createDeck("deck-list-e2e-b", "Deck B");
const cardsA = [
  createCard("deck-list-e2e-a-1", deckA.id, "A first"),
  createCard("deck-list-e2e-a-2", deckA.id, "A second"),
];
const cardsB = [createCard("deck-list-e2e-b-1", deckB.id, "B only")];

const seedDecks = async (page: Page) => {
  await routeAnonymousAuth(page, uid);
  await seedConfig(page);
  await Promise.all([seedDeckAndCards(deckA, cardsA), seedDeckAndCards(deckB, cardsB)]);
};

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await seedDecks(page);
  await page.exposeFunction("assertNoBrowserErrors", () => expect(errors).toEqual([]));
});

test("keeps independent progress for multiple studying decks", async ({ page }) => {
  await page.goto(`/deck/${deckA.id}/start`);
  await page.getByRole("button", { name: "Start to study 2 card(s) from 2" }).click();
  await expect(page.getByText("A first")).toBeVisible();
  await page.getByRole("button", { name: "Swipe up" }).click();
  await expect(page.getByText("A second")).toBeVisible();

  await page.goto(`/deck/${deckB.id}/start`);
  await page.getByRole("button", { name: "Start to study 1 card(s) from 1" }).click();
  await expect(page.getByText("B only")).toBeVisible();

  await page.goto("/");
  const studying = page.getByRole("region", { name: "Studying" });
  await expect(studying.getByRole("button", { name: "Continue Deck A" })).toBeVisible();
  await expect(studying.getByRole("button", { name: "Continue Deck B" })).toBeVisible();

  await studying.getByRole("button", { name: "Continue Deck A" }).click();
  await expect(page.getByText("A second")).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "Continue Deck B" }).click();
  await expect(page.getByText("B only")).toBeVisible();
  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Continue Deck A" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue Deck B" })).not.toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});
