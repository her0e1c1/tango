import type { Page } from "@playwright/test";

import { allowExpectedFirestoreWriteFailure, expect, failNextFirestoreWrite, readLocalData, test } from "./fixtures";
import { progressOf, readProgress, readSession } from "./study-helpers";

const cardAt = <T>(cards: readonly T[], index: number) => {
  const card = cards[index];
  if (card === undefined) throw new Error(`Missing Card fixture at index ${String(index)}`);
  return card;
};

const readLocalProgress = async (page: Page, cardId: string) => {
  const { cards } = await readLocalData(page);
  const card = cards.find((candidate: Record<string, unknown>) => candidate.id === cardId);
  if (card === undefined) throw new Error(`Missing local Card ${cardId}`);
  return {
    score: Number(card.score),
    numberOfSeen: Number(card.numberOfSeen),
  };
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

const returnToDeckList = async (page: Page) => {
  await page.getByRole("button", { name: "Open study actions" }).click();
  await page.getByRole("button", { name: "Back to deck list" }).click();
};

test("SWIPE-02 saves mastered progress and advances to the next Card", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      score: currentCard.score + 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});

test("SWIPE-03 saves non-mastered progress and advances to the next Card", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe down" }).click();

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      score: currentCard.score - 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});

test("SWIPE-04 records an unrated next action and advances", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe right" }).click();

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      score: currentCard.score,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});

test("SWIPE-05 records an unrated previous action and moves back", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-2");
  const previousCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe left" }).click();

  await expect(page.getByText(previousCard.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      score: currentCard.score,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex - 1);
});

test("SWIPE-06 starts a filtered session capped by the learning limit", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const firstCard = fixture.card("card-1");
  const secondCard = fixture.card("card-2");
  const eligibleBeyondLimit = fixture.card("card-3");
  const scoreOnlyExcluded = fixture.card("card-4");
  const tagOnlyExcluded = fixture.card("card-5");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/start`);
  await expect(page.getByRole("button", { name: "Start 2 cards" })).toBeEnabled();
  await page.getByRole("button", { name: "Start 2 cards" }).click();

  await expect(page.getByText(firstCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readSession(page, deck.id))?.cardOrderIds.length).toBe(2);
  const stored = await readSession(page, deck.id);
  expect(stored?.cardOrderIds).toEqual([firstCard.id, secondCard.id]);
  expect(stored?.cardOrderIds).not.toContain(eligibleBeyondLimit.id);
  expect(stored?.cardOrderIds).not.toContain(scoreOnlyExcluded.id);
  expect(stored?.cardOrderIds).not.toContain(tagOnlyExcluded.id);
});

test("SWIPE-07 prevents an empty filtered session from starting", async ({ fixture, page }) => {
  const deck = fixture.deck();
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/start`);

  await expect(page.getByText("No cards match your filters.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  expect(await readSession(page, deck.id)).toBeUndefined();
});

test("SWIPE-08 returns and continues from the same Card", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await returnToDeckList(page);
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();

  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readSession(page, deck.id))?.sessionId).toBe(session.sessionId);
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);
});

test("SWIPE-09 restarts an in-progress Deck from a new session", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const { cards } = fixture.state.remote;
  const previous = fixture.session();
  await fixture.apply(page);

  await page.goto("/");
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Restart" }).click();
  await page.getByRole("button", { name: `Start ${String(cards.length)} cards` }).click();

  await expect(page.getByText(cardAt(cards, 0).frontText, { exact: true })).toBeVisible();
  const restarted = await readSession(page, deck.id);
  expect(restarted?.sessionId).not.toBe(previous.sessionId);
  expect(restarted?.currentIndex).toBe(0);
});

test("SWIPE-10 finishes the final Card and removes the session", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const finalCard = fixture.card("card-3");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
  await expect
    .poll(() => readProgress(finalCard.id))
    .toEqual({
      score: finalCard.score + 1,
      numberOfSeen: finalCard.numberOfSeen + 1,
    });
  expect(session.currentIndex).toBe(session.cardOrderIds.length - 1);
  expect(await readSession(page, deck.id)).toBeUndefined();
});

test("SWIPE-11 keeps multiple Deck sessions independent", async ({ fixture, page }) => {
  const deckA = fixture.deck("deck-a");
  const deckB = fixture.deck("deck-b");
  const sessionA = fixture.session("deck-a");
  const sessionB = fixture.session("deck-b");
  const currentCardA = fixture.card("card-a-1");
  const currentCardB = fixture.card("card-b-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deckA.id}/study`);
  await page.getByRole("button", { name: "Swipe up" }).click();
  await returnToDeckList(page);
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: `Continue ${deckB.name}` }).click();

  await expect(page.getByText(currentCardB.frontText, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readSession(page, deckA.id))?.currentIndex).toBe(sessionA.currentIndex + 1);
  await expect.poll(async () => (await readSession(page, deckB.id))?.currentIndex).toBe(sessionB.currentIndex);
  await expect
    .poll(() => readProgress(currentCardA.id))
    .toEqual({
      score: currentCardA.score + 1,
      numberOfSeen: currentCardA.numberOfSeen + 1,
    });
  await expect.poll(() => readProgress(currentCardB.id)).toEqual(progressOf(currentCardB));
});

test("SWIPE-12 retries a failed progress write from the same Card once", async ({ browserErrors, fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  allowExpectedFirestoreWriteFailure(browserErrors);
  const fault = await failNextFirestoreWrite(page, { collection: "card", id: currentCard.id });
  await page.getByRole("button", { name: "Swipe up" }).click();
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressOf(currentCard));
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);

  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      score: currentCard.score + 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
  await fault.dispose();
});

test("SWIPE-13 advances a remote session on a primary upward mouse drag without flipping", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText);

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      score: currentCard.score + 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
});

test("SWIPE-14 ignores non-primary mouse drags", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText, "right");
  await swipeFrontUp(page, currentCard.frontText, "middle");

  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressOf(currentCard));
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);
});

test("SWIPE-16 saves local-only progress and advances on a primary upward mouse drag", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText);

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect
    .poll(() => readLocalProgress(page, currentCard.id))
    .toEqual({
      score: currentCard.score + 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});

test("SWIPE-17 preserves local-only progress and session position across reload", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText);
  await page.getByText(nextCard.frontText, { exact: true }).waitFor();

  await page.reload();

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect
    .poll(() => readLocalProgress(page, currentCard.id))
    .toEqual({
      score: currentCard.score + 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});
