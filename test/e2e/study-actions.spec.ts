import {
  allowExpectedFirestoreWriteFailure,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  test,
} from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";

test("STUDY-ACTIONS-01 saves a good answer and progress and advances to the next Card", async ({ fixture, page }) => {
  const { deck, session, currentCard, nextCard, beforeAnswer } =
    await test.step("Given: A remote study session with an unanswered current card", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      const nextCard = fixture.card("card-2");
      await fixture.apply(page);

      await page.goto(`/deck/${deck.id}/study`);
      await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
      const beforeAnswer = await readSession(fixture.user().uid, deck.id);
      return { deck, session, currentCard, nextCard, beforeAnswer };
    });
  await test.step("When: Rate the current card Good", async () => {
    await page.getByRole("button", { name: "Swipe right: Good" }).click();
  });
  await test.step("Then: The answer, progress and next position are saved", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex + 1);
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.lastStudiedAt)
      .toBeGreaterThan(beforeAnswer?.lastStudiedAt ?? session.lastStudiedAt);
    const answers = (await listDocuments("studyAnswer")).filter(
      (item) => item.fields.sessionId?.stringValue === session.sessionId
    );
    expect(answers).toHaveLength(1);
  });
});

test("STUDY-ACTIONS-05 keeps saved progress and continues after an answer history failure", async ({
  browserErrors,
  fixture,
  page,
}) => {
  const { deck, session, currentCard, nextCard, thirdCard, readAnswers, fault } =
    await test.step("Given: A session whose next answer history write will fail", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      const nextCard = fixture.card("card-2");
      const thirdCard = fixture.card("card-3");
      const readAnswers = async () =>
        (await listDocuments("studyAnswer")).filter((item) => item.fields.sessionId?.stringValue === session.sessionId);
      await fixture.apply(page);

      await page.goto(`/deck/${deck.id}/study`);
      allowExpectedFirestoreWriteFailure(browserErrors);
      const fault = await failNextFirestoreWrite(page, { collection: "studyAnswer" });
      return { deck, session, currentCard, nextCard, thirdCard, readAnswers, fault };
    });
  await test.step("When: Rate the current card Easy", async () => {
    await page.getByRole("button", { name: "Swipe up: Easy" }).click();
  });
  await test.step("Then: The failure is reported while progress and position still save", async () => {
    await expect.poll(fault.wasTriggered).toBe(true);
    await fault.waitForFailure();
    await expect(page.getByRole("alert")).toContainText("Unable to save progress.");
    await expect(page.getByRole("status").filter({ hasText: "Swiped up" })).toHaveCount(0);
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex + 1);
    await expect.poll(readAnswers).toHaveLength(0);
  });
  await test.step("When: Remove the fault and reload study", async () => {
    await fault.dispose();

    await page.reload();
  });
  await test.step("Then: The saved next card is restored", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  });
  await test.step("When: Rate the next card Easy", async () => {
    await page.getByRole("button", { name: "Swipe up: Easy" }).click();
  });
  await test.step("Then: The new answer saves once and study continues", async () => {
    await expect(page.getByRole("status").filter({ hasText: "Swiped up" })).toBeVisible();
    await expect(page.getByText(thirdCard.frontText, { exact: true })).toBeVisible();
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
    await expect.poll(() => readProgress(nextCard.id)).toEqual({ reps: 1 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex + 2);
    await expect.poll(readAnswers).toHaveLength(1);
    const answers = await readAnswers();
    expect(answers[0]?.fields.cardId?.stringValue).toBe(nextCard.id);
    expect(answers[0]?.fields.answer?.mapValue?.fields?.rating?.stringValue).toBe("easy");
  });
});
