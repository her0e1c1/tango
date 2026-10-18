import { expect, listDocuments, requireDocument, test } from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";
import { createAnonymousDeck, startAnonymousStudy } from "./utils/ui-helpers";
import type { Page } from "@playwright/test";

const readSelectedTags = async (deckId: string): Promise<string[]> =>
  ((await requireDocument("deck", deckId)).fields.studyFilter?.mapValue?.fields?.selectedTags?.arrayValue?.values ?? [])
    .map((value) => value.stringValue)
    .filter((value): value is string => value !== undefined);

test("STUDY-SESSION-08 reveals, persists, and applies an additional Study tag", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `targetCard`, `targetTag` and any shared test state below.
  const deck = fixture.deck();
  const targetCard = fixture.card("card-list-actions-01");
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}/start`);

  const targetTag = page.getByRole("checkbox", { name: "tag-10", exact: true });
  await expect(targetTag).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: "Show 2 more tags" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Show 2 more tags" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(targetTag).toBeVisible();
  // When: Exercise `targetTag.locator("xpath=parent::label").click` with the prepared inputs.
  await targetTag.locator("xpath=parent::label").click();
  // Then: Verify the expected result in the assertions below.
  await expect(targetTag).toBeChecked();
  await expect(page.getByRole("button", { name: "Start 1 card" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Save filters" })).toHaveCount(0);
  await expect.poll(() => readSelectedTags(deck.id)).toEqual(["tag-10"]);

  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(targetTag).toBeVisible();
  await expect(targetTag).toBeChecked();
  // When: Exercise `page.getByRole("button", { name: "Start 1 card" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Start 1 card" }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(targetCard.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.cardOrderIds)
    .toEqual([targetCard.id]);
});

async function completeStudy(page: Page, deck: { id: string }, cards: readonly unknown[]) {
  // Given: Use this case's inputs and any shared test setup.
  await page.goto(`/deck/${encodeURIComponent(deck.id)}/start`);
  // When: Apply the operation or event under test.
  await page.getByRole("button", { name: `Start ${String(cards.length)} cards` }).click();
  for (let index = 0; index < cards.length; index += 1) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(index));
    // When: Exercise `page.getByRole("button", { name: "Swipe right: Good" }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Swipe right: Good" }).click();
  }
  await page.getByRole("button", { name: "Back to deck list" }).click();
  await page.getByRole("button", { name: "Study history", exact: true }).click();
}

async function expectCompletedHistory(page: Page, deck: { name: string }, cards: readonly unknown[]) {
  // Given: Use this case's inputs and any shared test setup.
  await expect(page.getByRole("heading", { level: 1, name: "Study history" })).toBeVisible();
  // When: Exercise `page.getByText("Show daily counts · 30 days").click` with the prepared inputs.
  await page.getByText("Show daily counts · 30 days").click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("row")).toHaveCount(31);
  await expect(page.getByRole("row").nth(1).getByRole("cell")).toHaveText(["1", "1"]);
  await expect(page.locator("dl").first().locator("dd")).toHaveText(["1", "1"]);
  await expect(page.getByRole("img", { name: /Starts and completions in the selected period/ })).toBeVisible();
  const recent = page.getByRole("region", { name: "Recent sessions" });
  await expect(recent.getByRole("listitem")).toHaveCount(1);
  await expect(recent.getByRole("heading", { name: deck.name })).toBeVisible();
  await expect(recent.locator("dd").nth(2)).toHaveText(String(cards.length));
  await expect(recent.getByText("Completed", { exact: true })).toBeVisible();
  await expect(recent.locator("dd").nth(0)).not.toHaveText("—");
  await expect(recent.locator("dd").nth(1)).not.toHaveText("—");
}

test("STUDY-SESSION-09 shows independent starts and completions after studying", async ({ fixture, page }) => {
  // Given: Use this case's inputs and any shared test setup.
  await fixture.apply(page);
  // When: Exercise `completeStudy` with the prepared inputs.
  await completeStudy(page, fixture.deck(), fixture.state.remote.cards);
  // Then: Verify the expected result in the assertions below.
  await expectCompletedHistory(page, fixture.deck(), fixture.state.remote.cards);
});

