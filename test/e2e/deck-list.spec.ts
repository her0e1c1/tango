import { expect, listDocuments, requireDocument, test } from "./utils/fixtures";
import { readSession } from "./utils/study-helpers";

test("DECK-LIST-01 navigates from the Deck list to its Card list", async ({ fixture, page }) => {
  const { deck, card } = await test.step("Given: A signed-in user owns a deck with cards", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);
    await page.goto("/");
    return { deck, card };
  });
  await test.step("When: Open the deck from the list", async () => {
    await page.getByRole("button", { name: `Open cards in ${deck.name}`, exact: true }).click();
  });
  await test.step("Then: The selected deck card list is displayed", async () => {
    await expect(page).toHaveURL(`/deck/${deck.id}`);
    await expect(page.getByRole("button", { name: `View ${card.frontText}`, exact: true })).toBeVisible();
  });
});

test("DECK-LIST-04 opens and dismisses the list action menu", async ({ fixture, page }) => {
  const { deck, actions } = await test.step("Given: A deck list with its Add action focused", async () => {
    const deck = fixture.deck();
    await fixture.apply(page);
    await page.goto("/");
    const actions = page.getByRole("button", { name: "Add", exact: true });
    await actions.focus();
    return { deck, actions };
  });
  await test.step("When: Open Add with Enter", async () => {
    await actions.press("Enter");
  });
  await test.step("Then: The first menu action receives focus", async () => {
    await expect(page.getByRole("menuitem", { name: "Create deck" })).toBeFocused();
  });
  await test.step("When: Move down in the Add menu", async () => {
    await page.keyboard.press("ArrowDown");
  });
  await test.step("Then: Import decks receives focus", async () => {
    await expect(page.getByRole("menuitem", { name: "Import decks" })).toBeFocused();
  });
  await test.step("When: Dismiss Add with Escape", async () => {
    await page.keyboard.press("Escape");
  });
  await test.step("Then: The menu closes and focus returns to Add", async () => {
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(actions).toBeFocused();
  });
  await test.step("When: Switch from deck actions to Add", async () => {
    await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
    await actions.click();
  });
  await test.step("Then: Only the Add menu remains open", async () => {
    await expect(page.getByRole("menu")).toHaveCount(1);
    await expect(page.getByRole("menu", { name: "Add", exact: true })).toBeVisible();
  });
  await test.step("When: Switch back to deck actions with Enter", async () => {
    // Use the keyboard to reach the Deck trigger while the list menu may cover it.
    await page.getByRole("button", { name: `Open actions for ${deck.name}` }).press("Enter");
  });
  await test.step("Then: Only that deck action menu remains open", async () => {
    await expect(page.getByRole("menu")).toHaveCount(1);
    await expect(page.getByRole("menu", { name: `Actions for ${deck.name}` })).toBeVisible();
  });
});

test("DECK-LIST-05 opens deck creation and import from Add", async ({ fixture, page }) => {
  const actions = await test.step("Given: A user is on the deck list", async () => {
    await fixture.apply(page);
    await page.goto("/");
    return page.getByRole("button", { name: "Add", exact: true });
  });
  await test.step("When: Choose Create deck from Add", async () => {
    await actions.click();
    await page.getByRole("menuitem", { name: "Create deck" }).click();
  });
  await test.step("Then: The deck creation route opens", async () => {
    await expect(page).toHaveURL(/\/deck\/new$/);
  });
  await test.step("When: Return home and choose Import decks", async () => {
    await page.goto("/");
    await actions.click();
    await page.getByRole("menuitem", { name: "Import decks" }).click();
  });
  await test.step("Then: The import route opens", async () => {
    await expect(page).toHaveURL(/\/import$/);
  });
});

