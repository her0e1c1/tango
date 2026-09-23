import {
  allowExpectedFirestoreWriteFailure,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  test,
} from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";

test("STUDY-ACTIONS-01 saves a good answer and progress and advances to the next Card", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  const beforeAnswer = await readSession(fixture.user().uid, deck.id);
  await page.getByRole("button", { name: "Swipe right" }).click();

  const feedback = page.getByRole("status").filter({ hasText: "Swiped right" });
  const directionIcon = page.getByTestId("swipe-feedback-direction");
  await expect(feedback).toBeVisible();
  await expect(directionIcon).toHaveAttribute("data-swipe-feedback-direction", "cardSwipeRight");
  await expect(directionIcon).toBeVisible();
  await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(0);
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex + 1);
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.lastStudiedAt)
    .toBeGreaterThan(beforeAnswer?.lastStudiedAt ?? session.lastStudiedAt);
  await expect(feedback).toHaveCount(0, { timeout: 2000 });
  await expect(directionIcon).toHaveCount(0);
  const answers = (await listDocuments("studyAnswer")).filter(
    (item) => item.fields.sessionId?.stringValue === session.sessionId
  );
  expect(answers).toHaveLength(1);
  expect(answers[0]?.fields.answer?.mapValue?.fields).toMatchObject({
    type: { stringValue: "rating" },
    rating: { stringValue: "good" },
  });
});

test("STUDY-ACTIONS-02 saves an again answer and progress and advances to the next Card", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Swipe left" }).click();

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex + 1);
});

test("STUDY-ACTIONS-03 skips without creating an answer and advances", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await page.getByRole("button", { name: "Skip" }).click();

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex + 1);
  expect(
    (await listDocuments("studyAnswer")).filter((item) => item.fields.sessionId?.stringValue === session.sessionId)
  ).toHaveLength(0);
});

test("STUDY-ACTIONS-04 prevents returning to previous Cards through study controls", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-2");
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}/study`);

  await expect(page.getByText("Again", { exact: true })).toBeVisible();
  await expect(page.getByText("Hard", { exact: true })).toBeVisible();
  await expect(page.getByText("Good", { exact: true })).toBeVisible();
  await expect(page.getByText("Easy", { exact: true })).toBeVisible();
  const front = page.getByRole("button", { name: currentCard.frontText, exact: true });
  const slider = page.getByRole("slider", { name: "Study progress" });
  await slider.press("Home");
  await expect(slider).toHaveValue(String(session.currentIndex));
  await slider.click({ position: { x: 1, y: 10 } });
  await expect(slider).toHaveValue(String(session.currentIndex));
  await expect(front).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex);
  await expect(page.getByTestId("swipe-feedback-direction")).toHaveCount(0);
});

test("STUDY-ACTIONS-05 retries a failed progress write from the same Card once", async ({
  browserErrors,
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  allowExpectedFirestoreWriteFailure(browserErrors);
  const fault = await failNextFirestoreWrite(page, { collection: "studyAnswer" });
  await page.getByRole("button", { name: "Swipe up" }).click();
  await expect.poll(fault.wasTriggered).toBe(true);
  await fault.waitForFailure();
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Swiped up" })).toHaveCount(0);
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex);

  await page.getByRole("button", { name: "Swipe up" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Swiped up" })).toBeVisible();
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex + 1);
  await fault.dispose();
});