test("STUDY-SESSION-10 keeps Deck selection in the URL across navigation and reload", async ({ fixture, page }) => {
  // Given: Prepare `deck` and any shared test state below.
  await fixture.apply(page);
  await page.goto("/");
  const deck = fixture.deck();
  // When: Exercise `page.getByRole("button", { name: `Open actions for ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Study history" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("combobox", { name: "Deck", exact: true })).toHaveValue(deck.id);
  // When: Exercise `page.getByRole("combobox").selectOption` with the prepared inputs.
  await page.getByRole("combobox").selectOption("");
  await page.goBack();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("combobox")).toHaveValue(deck.id);
  // When: Exercise `page.goForward` with the prepared inputs.
  await page.goForward();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("combobox")).toHaveValue("");
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("combobox")).toHaveValue("");
  await expect(page.getByText("No study records in this period.")).toBeVisible();
  // When: Exercise `page.getByText("Show daily counts · 30 days").click` with the prepared inputs.
  await page.getByText("Show daily counts · 30 days").click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("row")).toHaveCount(31);
});

test("STUDY-SESSION-11 keeps unavailable Deck selection without displaying all history", async ({
  fixture,
  page,
  namespace,
}) => {
  // Given: Prepare `path` and any shared test state below.
  await fixture.apply(page);
  const path = `/study-history?deckId=${namespace.id("missing")}`;
  await page.goto(path);
  await expect(page.getByRole("status").filter({ hasText: "The selected deck is unavailable." })).toHaveText(
    "The selected deck is unavailable.All decks"
  );
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(path);
  await expect(page.getByRole("table")).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: "All decks" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "All decks" }).click();
  await page.getByText("Show daily counts · 30 days").click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("table")).toBeVisible();
});

test("STUDY-SESSION-12 restores anonymous study history from the device cache", async ({ fixture, page }) => {
  // Given: Prepare `local` and any shared test state below.
  await fixture.apply(page);
  const local = await createAnonymousDeck(page);
  const { deck, cards } = local;

  await completeStudy(page, deck, cards);
  await expectCompletedHistory(page, deck, cards);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expectCompletedHistory(page, deck, cards);
  await expect(page.getByText(/Anonymous data is stored only on this browser/)).toBeVisible();
  await expect(page.getByText(/Cloud history may be incomplete/)).toBeVisible();
});

test("STUDY-SESSION-13 selects presets and inclusive dates while preserving Deck and URL navigation", async ({
  fixture,
  page,
}) => {
  // Given: Use this case's inputs and any shared test setup.
  await fixture.apply(page);
  await page.goto("/study-history");
  // When: Exercise `page.getByRole("button", { name: "7 days" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "7 days" }).click();
  await page.getByText("Show daily counts · 7 days").click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("row")).toHaveCount(8);
  // When: Exercise `page.getByRole("button", { name: "90 days" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "90 days" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText("Study counts per 7 days")).toBeVisible();
  // When: Exercise `page.getByText("Show daily counts · 90 days").click` with the prepared inputs.
  await page.getByText("Show daily counts · 90 days").click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("row")).toHaveCount(31);
  // When: Exercise `page.getByRole("button", { name: "Older dates" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Older dates" }).click();
  await page.getByRole("button", { name: "Older dates" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText("61–90 of 90 days")).toBeVisible();
  await expect(page.getByRole("button", { name: "Older dates" })).toBeDisabled();
  // When: Exercise `page.getByRole("button", { name: "Custom range" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Custom range" }).click();
  await page.getByLabel("Start date").fill("2020-12-31");
  await page.getByLabel("End date").fill("2021-01-02");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.getByRole("combobox").selectOption(fixture.deck().id);
  await page.goBack();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("combobox")).toHaveValue("");
  // When: Exercise `page.goForward` with the prepared inputs.
  await page.goForward();
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("combobox")).toHaveValue(fixture.deck().id);
  await expect(page.getByLabel("Start date")).toHaveValue("2020-12-31");
  await expect(page.getByLabel("End date")).toHaveValue("2021-01-02");
  await expect(page.getByText("No study records in this period.")).toBeVisible();
  // When: Exercise `page.getByText("Show daily counts · 3 days").click` with the prepared inputs.
  await page.getByText("Show daily counts · 3 days").click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("row")).toHaveCount(4);
  await expect(page.getByRole("row", { name: "Dec 31, 2020 0 0" })).toBeVisible();
  await expect(page.getByRole("row", { name: "Jan 2, 2021 0 0" })).toBeVisible();
});

