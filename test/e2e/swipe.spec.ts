import type { Page } from "@playwright/test";

import {
  createRemoteCardFixture,
  createRemoteDeckFixture,
  expect,
  expectedFirestoreWriteBrowserError,
  failNextFirestoreWrite,
  readLocalData,
  requireDocument,
  routeAnonymousAuth,
  seedConfig,
  seedDeckAndCards,
  seedStudySessions,
  test,
  type E2EConfigOverrides,
  type StudySessionFixture,
  type TestNamespace,
} from "./fixtures";

type DeckFixture = ReturnType<typeof createRemoteDeckFixture>;
type CardFixture = ReturnType<typeof createRemoteCardFixture>;

const createCards = (namespace: TestNamespace, deckId: string, count = 3) =>
  Array.from({ length: count }, (_, index) =>
    createRemoteCardFixture(namespace, deckId, {
      id: namespace.id(`card-${String(index + 1)}`),
      frontText: `${namespace.caseId} front ${String(index + 1)}`,
      backText: `${namespace.caseId} back ${String(index + 1)}`,
      uniqueKey: namespace.id(`key-${String(index + 1)}`),
    })
  );

const cardAt = (cards: CardFixture[], index: number) => {
  const card = cards[index];
  if (card === undefined) throw new Error(`Missing Card fixture at index ${String(index)}`);
  return card;
};

const createSession = (
  namespace: TestNamespace,
  deck: DeckFixture,
  cards: CardFixture[],
  currentIndex = 0
): StudySessionFixture => ({
  sessionId: namespace.id("session"),
  deckId: deck.id,
  cardOrderIds: cards.map((card) => card.id),
  currentIndex,
  lastStudiedAt: 1,
});

interface PrepareOptions {
  page: Page;
  namespace: TestNamespace;
  deck: DeckFixture;
  cards: CardFixture[];
  config?: E2EConfigOverrides;
  session?: StudySessionFixture;
}

const prepare = async ({ page, namespace, deck, cards, config, session }: PrepareOptions) => {
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page, config);
  await seedDeckAndCards(deck, cards);
  if (session !== undefined) {
    await seedStudySessions(page, { [deck.id]: session });
  }
};

const readProgress = async (cardId: string) => {
  const document = await requireDocument("card", cardId);
  return {
    score: Number(document.fields.score?.integerValue),
    numberOfSeen: Number(document.fields.numberOfSeen?.integerValue),
  };
};

const readSession = async (page: Page, deckId: string) => {
  const { sessionsByDeckId } = await readLocalData(page);
  return sessionsByDeckId[deckId] as StudySessionFixture | undefined;
};

const swipeFrontUp = async (page: Page, frontText: string, button: "left" | "middle" | "right" = "left") => {
  const box = await page.getByRole("button", { name: frontText, exact: true }).boundingBox();
  if (box == null) throw new Error("Study card front is not visible");
  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + box.height * 0.5);
  await page.mouse.down({ button });
  await page.mouse.move(x, box.y + box.height * 0.2, { steps: 5 });
  await page.mouse.up({ button });
};

const selectBackText = async (page: Page, backText: string) => {
  const textRect = await page.getByText(backText, { exact: true }).evaluate((element) => {
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

test("SWIPE-01 reveals the current Card answer without changing progress", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  const session = createSession(namespace, deck, cards);
  await prepare({ page, namespace, deck, cards, session });
  const before = await readProgress(cardAt(cards, 0).id);

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: cardAt(cards, 0).frontText, exact: true }).click();

  await expect(page.getByText(cardAt(cards, 0).backText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(cardAt(cards, 0).id)).toEqual(before);
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(0);
});

test("SWIPE-02 saves mastered progress and advances to the next Card", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  await prepare({ page, namespace, deck, cards, session: createSession(namespace, deck, cards) });

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page.getByText(cardAt(cards, 1).frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(cardAt(cards, 0).id)).toEqual({ score: 1, numberOfSeen: 1 });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(1);
});

test("SWIPE-03 saves non-mastered progress and advances to the next Card", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  await prepare({ page, namespace, deck, cards, session: createSession(namespace, deck, cards) });

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe down" }).click();

  await expect(page.getByText(cardAt(cards, 1).frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(cardAt(cards, 0).id)).toEqual({ score: -1, numberOfSeen: 1 });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(1);
});