test("DECK-LIST-02 DECK-LIST-09 shows held review counts and opens existing study settings", async ({
  fixture,
  page,
}) => {
  const { deck, before } = await test.step("Given: A deck list with held due and new card counts", async () => {
    const deck = fixture.deck();
    await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
    const before = await requireDocument("deck", deck.id);
    await page.goto("/");
    await expect(page.getByRole("article", { name: deck.name, exact: true })).toBeVisible();
    await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
    return { deck, before };
  });
  await test.step("When: Open the count explanation", async () => {
    await page.getByText("About counts", { exact: true }).click();
  });
  const { review } = await test.step("Then: Counts are explained as device-held data and saved filters", async () => {
    await expect(page.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
    const review = page.getByRole("button", { name: `Review ${deck.name}`, exact: true });
    return { review };
  });
  await test.step("When: Activate Review with the keyboard", async () => {
    await review.focus();
    await page.keyboard.press("Enter");
  });
  await test.step("Then: Existing study settings open without creating a session or saving the deck", async () => {
    await expect(page).toHaveURL(`/deck/${deck.id}/start`);
    expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
    expect(await requireDocument("deck", deck.id)).toEqual(before);
  });
});

test("DECK-LIST-03 updates the list when a review deadline arrives", async ({ fixture, page }) => {
  const { deck, future, before } =
    await test.step("Given: The deck list is open just before a future card review deadline", async () => {
      const deck = fixture.deck();
      const future = fixture.card("card-future");
      await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
      const before = await requireDocument("card", future.id);
      const state = fixture.state.remote.cards.find((value) => value.id === future.id);
      if (!state?.fsrs) throw new Error("Expected a future review deadline");
      const deadline = new Date(state.fsrs.dueAt);
      await page.goto("/");
      await expect(page.getByRole("article", { name: deck.name, exact: true })).toBeVisible();
      await page.clock.install({ time: new Date(deadline.getTime() - 1000) });
      await page.clock.pauseAt(new Date(deadline.getTime() - 500));
      return { deck, future, before };
    });
  await test.step("When: Refresh counts before the review deadline", async () => {
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  });
  await test.step("Then: The future card is still excluded from due counts", async () => {
    await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
  });
  await test.step("When: Advance the clock to the review deadline", async () => {
    await page.clock.runFor(500);
  });
  await test.step("Then: Due counts update without changing cards or creating a session", async () => {
    await expect(page.getByText("2 due · 1 new", { exact: true })).toHaveCount(2);
    expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
    expect(await requireDocument("card", future.id)).toEqual(before);
  });
});

test("DECK-LIST-13 continues the existing session without changing learning data", async ({ fixture, page }) => {
  const { deck, session, currentCard, savedDeck, savedCards, savedAnswers } =
    await test.step("Given: An existing session paused at its saved card on the deck list", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-2");
      await fixture.apply(page);
      await page.goto("/");
      await expect(page.getByRole("button", { name: `Continue ${deck.name}`, exact: true })).toBeVisible();
      const savedDeck = await requireDocument("deck", deck.id);
      const savedCards = await Promise.all(fixture.state.remote.cards.map(({ id }) => requireDocument("card", id)));
      const savedAnswers = (await listDocuments("studyAnswer")).filter(
        ({ fields }) => fields.uid?.stringValue === fixture.user().uid
      );
      expect(await readSession(fixture.user().uid, deck.id)).toEqual(session);
      return { deck, session, currentCard, savedDeck, savedCards, savedAnswers };
    });
  await test.step("When: Continue studying the deck", async () => {
    await page.getByRole("button", { name: `Continue ${deck.name}`, exact: true }).click();
  });
  await test.step("Then: The same session and card resume without adding answers or changing content", async () => {
    await expect(page).toHaveURL(`/deck/${deck.id}/study`);
    await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(session.currentIndex));
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.lastStudiedAt)
      .toBeGreaterThan(session.lastStudiedAt);
    expect(await readSession(fixture.user().uid, deck.id)).toEqual({ ...session, lastStudiedAt: expect.any(Number) });
    expect(
      (await listDocuments("studySession")).filter(({ fields }) => fields.uid?.stringValue === fixture.user().uid)
    ).toHaveLength(1);
    expect(
      (await listDocuments("studyAnswer")).filter(({ fields }) => fields.uid?.stringValue === fixture.user().uid)
    ).toEqual(savedAnswers);
    expect(await requireDocument("deck", deck.id)).toEqual(savedDeck);
    expect(await Promise.all(fixture.state.remote.cards.map(({ id }) => requireDocument("card", id)))).toEqual(
      savedCards
    );
  });
});
