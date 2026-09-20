import type { Page } from "@playwright/test";

import {
  allowExpectedFirestoreWriteFailure,
  expect,
  failNextFirestoreWrite,
  readLocalData,
  listDocuments,
  test,
} from "./fixtures";
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
    difficulty: Number(card.difficulty),
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

  const feedback = page.getByRole("status").filter({ hasText: "Swiped up" });
  const directionIcon = page.getByTestId("swipe-feedback-direction");
  await expect(feedback).toBeVisible();
  await expect(directionIcon).toHaveAttribute("data-swipe-feedback-direction", "cardSwipeUp");
  await expect(directionIcon).toBeVisible();
  await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(0);
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      difficulty: currentCard.difficulty - 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  expect((await readAttempts(currentCard.id)).map((entry) => entry.fields.rating?.stringValue)).toEqual(["good"]);
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
  await expect(feedback).toHaveCount(0, { timeout: 2000 });
  await expect(directionIcon).toHaveCount(0);
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
      difficulty: currentCard.difficulty + 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  expect((await readAttempts(currentCard.id)).map((entry) => entry.fields.rating?.stringValue)).toEqual(["again"]);
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});

test("SWIPE-04 advances without changing review state", async ({ fixture, page }) => {
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
      difficulty: currentCard.difficulty,
      numberOfSeen: currentCard.numberOfSeen,
    });
  expect(await readAttempts(currentCard.id)).toHaveLength(0);
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});

test("SWIPE-05 moves back without changing review state", async ({ fixture, page }) => {
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
      difficulty: currentCard.difficulty,
      numberOfSeen: currentCard.numberOfSeen,
    });
  expect(await readAttempts(currentCard.id)).toHaveLength(0);
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex - 1);
});

test("SWIPE-06 starts a filtered session capped by the learning limit", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const firstCard = fixture.card("card-1");
  const secondCard = fixture.card("card-2");
  const eligibleBeyondLimit = fixture.card("card-3");
  const difficultyOnlyExcluded = fixture.card("card-4");
  const tagOnlyExcluded = fixture.card("card-5");
  await fixture.apply(page);

  for (const maximum of [fixture.state.browser.preferences.study.maxNumberOfCardsToLearn, 0, 1]) {
    if (maximum !== fixture.state.browser.preferences.study.maxNumberOfCardsToLearn) {
      await page.goto("/settings");
      const slider = page.getByRole("slider", { name: "Maximum cards" });
      await slider.press("Home");
      if (maximum === 1) await slider.press("ArrowRight");
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study
                ?.maxNumberOfCardsToLearn
          )
        )
        .toBe(maximum);
    }
    const matchingIds = [firstCard.id, secondCard.id, eligibleBeyondLimit.id];
    const expectedIds = maximum === 0 ? matchingIds : matchingIds.slice(0, maximum);
    const countLabel = `${String(expectedIds.length)} ${expectedIds.length === 1 ? "card" : "cards"}`;
    await page.goto(`/deck/${deck.id}/start`);
    await expect(page.getByRole("heading", { level: 2, name: `${countLabel} in this session` })).toBeVisible();
    await page.getByRole("button", { name: `Start ${countLabel}` }).click();

    await expect(page.getByText(firstCard.frontText, { exact: true })).toBeVisible();
    await expect.poll(async () => (await readSession(page, deck.id))?.cardOrderIds).toEqual(expectedIds);
    const stored = await readSession(page, deck.id);
    expect(stored?.cardOrderIds).not.toContain(difficultyOnlyExcluded.id);
    expect(stored?.cardOrderIds).not.toContain(tagOnlyExcluded.id);
  }
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

test("SWIPE-10 finishes the final Card and shows the completion screen", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const finalCard = fixture.card("card-3");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page).toHaveURL(`/deck/${deck.id}/study`);
  await expect(page.getByRole("heading", { name: "Study complete" })).toBeVisible();
  await expect(page.getByText(`You studied ${String(session.cardOrderIds.length)} cards.`)).toBeVisible();
  const backToDeckList = page.getByRole("button", { name: "Back to deck list" });
  await expect(backToDeckList).toBeVisible();
  await backToDeckList.click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
  await expect
    .poll(() => readProgress(finalCard.id))
    .toEqual({
      difficulty: finalCard.difficulty - 1,
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
  await expect.poll(async () => (await readSession(page, deckA.id))?.currentIndex).toBe(sessionA.currentIndex + 1);
  await returnToDeckList(page);
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: `Continue ${deckB.name}` }).click();

  await expect(page.getByText(currentCardB.frontText, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readSession(page, deckA.id))?.currentIndex).toBe(sessionA.currentIndex + 1);
  await expect.poll(async () => (await readSession(page, deckB.id))?.currentIndex).toBe(sessionB.currentIndex);
  await expect
    .poll(() => readProgress(currentCardA.id))
    .toEqual({
      difficulty: currentCardA.difficulty - 1,
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
  await expect(page.getByRole("status").filter({ hasText: "Swiped up" })).toHaveCount(0);
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressOf(currentCard));
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);

  const pending = await readPending(page);
  await page.getByRole("button", { name: "Retry saved review" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Swiped up" })).toBeVisible();
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      difficulty: currentCard.difficulty - 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
  const attempts = await readAttempts(currentCard.id);
  expect(attempts).toHaveLength(1);
  expect(attempts[0]?.name).toContain(pending.input.operationId);
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
      difficulty: currentCard.difficulty - 1,
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
      difficulty: currentCard.difficulty - 1,
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
      difficulty: currentCard.difficulty - 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});