test("SWIPE-04 records an unrated next action and advances", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  await prepare({ page, namespace, deck, cards, session: createSession(namespace, deck, cards) });

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe right" }).click();

  await expect(page.getByText(cardAt(cards, 1).frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(cardAt(cards, 0).id)).toEqual({ score: 0, numberOfSeen: 1 });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(1);
});

test("SWIPE-05 records an unrated previous action and moves back", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  await prepare({ page, namespace, deck, cards, session: createSession(namespace, deck, cards, 1) });

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe left" }).click();

  await expect(page.getByText(cardAt(cards, 0).frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(cardAt(cards, 1).id)).toEqual({ score: 0, numberOfSeen: 1 });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(0);
});

test("SWIPE-06 starts a filtered session capped by the learning limit", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace, {
    scoreMin: 0,
    scoreMax: 1,
    selectedTags: ["target"],
    tagAndFilter: false,
  });
  const cards = createCards(namespace, deck.id, 5).map((card, index) => {
    if (index === 3) return { ...card, score: 4, tags: ["target"] };
    if (index === 4) return { ...card, score: 0, tags: ["other"] };
    return { ...card, score: index % 2, tags: index === 2 ? ["target", "extra"] : ["target"] };
  });
  const eligibleBeyondLimit = cardAt(cards, 2);
  const scoreOnlyExcluded = cardAt(cards, 3);
  const tagOnlyExcluded = cardAt(cards, 4);
  await prepare({
    page,
    namespace,
    deck,
    cards,
    config: { study: { maxNumberOfCardsToLearn: 2 } },
  });

  await page.goto(`/deck/${deck.id}/start`);
  await expect(page.getByRole("button", { name: "Start 2 cards" })).toBeEnabled();
  await page.getByRole("button", { name: "Start 2 cards" }).click();

  await expect(page.getByText(cardAt(cards, 0).frontText, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readSession(page, deck.id))?.cardOrderIds.length).toBe(2);
  const stored = await readSession(page, deck.id);
  expect(stored?.cardOrderIds).toEqual([cardAt(cards, 0).id, cardAt(cards, 1).id]);
  expect(stored?.cardOrderIds).not.toContain(eligibleBeyondLimit.id);
  expect(stored?.cardOrderIds).not.toContain(scoreOnlyExcluded.id);
  expect(stored?.cardOrderIds).not.toContain(tagOnlyExcluded.id);
});

test("SWIPE-07 prevents an empty filtered session from starting", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace, { selectedTags: ["missing"], tagAndFilter: false });
  const cards = createCards(namespace, deck.id, 2).map((card) => ({ ...card, tags: ["target"] }));
  await prepare({ page, namespace, deck, cards });

  await page.goto(`/deck/${deck.id}/start`);

  await expect(page.getByText("No cards match your filters.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  expect(await readSession(page, deck.id)).toBeUndefined();
});

test("SWIPE-08 exits and continues from the same Card", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 3);
  await prepare({ page, namespace, deck, cards, session: createSession(namespace, deck, cards, 1) });

  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByText(cardAt(cards, 1).frontText, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Exit" }).click();
  await page.getByRole("button", { name: "tango" }).click();
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();

  await expect(page.getByText(cardAt(cards, 1).frontText, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readSession(page, deck.id))?.sessionId).toBe(namespace.id("session"));
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(1);
});

test("SWIPE-09 restarts an in-progress Deck from a new session", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 3);
  const previous = createSession(namespace, deck, cards, 2);
  await prepare({ page, namespace, deck, cards, session: previous });

  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Restart" }).click();
  await page.getByRole("button", { name: "Start 3 cards" }).click();

  await expect(page.getByText(cardAt(cards, 0).frontText, { exact: true })).toBeVisible();
  const restarted = await readSession(page, deck.id);
  expect(restarted?.sessionId).not.toBe(previous.sessionId);
  expect(restarted?.currentIndex).toBe(0);
});

test("SWIPE-10 finishes the final Card and removes the session", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  await prepare({ page, namespace, deck, cards, session: createSession(namespace, deck, cards, 1) });

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
  await expect.poll(() => readProgress(cardAt(cards, 1).id)).toEqual({ score: 1, numberOfSeen: 1 });
  expect(await readSession(page, deck.id)).toBeUndefined();
});

