import { expect, listDocuments, requireDocument, test } from "./utils/fixtures";
import { readSession } from "./utils/study-helpers";

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