const cardAt = <T>(cards: readonly T[], index: number) => {
  const card = cards[index];
  if (card === undefined) throw new Error(`Missing Card fixture at index ${String(index)}`);
  return card;
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
  await page.getByRole("button", { name: "Open card actions" }).click();
  await page.getByRole("button", { name: "Back to deck list" }).click();
};

test("STUDY-SESSION-01 starts a filtered session capped by the learning limit", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `firstCard`, `secondCard` and any shared test state below.
  const deck = fixture.deck();
  const firstCard = fixture.card("card-1");
  const secondCard = fixture.card("card-2");
  const eligibleBeyondLimit = fixture.card("card-3");
  const otherTagExcluded = fixture.card("card-4");
  const tagOnlyExcluded = fixture.card("card-5");
  await fixture.apply(page);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();

  for (const maximum of [fixture.state.browser.preferences.study.maxNumberOfCardsToLearn, 0, 1]) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // When: Exercise `page.goto` with the prepared inputs.
    if (maximum !== fixture.state.browser.preferences.study.maxNumberOfCardsToLearn) {
      await page.goto("/settings");
      const slider = page.getByRole("slider", { name: "Maximum cards" });
      await slider.press("Home");
      if (maximum === 1) await slider.press("ArrowRight");
    }
    // Then: Verify the expected result in the assertions below.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study?.maxNumberOfCardsToLearn
        )
      )
      .toBe(maximum);
    const matchingIds = [firstCard.id, secondCard.id, eligibleBeyondLimit.id];
    const expectedIds = maximum === 0 ? matchingIds : matchingIds.slice(0, maximum);
    // When: Exercise `String` with the prepared inputs.
    const countLabel = `${String(expectedIds.length)} ${expectedIds.length === 1 ? "card" : "cards"}`;
    await page.goto(`/deck/${deck.id}/start`);
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("heading", { level: 2, name: `${countLabel} in this session` })).toBeVisible();
    // When: Exercise `page.getByRole("button", { name: `Start ${countLabel}` }).click` with the prepared inputs.
    await page.getByRole("button", { name: `Start ${countLabel}` }).click();

    // Then: Verify the expected result in the assertions below.
    await expect(page.getByText(firstCard.frontText, { exact: true })).toBeVisible();
    await expect.poll(async () => (await readSession(fixture.user().uid, deck.id))?.cardOrderIds).toEqual(expectedIds);
    const stored = await readSession(fixture.user().uid, deck.id);
    expect(stored?.cardOrderIds).not.toContain(otherTagExcluded.id);
    expect(stored?.cardOrderIds).not.toContain(tagOnlyExcluded.id);
  }
});

