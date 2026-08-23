import { expect, test, type Page } from "@playwright/test";
import { e2eConfig, getDocument, routeAnonymousAuth, seedConfig, seedDeckAndCards } from "./fixtures";

type SeedCard = Record<string, unknown> & { id: string };

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
] satisfies [SeedCard, SeedCard];

const persistedStudy = {
  state: {
    sessionsByDeckId: {
      [e2eDeck.id]: {
        sessionId: "swipe-e2e-session",
        deckId: e2eDeck.id,
        cardOrderIds: e2eCards.map((card) => card.id),
        currentIndex: 0,
        lastStudiedAt: 0,
      },
    },
  },
  version: 4,
};

const keepBodyAfterCardChangedConfig = {
  ...e2eConfig,
  appearance: { ...e2eConfig.appearance, hideBodyWhenCardChanged: false },
};

const seedSwipeSession = async (page: Page, config = e2eConfig) => {
  await routeAnonymousAuth(page, e2eDeck.uid);
  await seedConfig(page, config);
  await seedDeckAndCards(e2eDeck, e2eCards);
  await page.goto("/");
  await expect(page.getByText(e2eDeck.name)).toBeVisible();
  await page.evaluate((study) => {
    window.localStorage.setItem("tango-study", JSON.stringify(study));
  }, persistedStudy);
};

const persistedCard = async (cardId: string) => {
  const document = await getDocument("card", cardId);
  return {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: Biome ignores noUncheckedIndexedAccess; remove after biomejs/biome#11277.
    score: Number(document.fields.score?.integerValue),
    // biome-ignore lint/suspicious/noUnnecessaryConditions: Biome ignores noUncheckedIndexedAccess; remove after biomejs/biome#11277.
    numberOfSeen: Number(document.fields.numberOfSeen?.integerValue),
  };
};

const persistedStudyEnvelope = async (page: Page) =>
  page.evaluate(() => JSON.parse(window.localStorage.getItem("tango-study") ?? "{}"));

const swipeFrontUp = async (page: Page, button: "left" | "middle" | "right" = "left") => {
  const box = await page.getByRole("button", { name: "apple", exact: true }).boundingBox();
  if (box == null) throw new Error("Study card front is not visible");

  const x = box.x + box.width / 2;
  // Start near the center so responsive edge spacing cannot move the drag outside the card surface.
  await page.mouse.move(x, box.y + box.height * 0.5);
  await page.mouse.down({ button });
  await page.mouse.move(x, box.y + box.height * 0.2, { steps: 5 });
  await page.mouse.up({ button });
};

const selectBackText = async (page: Page) => {
  const textRect = await page.getByText("りんご", { exact: true }).evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return { left: rect.left, right: rect.right, y: rect.top + rect.height / 2 };
  });

  await page.mouse.move(textRect.left + 1, textRect.y);
  await page.mouse.down();
  await page.mouse.move(textRect.right - 1, textRect.y, { steps: 5 });
  await page.mouse.up();
};

const persistedStateBoundaries = async (page: Page) =>
  page.evaluate(() => {
    const root = JSON.parse(window.localStorage.getItem("tango-config") ?? "{}");
    const state = root.state ?? {};
    const preferences = state.preferences ?? {};
    const hasOwn = (value: object, key: PropertyKey) => Object.getOwnPropertyDescriptor(value, key) !== undefined;
    return {
      rootDeck: hasOwn(state, "deck"),
      rootCard: hasOwn(state, "card"),
      preferencesShowBackText: hasOwn(preferences, "showBackText"),
      preferencesAutoPlay: hasOwn(preferences, "autoPlay"),
      preferencesLastSwipe: hasOwn(preferences, "lastSwipe"),
    };
  });

const prepareSwipeSession = async (page: Page, config = e2eConfig) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await seedSwipeSession(page, config);
  await page.exposeFunction("assertNoBrowserErrors", () => expect(errors).toEqual([]));
};

test.describe.configure({ mode: "serial" });

test.describe("study session", () => {
  test.beforeEach(async ({ page }) => {
    await prepareSwipeSession(page);
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
    await expect.poll(async () => persistedCard(e2eCards[0].id)).toMatchObject({ score: 1, numberOfSeen: 1 });
    await expect
      .poll(async () => persistedStudyEnvelope(page))
      .toMatchObject({
        state: {
          sessionsByDeckId: {
            [e2eDeck.id]: {
              deckId: e2eDeck.id,
              cardOrderIds: e2eCards.map((card) => card.id),
              currentIndex: 1,
            },
          },
        },
        version: 4,
      });
    await expect
      .poll(async () => persistedStateBoundaries(page))
      .toEqual({
        rootDeck: false,
        rootCard: false,
        preferencesShowBackText: false,
        preferencesAutoPlay: false,
        preferencesLastSwipe: false,
      });
    await page.evaluate(() => window.assertNoBrowserErrors());
  });
});

test.describe("mouse swipe regression", () => {
  test.beforeEach(async ({ page }) => {
    await prepareSwipeSession(page, keepBodyAfterCardChangedConfig);
  });

  test("advances with an upward drag without flipping the next card", async ({ page }) => {
    await page.goto(`/deck/${e2eDeck.id}/study`);

    await expect(page.getByText("apple")).toBeVisible();
    await swipeFrontUp(page);

    await expect(page.getByText("banana")).toBeVisible();
    await expect(page.getByText("バナナ")).toBeHidden();
    await expect.poll(async () => persistedCard(e2eCards[0].id)).toMatchObject({ score: 1, numberOfSeen: 1 });

    await page.getByRole("button", { name: "banana", exact: true }).click();
    await expect(page.getByText("バナナ")).toBeVisible();
    await page.evaluate(() => window.assertNoBrowserErrors());
  });

  test("ignores non-primary mouse drags", async ({ page }) => {
    await page.goto(`/deck/${e2eDeck.id}/study`);

    await expect(page.getByText("apple")).toBeVisible();
    await swipeFrontUp(page, "right");
    await swipeFrontUp(page, "middle");

    await expect(page.getByText("apple")).toBeVisible();
    await expect.poll(async () => persistedCard(e2eCards[0].id)).toMatchObject({ score: 0, numberOfSeen: 0 });
    await page.evaluate(() => window.assertNoBrowserErrors());
  });

  test("keeps the back visible while selecting its text", async ({ page }) => {
    await page.goto(`/deck/${e2eDeck.id}/study`);
    await page.getByRole("button", { name: "apple", exact: true }).click();

    await expect(page.getByText("りんご", { exact: true })).toBeVisible();
    await selectBackText(page);

    await expect(page.getByText("りんご", { exact: true })).toBeVisible();
    await expect.poll(async () => page.evaluate(() => window.getSelection()?.toString() ?? "")).toContain("りんご");
    await expect.poll(async () => persistedCard(e2eCards[0].id)).toMatchObject({ score: 0, numberOfSeen: 0 });
    await page.evaluate(() => window.assertNoBrowserErrors());
  });
});