test("SWIPE-11 keeps multiple Deck sessions independent", async ({ namespace, page }) => {
  const deckA = createRemoteDeckFixture(namespace, { id: namespace.id("deck-a"), name: "Session Deck A" });
  const deckB = createRemoteDeckFixture(namespace, { id: namespace.id("deck-b"), name: "Session Deck B" });
  const cardsA = createCards(namespace, deckA.id, 3).map((card, index) => ({
    ...card,
    id: namespace.id(`a-card-${String(index + 1)}`),
    deckId: deckA.id,
    frontText: `A front ${String(index + 1)}`,
  }));
  const cardsB = createCards(namespace, deckB.id, 2).map((card, index) => ({
    ...card,
    id: namespace.id(`b-card-${String(index + 1)}`),
    deckId: deckB.id,
    frontText: `B front ${String(index + 1)}`,
  }));
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);
  await Promise.all([seedDeckAndCards(deckA, cardsA), seedDeckAndCards(deckB, cardsB)]);
  const sessionA = createSession(namespace, deckA, cardsA, 0);
  const sessionB = { ...createSession(namespace, deckB, cardsB, 1), sessionId: namespace.id("session-b") };
  await seedStudySessions(page, { [deckA.id]: sessionA, [deckB.id]: sessionB });

  await page.goto(`/deck/${deckA.id}/study`);
  await page.getByRole("button", { name: "Swipe up" }).click();
  await page.getByRole("button", { name: "Exit" }).click();
  await page.getByRole("button", { name: "tango" }).click();
  await page.getByRole("button", { name: `Continue ${deckB.name}` }).click();

  await expect(page.getByText(cardAt(cardsB, 1).frontText, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readSession(page, deckA.id))?.currentIndex).toBe(1);
  await expect.poll(async () => (await readSession(page, deckB.id))?.currentIndex).toBe(1);
  await expect.poll(() => readProgress(cardAt(cardsA, 0).id)).toEqual({ score: 1, numberOfSeen: 1 });
  await expect.poll(() => readProgress(cardAt(cardsB, 1).id)).toEqual({ score: 0, numberOfSeen: 0 });
});

test("SWIPE-12 retries a failed progress write from the same Card once", async ({ browserErrors, namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  await prepare({ page, namespace, deck, cards, session: createSession(namespace, deck, cards) });

  await page.goto(`/deck/${deck.id}/study`);
  browserErrors.allow(expectedFirestoreWriteBrowserError);
  const currentCard = cardAt(cards, 0);
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: currentCard.id });
  await page.getByRole("button", { name: "Swipe up" }).click();
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ score: 0, numberOfSeen: 0 });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(0);

  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page.getByText(cardAt(cards, 1).frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ score: 1, numberOfSeen: 1 });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(1);
  await fault.dispose();
});

test("SWIPE-13 advances on a primary upward mouse drag without flipping", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  await prepare({
    page,
    namespace,
    deck,
    cards,
    config: { appearance: { hideBodyWhenCardChanged: false } },
    session: createSession(namespace, deck, cards),
  });

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, cardAt(cards, 0).frontText);

  await expect(page.getByText(cardAt(cards, 1).frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(cardAt(cards, 1).backText, { exact: true })).toBeHidden();
  await expect.poll(() => readProgress(cardAt(cards, 0).id)).toEqual({ score: 1, numberOfSeen: 1 });
});

test("SWIPE-14 ignores non-primary mouse drags", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  await prepare({ page, namespace, deck, cards, session: createSession(namespace, deck, cards) });

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, cardAt(cards, 0).frontText, "right");
  await swipeFrontUp(page, cardAt(cards, 0).frontText, "middle");

  await expect(page.getByText(cardAt(cards, 0).frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(cardAt(cards, 0).id)).toEqual({ score: 0, numberOfSeen: 0 });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(0);
});

test("SWIPE-15 selects answer text without changing the Card state", async ({ namespace, page }) => {
  const deck = createRemoteDeckFixture(namespace);
  const cards = createCards(namespace, deck.id, 2);
  await prepare({ page, namespace, deck, cards, session: createSession(namespace, deck, cards) });

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: cardAt(cards, 0).frontText, exact: true }).click();
  await selectBackText(page, cardAt(cards, 0).backText);

  await expect(page.getByText(cardAt(cards, 0).backText, { exact: true })).toBeVisible();
  await expect
    .poll(async () => page.evaluate(() => window.getSelection()?.toString() ?? ""))
    .toContain(cardAt(cards, 0).backText);
  await expect.poll(() => readProgress(cardAt(cards, 0).id)).toEqual({ score: 0, numberOfSeen: 0 });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(0);
});