test("STUDY-SESSION-02 prevents an empty filtered session from starting", async ({ fixture, page }) => {
  // Given: Prepare `deck` and any shared test state below.
  const deck = fixture.deck();
  await fixture.apply(page);

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/start`);

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText("No cards match your filters.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
});

test("STUDY-SESSION-03 returns and continues from the same Card", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `session`, `currentCard` and any shared test state below.
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await returnToDeckList(page);
  await expect(page).toHaveURL(/\/$/);
  const beforeContinue = await readSession(fixture.user().uid, deck.id);
  // When: Exercise `page.getByRole("button", { name: `Continue ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(async () => (await readSession(fixture.user().uid, deck.id))?.sessionId).toBe(session.sessionId);
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex);
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.lastStudiedAt)
    .toBeGreaterThan(beforeContinue?.lastStudiedAt ?? session.lastStudiedAt);
});

test("STUDY-SESSION-04 restarts an in-progress Deck from a new session", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `previous` and any shared test state below.
  const deck = fixture.deck();
  const { cards } = fixture.state.remote;
  const previous = fixture.session();
  await fixture.apply(page);

  await page.goto("/");
  // When: Exercise `page.getByRole("button", { name: `Open actions for ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await page.getByRole("menuitem", { name: "Restart" }).click();
  await page.getByRole("button", { name: `Start ${String(cards.length)} cards` }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(cardAt(cards, 0).frontText, { exact: true })).toBeVisible();
  await expect
    .poll(async () => {
      const restarted = await readSession(fixture.user().uid, deck.id);
      return restarted !== undefined && restarted.sessionId !== previous.sessionId && restarted.currentIndex === 0;
    })
    .toBe(true);
});

test("STUDY-SESSION-05 finishes the final Card and shows the completion screen", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `session`, `finalCard` and any shared test state below.
  const deck = fixture.deck();
  const session = fixture.session();
  const finalCard = fixture.card("card-3");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  // When: Exercise `page.getByRole("button", { name: "Swipe up: Easy" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Swipe up: Easy" }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(`/deck/${deck.id}/study`);
  await expect(page.getByRole("heading", { name: "Study complete" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Study complete" })).toBeFocused();
  await expect(page.getByText(`Session: ${String(session.cardOrderIds.length)} cards`)).toBeVisible();
  const backToDeckList = page.getByRole("button", { name: "Back to deck list" });
  await expect(backToDeckList).toBeVisible();
  // When: Exercise `backToDeckList.click` with the prepared inputs.
  await backToDeckList.click();

  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toHaveCount(0);
  await expect.poll(() => readProgress(finalCard.id)).toEqual({ reps: 1 });
  expect(session.currentIndex).toBe(session.cardOrderIds.length - 1);
  expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
});

test("STUDY-SESSION-06 keeps multiple Deck sessions independent", async ({ fixture, page }) => {
  // Given: Prepare `deckA`, `deckB`, `sessionA` and any shared test state below.
  const deckA = fixture.deck("deck-a");
  const deckB = fixture.deck("deck-b");
  const sessionA = fixture.session("deck-a");
  const sessionB = fixture.session("deck-b");
  const currentCardA = fixture.card("card-a-1");
  const currentCardB = fixture.card("card-b-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deckA.id}/study`);
  // When: Exercise `page.getByRole("button", { name: "Swipe up: Easy" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Swipe up: Easy" }).click();
  await returnToDeckList(page);
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  // When: Exercise `page.getByRole("button", { name: `Continue ${deckB.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Continue ${deckB.name}` }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(currentCardB.frontText, { exact: true })).toBeVisible();
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deckA.id))?.currentIndex)
    .toBe(sessionA.currentIndex + 1);
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deckB.id))?.currentIndex)
    .toBe(sessionB.currentIndex);
  await expect.poll(() => readProgress(currentCardA.id)).toEqual({ reps: 1 });
  await expect.poll(() => readProgress(currentCardB.id)).toEqual({ reps: 0 });
});

test("STUDY-SESSION-07 preserves local-only progress and session position across reload", async ({ fixture, page }) => {
  // Given: Prepare `local`, `frontText`, `currentCard` and any shared test state below.
  await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
  const local = await createAnonymousDeck(page);
  const { deck } = local;
  const frontText = await startAnonymousStudy(page, deck.id);
  const currentCard = frontText === local.first.frontText ? local.first : local.second;
  const nextCard = currentCard === local.first ? local.second : local.first;

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText);
  await page.getByText(nextCard.frontText, { exact: true }).waitFor();

  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("1");
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/card/${currentCard.id}`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  // When: Exercise `page .getByRole("term") .filter({ hasText: /^Next review$/ }) .locator` with the prepared inputs.
  const nextReview = await page
    .getByRole("term")
    .filter({ hasText: /^Next review$/ })
    .locator("..")
    .locator("dd")
    .textContent();
  const dueMinute = Date.parse(nextReview ?? "");
  // Then: Verify the expected result in the assertions below.
  expect(Number.isFinite(dueMinute)).toBe(true);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/start`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Start 1 card", exact: true })).toBeEnabled();
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Start 1 card", exact: true })).toBeEnabled();
  // The public date display has minute precision; cross that whole minute with the page still open.
  // When: Exercise `page.clock.install` with the prepared inputs.
  await page.clock.install({ time: new Date(dueMinute - 60_000) });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Start 1 card", exact: true })).toBeEnabled();
  // When: Exercise `page.clock.runFor` with the prepared inputs.
  await page.clock.runFor(120_000);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Start 2 cards", exact: true })).toBeEnabled();
  // When: Exercise `page.getByRole("button", { name: "Start 2 cards", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Start 2 cards", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "Swipe right: Good", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Swipe right: Good", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  for (const collection of ["deck", "card", "studySession", "studyAnswer"] as const) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    expect(
      (await listDocuments(collection)).filter(({ fields }) => fields.uid?.stringValue === fixture.user().uid)
    ).toEqual([]);
  }
});
