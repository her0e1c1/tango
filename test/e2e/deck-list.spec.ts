import type { Page, Route } from "@playwright/test";
import {
  allowExpectedFirestoreWriteFailure,
  expect,
  failNextFirestoreWrite,
  listDocuments,
  requireDocument,
  test,
} from "./utils/fixtures";
import { readSession } from "./utils/study-helpers";

test("DECK-LIST-01 DECK-LIST-04 DECK-LIST-05 navigates from the Deck list to its Card list", async ({
  fixture,
  page,
}) => {
  const { deck, card, actions } = await test.step("Given: A deck list with its Add action focused", async () => {
    const deck = fixture.deck();
    const card = fixture.card();
    await fixture.apply(page);

    await page.goto("/");
    const actions = page.getByRole("button", { name: "Add", exact: true });
    await actions.focus();
    return { deck, card, actions };
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
  await test.step("When: Return home and open the deck card list", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();
  });
  await test.step("Then: The deck route shows its card", async () => {
    await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
    await expect(page.getByText(card.frontText)).toBeVisible();
  });
  const { specialDecks, specialCards, before } =
    await test.step("Given: Additional decks with reserved characters in their identifiers and saved card baselines", async () => {
      const specialDecks = fixture.state.remote.decks.filter(({ id }) => id !== deck.id);
      const specialCards = fixture.state.remote.cards.filter(({ deckId }) => deckId !== deck.id);
      const before = await Promise.all(fixture.state.remote.cards.map(({ id }) => requireDocument("card", id)));
      return { specialDecks, specialCards, before };
    });
  for (const selected of specialDecks) {
    await test.step("When: Open the selected deck through its home navigation entry", async () => {
      await page.goto("/");
      await page.getByRole("button", { name: `Open cards in ${selected.name}`, exact: true }).click();
    });
    const { destination } =
      await test.step("Then: Its identifier is encoded without URL search or fragment changes", async () => {
        const destination = new URL(page.url());
        expect(destination.pathname).toBe(`/deck/${encodeURIComponent(selected.id)}`);
        expect(destination.search).toBe("");
        expect(destination.hash).toBe("");
        return { destination };
      });
    for (const entry of ["navigation", "direct", "reload"]) {
      await test.step("When: Reenter through direct navigation or reload when requested", async () => {
        if (entry === "direct") await page.goto(destination.href);
        if (entry === "reload") await page.reload();
      });
      await test.step("Then: Only the selected deck cards appear without changing saved cards", async () => {
        await expect(page).toHaveURL(destination.href);
        for (const candidate of specialCards) {
          const button = page.getByRole("button", { name: `View ${candidate.frontText}`, exact: true });
          await expect(button).toHaveCount(Number(candidate.deckId === selected.id));
          await expect(button).toBeVisible({ visible: candidate.deckId === selected.id });
        }
        await expect(page.getByText(card.frontText, { exact: true })).toHaveCount(0);
        expect(await Promise.all(fixture.state.remote.cards.map(({ id }) => requireDocument("card", id)))).toEqual(
          before
        );
      });
    }
  }
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

// Delay only this operation's outgoing write; the SDK still owns completion and failure handling.
async function holdContinueWrite(page: Page, sessionId: string) {
  const arrived = Promise.withResolvers<void>();
  const released = Promise.withResolvers<void>();
  let held = false;
  const pattern = "**/google.firestore.v1.Firestore/Write/channel**";
  const handler = async (route: Route) => {
    const body = decodeURIComponent((route.request().postData() ?? "").replaceAll("+", "%20"));
    if (!held && body.includes(`/documents/studySession/${sessionId}`)) {
      held = true;
      arrived.resolve();
      await released.promise;
    }
    await route.fallback();
  };
  await page.route(pattern, handler);
  return {
    arrived: arrived.promise,
    release: () => released.resolve(),
    dispose: () => page.unroute(pattern, handler),
  };
}

test("DECK-LIST-14 accepts only the first Continue during a delayed save", async ({ fixture, page }) => {
  const { first, other, session, otherSession, write } =
    await test.step("Given: Two resumable Decks and a delayed save", async () => {
      await fixture.apply(page);
      await page.goto("/");
      const first = fixture.deck("deck-a");
      const other = fixture.deck("deck-b");
      const session = fixture.session("deck-a");
      const otherSession = fixture.session("deck-b");
      await expect(page.getByRole("button", { name: `Continue ${first.name}`, exact: true })).toBeEnabled();
      const write = await holdContinueWrite(page, session.sessionId);
      return { first, other, session, otherSession, write };
    });
  try {
    await test.step("When: Start Continue using the keyboard and repeat both Deck activations while it waits", async () => {
      const continueFirst = page.getByRole("button", { name: `Continue ${first.name}`, exact: true });
      await continueFirst.press("Enter");
      await write.arrived;
      await continueFirst.dispatchEvent("click");
      await page.getByRole("button", { name: `Continue ${other.name}`, exact: true }).dispatchEvent("click");
    });
    await test.step("Then: All Continue buttons are disabled while only the selected Deck shows pending feedback", async () => {
      const continueFirst = page.getByRole("button", { name: `Continue ${first.name}`, exact: true });
      await expect(continueFirst).toBeDisabled();
      await expect(continueFirst).toHaveAttribute("aria-busy", "true");
      await expect(continueFirst).toHaveAccessibleDescription("Resuming study…");
      await expect(page.getByRole("button", { name: `Continue ${other.name}`, exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: `Open cards in ${first.name}`, exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: `Open cards in ${other.name}`, exact: true })).toBeEnabled();
      await expect(page.getByRole("button", { name: "Add", exact: true })).toBeEnabled();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page).toHaveURL("/");
    });
    await test.step("When: The original save succeeds", async () => {
      write.release();
    });
    await test.step("Then: Only the originally selected Deck resumes at its saved position", async () => {
      await expect(page).toHaveURL(`/deck/${first.id}/study`);
      await expect(page.getByText(fixture.card("card-a-1").frontText, { exact: true })).toBeVisible();
      await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(session.currentIndex));
      expect(await readSession(fixture.user().uid, other.id)).toEqual(otherSession);
      await expect(page.getByRole("alert")).toHaveCount(0);
    });
  } finally {
    write.release();
    await write.dispose();
  }
});

test("DECK-LIST-15 permits explicit Continue retry after a delayed rejection", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { first, other, session, otherSession, fault, write } =
    await test.step("Given: Two resumable Decks and a delayed failing save", async () => {
      await fixture.apply(page);
      await page.goto("/");
      const first = fixture.deck("deck-a");
      const other = fixture.deck("deck-b");
      const session = fixture.session("deck-a");
      const otherSession = fixture.session("deck-b");
      await expect(page.getByRole("button", { name: `Continue ${first.name}`, exact: true })).toBeEnabled();
      const fault = await failNextFirestoreWrite(page, { collection: "studySession", id: session.sessionId });
      allowExpectedFirestoreWriteFailure(browserErrors);
      const write = await holdContinueWrite(page, session.sessionId);
      return { first, other, session, otherSession, fault, write };
    });
  try {
    await test.step("When: Repeat Continue while the first operation waits and then rejects", async () => {
      const continueFirst = page.getByRole("button", { name: `Continue ${first.name}`, exact: true });
      await continueFirst.click();
      await write.arrived;
      await continueFirst.dispatchEvent("click");
      await page.getByRole("button", { name: `Continue ${other.name}`, exact: true }).dispatchEvent("click");
    });
    await test.step("Then: Continue stays disabled until the pending operation settles", async () => {
      await expect(page.getByRole("button", { name: `Continue ${first.name}`, exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: `Continue ${other.name}`, exact: true })).toBeDisabled();
    });
    await test.step("When: The delayed rejection arrives", async () => {
      write.release();
      await fault.waitForFailure();
      await fault.dispose();
    });
    await test.step("Then: Failure leaves the list usable without starting either queued activation", async () => {
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("alert")).toHaveCount(1);
      await expect(page.getByRole("button", { name: `Continue ${first.name}`, exact: true })).toBeEnabled();
      await expect(page.getByRole("button", { name: `Continue ${other.name}`, exact: true })).toBeEnabled();
      await expect(page.getByText("Resuming study…", { exact: true })).toHaveCount(0);
      expect(await readSession(fixture.user().uid, first.id)).toEqual(session);
      expect(await readSession(fixture.user().uid, other.id)).toEqual(otherSession);
    });
    await test.step("When: Explicitly Continue the other Deck after recovery", async () => {
      await page.getByRole("button", { name: `Continue ${other.name}`, exact: true }).click();
    });
    await test.step("Then: The newly selected session resumes while the original session remains intact", async () => {
      await expect(page).toHaveURL(`/deck/${other.id}/study`);
      await expect(page.getByText(fixture.card("card-b-2").frontText, { exact: true })).toBeVisible();
      await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue(String(otherSession.currentIndex));
      expect(await readSession(fixture.user().uid, first.id)).toEqual(session);
    });
  } finally {
    write.release();
    await write.dispose();
    await fault.dispose();
  }
});