test("SWIPE-24 shows configured Study controls without changing the active session", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  const progressBeforeHelp = await readProgress(currentCard.id);
  await expect(page.getByRole("button", { name: "Open study help" })).toBeVisible();
  await page.getByRole("button", { name: "Open study help" }).click();

  const dialog = page.getByRole("dialog", { name: "Study controls" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Arrow Up / Swipe UpEnd the current session and return to the deck list");
  await expect(dialog).toContainText("Arrow Down / Swipe DownNo action");
  await expect(dialog).toContainText("Arrow Left / Swipe LeftToggle mastered and go to the next card");
  await expect(dialog).toContainText("Arrow Right / Swipe RightGo to the previous card");
  await expect(dialog).toContainText("Enter / Select CardFlip or reveal the current card");
  await expect(dialog).toContainText("Space / Play or Pause buttonPlay or pause autoplay");
  await expect(dialog).toContainText("B / Swipe controls buttonShow the currently hidden swipe buttons");
  await expect(dialog).toContainText("Playback controls buttonShow the currently hidden playback controls");
  await expect(dialog).toContainText("Card details buttonShow or hide difficulty and study history");
  await expect(dialog).toContainText("Back to deck list buttonExit without ending the current study session");

  const close = dialog.getByRole("button", { name: "Close help" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("b");

  await expect(dialog).toContainText("B / Swipe controls buttonShow the currently hidden swipe buttons");
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressBeforeHelp);
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);

  await page.keyboard.press("Escape");

  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Open study help" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Swipe left" })).toHaveCount(0);
});

test("SWIPE-25 toggles and persists the Study Help button", async ({ fixture, page }) => {
  const deck = fixture.deck();
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  const help = page.getByRole("button", { name: "Open study help" });
  const actions = page.getByRole("button", { name: "Open study actions" });
  await expect(help).toBeVisible();
  await expect(actions).toBeVisible();
  const helpBounds = await help.boundingBox();
  const actionsBounds = await actions.boundingBox();
  expect(helpBounds).not.toBeNull();
  expect(actionsBounds).not.toBeNull();
  if (helpBounds !== null && actionsBounds !== null)
    expect(helpBounds.x + helpBounds.width).toBeLessThanOrEqual(actionsBounds.x);

  await actions.click();
  await page.getByRole("button", { name: "Help button" }).click();
  await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open study actions" }).click();
  await expect(page.getByRole("button", { name: "Help button" })).toHaveAttribute("aria-pressed", "false");
});

const readAttempts = async (cardId: string) =>
  (await listDocuments("studyAttempt")).filter((entry) => entry.fields.cardId?.stringValue === cardId);
const readPending = async (page: Page) =>
  page.evaluate(() => {
    const key = Object.keys(sessionStorage).find((name) => name.startsWith("tango-pending-study:"));
    if (!key) throw new Error("Missing pending study");
    return JSON.parse(sessionStorage.getItem(key) ?? "null") as { input: { operationId: string; answeredAt: string } };
  });

test("SWIPE-27 preserves both clients' simultaneous reviews", async ({ fixture, page, browserErrors }) => {
  await fixture.apply(page);
  const context = page.context();
  allowExpectedFirestoreWriteFailure(browserErrors);
  const other = await context.newPage();
  try {
    await fixture.seedPage(other);
    const route = `/deck/${fixture.deck().id}/study`;
    await Promise.all([page.goto(route), other.goto(route)]);
    await Promise.all([
      page.getByRole("button", { name: "Swipe up" }).click(),
      other.getByRole("button", { name: "Swipe up" }).click(),
    ]);
    for (const client of [page, other]) {
      const next = client.getByText(fixture.card("card-2").frontText, { exact: true });
      const retry = client.getByRole("button", { name: "Retry saved review" });
      // Contention can be a terminal permission error in the emulator. A user confirms
      // the retained operation explicitly, exactly as for an uncertain network result.
      await expect
        .poll(async () => (await next.isVisible()) || ((await retry.isVisible()) && (await retry.isEnabled())))
        .toBe(true);
      if (!(await next.isVisible())) await retry.click();
      await expect(next).toBeVisible();
    }
    const card = fixture.card("card-1");
    await expect
      .poll(() => readProgress(card.id))
      .toEqual({ difficulty: card.difficulty - 2, numberOfSeen: card.numberOfSeen + 2 });
    await expect.poll(() => readAttempts(card.id)).toHaveLength(2);
  } finally {
    await other.close();
  }
});

test("SWIPE-28 restores an offline review without automatic resubmission", async ({
  fixture,
  page,
  context,
  browserErrors,
}) => {
  await fixture.apply(page);
  const card = fixture.card("card-1");
  await page.goto(`/deck/${fixture.deck().id}/study`);
  await expect(page.getByRole("button", { name: "Swipe up" })).toBeVisible();
  browserErrors.allow(/^console error: Failed to load resource: net::ERR_INTERNET_DISCONNECTED/);
  browserErrors.allow(/^console error:.*Firestore.*Could not reach Cloud Firestore backend/);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Swipe up" }).click();
  await expect(page.getByRole("button", { name: "Retry saved review" })).toBeEnabled({ timeout: 20_000 });
  const pending = await readPending(page);
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole("button", { name: "Retry saved review" })).toBeEnabled();
  expect(await readPending(page)).toEqual(pending);
  expect(await readProgress(card.id)).toEqual(progressOf(card));
  expect(await readAttempts(card.id)).toHaveLength(0);
  await expect(page.getByText(card.frontText, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Retry saved review" }).click();
  await expect(page.getByText(fixture.card("card-2").frontText, { exact: true })).toBeVisible();
  expect(await readAttempts(card.id)).toHaveLength(1);
  expect((await readAttempts(card.id))[0]?.name).toContain(pending.input.operationId);
});
