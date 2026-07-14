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

const e2eCards = [
  {
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
  },
  {
    id: "e2e-card-2",
    deckId: "e2e-deck-1",
    uid: "e2e-user",
    frontText: "banana",
    backText: "バナナ",
    tags: [],
    uniqueKey: "e2e-card-2",
    score: 0,
    numberOfSeen: 0,
    interval: 0,
    nextSeeingAt: new Date(0).toISOString(),
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  },
];

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

const persistedStudy = {
  state: {
    session: {
      deckId: "e2e-deck-1",
      cardOrderIds: ["e2e-card-1", "e2e-card-2"],
      currentIndex: 0,
    },
    legacyMigratedDeckIds: {},
  },
  version: 1,
};

const seedSwipeSession = async (page: Page) => {
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
    ({ config, deck, cards, study }) => {
      window.localStorage.setItem(
        "persist:root",
        JSON.stringify({
          config: JSON.stringify(config),
          deck: JSON.stringify({ byId: { [deck.id]: deck }, categories: [deck.category] }),
          card: JSON.stringify({
            byId: Object.fromEntries(cards.map((card) => [card.id, card])),
            tags: [],
          }),
          _persist: JSON.stringify({ version: 1, rehydrated: true }),
        })
      );
      window.localStorage.setItem("tango-study", JSON.stringify(study));
    },
    { config: persistedConfig, deck: e2eDeck, cards: e2eCards, study: persistedStudy }
  );
};

const persistedCard = async (page: Page, cardId: string) => {
  return page.evaluate((id) => {
    const root = JSON.parse(window.localStorage.getItem("persist:root") ?? "{}");
    return JSON.parse(root.card).byId[id];
  }, cardId);
};

const persistedStudySession = async (page: Page) => {
  return page.evaluate(() => {
    const persisted = JSON.parse(window.localStorage.getItem("tango-study") ?? "{}");
    return persisted.state?.session;
  });
};

const persistedReduxStudyFields = async (page: Page) => {
  return page.evaluate(() => {
    const root = JSON.parse(window.localStorage.getItem("persist:root") ?? "{}");
    const deck = JSON.parse(root.deck).byId["e2e-deck-1"];
    const config = JSON.parse(root.config);
    return {
      deckCurrentIndex: Object.hasOwn(deck, "currentIndex"),
      deckCardOrderIds: Object.hasOwn(deck, "cardOrderIds"),
      configShowBackText: Object.hasOwn(config, "showBackText"),
      configAutoPlay: Object.hasOwn(config, "autoPlay"),
      configLastSwipe: Object.hasOwn(config, "lastSwipe"),
    };
  });
};

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await seedSwipeSession(page);

  await page.exposeFunction("assertNoBrowserErrors", () => {
    expect(errors).toEqual([]);
  });
});

test("shows the front and back text in the deck study screen", async ({ page }) => {
  await page.goto("/deck/e2e-deck-1/study");

  await expect(page.getByText("apple")).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(page.getByText("りんご")).toBeVisible();
  await page.evaluate(() => (window as any).assertNoBrowserErrors());
});

test("updates study progress with a mastered deck swipe", async ({ page }) => {
  await page.goto("/deck/e2e-deck-1/study");

  await expect(page.getByText("apple")).toBeVisible();
  await page.keyboard.press("ArrowUp");

  await expect(page.getByText("banana")).toBeVisible();
  await expect.poll(async () => persistedCard(page, "e2e-card-1")).toMatchObject({ score: 1, numberOfSeen: 1 });
  await expect.poll(async () => persistedStudySession(page)).toMatchObject({
    deckId: "e2e-deck-1",
    cardOrderIds: ["e2e-card-1", "e2e-card-2"],
    currentIndex: 1,
  });
  await expect.poll(async () => persistedReduxStudyFields(page)).toEqual({
    deckCurrentIndex: false,
    deckCardOrderIds: false,
    configShowBackText: false,
    configAutoPlay: false,
    configLastSwipe: false,
  });
  await page.evaluate(() => (window as any).assertNoBrowserErrors());
});
