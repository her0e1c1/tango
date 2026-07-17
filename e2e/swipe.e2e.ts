import { expect, test, type Page } from "@playwright/test";
import { getDocument, routeAnonymousAuth, seedConfig, seedDeckAndCards } from "./fixtures";

const e2eDeck = {
  id: "swipe-e2e-deck",
  name: "E2E Deck",
  category: "English",
  uid: "swipe-e2e-user",
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

const e2eCards = [
  {
    id: "swipe-e2e-card-1",
    deckId: e2eDeck.id,
    uid: e2eDeck.uid,
    frontText: "apple",
    backText: "りんご",
    tags: [],
    uniqueKey: "swipe-e2e-card-1",
    score: 0,
    numberOfSeen: 0,
    interval: 0,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  },
  {
    id: "swipe-e2e-card-2",
    deckId: e2eDeck.id,
    uid: e2eDeck.uid,
    frontText: "banana",
    backText: "バナナ",
    tags: [],
    uniqueKey: "swipe-e2e-card-2",
    score: 0,
    numberOfSeen: 0,
    interval: 0,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  },
];

const persistedStudy = {
  state: {
    session: {
      deckId: e2eDeck.id,
      cardOrderIds: e2eCards.map((card) => card.id),
      currentIndex: 0,
    },
  },
  version: 2,
};

const seedSwipeSession = async (page: Page) => {
  await routeAnonymousAuth(page, e2eDeck.uid);
  await seedConfig(page);
  await seedDeckAndCards(e2eDeck, e2eCards);
  await page.addInitScript((study) => {
    window.localStorage.setItem("tango-study", JSON.stringify(study));
  }, persistedStudy);
};

const persistedCard = async (cardId: string) => {
  const document = await getDocument("card", cardId);
  return {
    score: Number(document.fields.score?.integerValue),
    numberOfSeen: Number(document.fields.numberOfSeen?.integerValue),
  };
};

const persistedStudyEnvelope = async (page: Page) =>
  page.evaluate(() => JSON.parse(window.localStorage.getItem("tango-study") ?? "{}"));

const persistedStateBoundaries = async (page: Page) =>
  page.evaluate(() => {
    const root = JSON.parse(window.localStorage.getItem("tango-config") ?? "{}");
    const state = root.state ?? {};
    const config = state.config ?? {};
    const hasOwn = (value: object, key: PropertyKey) => Object.getOwnPropertyDescriptor(value, key) !== undefined;
    return {
      rootDeck: hasOwn(state, "deck"),
      rootCard: hasOwn(state, "card"),
      configShowBackText: hasOwn(config, "showBackText"),
      configAutoPlay: hasOwn(config, "autoPlay"),
      configLastSwipe: hasOwn(config, "lastSwipe"),
    };
  });

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await seedSwipeSession(page);
  await page.exposeFunction("assertNoBrowserErrors", () => expect(errors).toEqual([]));
});

test("shows the front and back text in the deck study screen", async ({ page }) => {
  await page.goto(`/deck/${e2eDeck.id}/study`);

  await expect(page.getByText("apple")).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(page.getByText("りんご")).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("updates study progress with a mastered deck swipe", async ({ page }) => {
  await page.goto(`/deck/${e2eDeck.id}/study`);

  await expect(page.getByText("apple")).toBeVisible();
  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page.getByText("banana")).toBeVisible();
  await expect.poll(async () => persistedCard(e2eCards[0]?.id ?? "")).toMatchObject({ score: 1, numberOfSeen: 1 });
  await expect.poll(async () => persistedStudyEnvelope(page)).toMatchObject({
    state: {
      sessionsByDeckId: {
        [e2eDeck.id]: {
          deckId: e2eDeck.id,
          cardOrderIds: e2eCards.map((card) => card.id),
          currentIndex: 1,
        },
      },
    },
    version: 3,
  });
  await expect.poll(async () => persistedStateBoundaries(page)).toEqual({
    rootDeck: false,
    rootCard: false,
    configShowBackText: false,
    configAutoPlay: false,
    configLastSwipe: false,
  });
  await page.evaluate(() => window.assertNoBrowserErrors());
});
