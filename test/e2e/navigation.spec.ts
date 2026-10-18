import { type E2EFixture, expect, getDocument, listDocuments, requireDocument, test } from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";
import { createAnonymousDeck, downloadDeckCards, startAnonymousStudy } from "./utils/ui-helpers";
import type { Locator, Page } from "@playwright/test";

test("NAVIGATION-17 shows held review counts and opens existing study settings", async ({ fixture, page }) => {
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

test("NAVIGATION-18 updates the list when a review deadline arrives", async ({ fixture, page }) => {
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

const readSavedData = async (page: Page, fixture: E2EFixture) => ({
  learning: await Promise.all(
    (["studySession", "studyAnswer"] as const).map(async (collection) =>
      (await listDocuments(collection)).filter(({ fields }) => fields.uid?.stringValue === fixture.user().uid)
    )
  ),
  preferences: await page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}")),
  decks: await Promise.all(fixture.state.remote.decks.map(({ id }) => getDocument("deck", id))),
  cards: await Promise.all(fixture.state.remote.cards.map(({ id }) => getDocument("card", id))),
});

const openView = async (page: Page, deckName: string) => {
  await page.getByRole("button", { name: `Open actions for ${deckName}`, exact: true }).click();
  await page.getByRole("menuitem", { name: "View", exact: true }).click();
};

const expectFront = async (page: Page, frontText: string) => {
  await expect(page.getByRole("button", { name: "Card front", exact: true })).toContainText(frontText);
  await expect(page.getByRole("region", { name: "Card answer", exact: true })).toHaveCount(0);
};

const mouseSwipe = async (
  page: Page,
  surface: Locator,
  direction: "left" | "right" | "up" | "down",
  button: "left" | "middle" | "right" = "left"
) => {
  const bounds = await surface.boundingBox();
  if (bounds === null) throw new Error("Expected a visible Card surface");
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const dx = direction === "left" ? -bounds.width * 0.3 : direction === "right" ? bounds.width * 0.3 : 0;
  const dy = direction === "up" ? -bounds.height * 0.3 : direction === "down" ? bounds.height * 0.3 : 0;
  await page.mouse.move(center.x, center.y);
  await page.mouse.down({ button });
  await page.mouse.move(center.x + dx, center.y + dy, { steps: 5 });
  await page.mouse.up({ button });
};

const touchGesture = async (page: Page, surface: Locator, direction?: "left" | "right" | "up") => {
  const bounds = await surface.boundingBox();
  if (bounds === null) throw new Error("Expected a visible touch surface");
  const start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height * 0.7 };
  const dx = direction === "left" ? -bounds.width * 0.35 : direction === "right" ? bounds.width * 0.35 : 0;
  const dy = direction === "up" ? -bounds.height * 0.45 : 0;
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ id: 0, ...start }] });
  if (direction !== undefined) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ id: 0, x: start.x + dx, y: start.y + dy }],
    });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
};

test("NAVIGATION-08 browses remote Cards without changing learning data or preferences", async ({ fixture, page }) => {
  const { deck, first, second, third, before } =
    await test.step("Given: A remote deck with active study data and configured viewing preferences", async () => {
      const deck = fixture.deck();
      const first = fixture.card("card-1");
      const second = fixture.card("card-2");
      const third = fixture.card("card-3");
      await fixture.apply(page, {
        preferences: {
          study: { keepBackTextViewed: true, defaultAutoPlay: true, cardInterval: 1 },
          controls: { cardSwipeLeft: "RateGood", cardSwipeRight: "RateEasy" },
        },
      });
      await page.goto("/");
      await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
      const before = await readSavedData(page, fixture);
      return { deck, first, second, third, before };
    });
  await test.step("When: Choose View from the deck actions", async () => {
    await openView(page, deck.name);
  });
  const { front, answer } =
    await test.step("Then: The first card opens with browsing controls and progress", async () => {
      await expect(page).toHaveURL(`/deck/${deck.id}/view`);
      await expectFront(page, first.frontText);
      await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 3");
      await expect(page.getByRole("button", { name: "Swipe up" })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();

      const front = page.getByRole("button", { name: "Card front", exact: true });
      const answer = page.getByRole("region", { name: "Card answer", exact: true });
      return { front, answer };
    });
  await test.step("When: Try non-primary drags, vertical gestures and vertical arrow keys", async () => {
    await mouseSwipe(page, front, "right", "right");
    await mouseSwipe(page, front, "right", "middle");
    await mouseSwipe(page, front, "up");
    await mouseSwipe(page, front, "down");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowDown");
  });
  await test.step("Then: Unsupported navigation leaves the first card front unchanged", async () => {
    await expectFront(page, first.frontText);
  });
  await test.step("When: Click the first card front", async () => {
    await front.getByText(first.frontText, { exact: true }).click();
  });
  await test.step("Then: Its answer is revealed", async () => {
    await expect(answer).toContainText(first.backText);
  });
  await test.step("When: Click the first card answer", async () => {
    await answer.getByText(first.backText, { exact: true }).click();
  });
  await test.step("Then: The same card front returns", async () => {
    await expectFront(page, first.frontText);
  });
  await test.step("When: Swipe the first card front right", async () => {
    await mouseSwipe(page, front, "right");
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, second.frontText);
  });
  await test.step("When: Reveal the second answer and swipe it left", async () => {
    await front.getByText(second.frontText, { exact: true }).click();
    await mouseSwipe(page, answer, "left");
  });
  await test.step("Then: The first card front returns", async () => {
    await expectFront(page, first.frontText);
  });
  await test.step("When: Reveal the first answer and swipe it right", async () => {
    await front.getByText(first.frontText, { exact: true }).click();
    await mouseSwipe(page, answer, "right");
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, second.frontText);
  });
  await test.step("When: Swipe the second card front left", async () => {
    await mouseSwipe(page, front, "left");
  });
  await test.step("Then: The first card front returns", async () => {
    await expectFront(page, first.frontText);
  });
  await test.step("When: Press ArrowRight from the first card", async () => {
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, second.frontText);
  });
  await test.step("When: Press ArrowRight from the second card", async () => {
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: The third card front appears", async () => {
    await expectFront(page, third.frontText);
  });
  await test.step("When: Reveal the third answer and press ArrowLeft", async () => {
    await front.getByText(third.frontText, { exact: true }).click();
    await page.keyboard.press("ArrowLeft");
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, second.frontText);
  });
  await test.step("When: Choose Next card", async () => {
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  });
  await test.step("Then: The third card front appears", async () => {
    await expectFront(page, third.frontText);
  });
  await test.step("When: Choose Previous card", async () => {
    await page.getByRole("button", { name: "Previous card", exact: true }).click();
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, second.frontText);
  });
  await test.step("When: Reveal the second answer and press ArrowRight", async () => {
    await front.getByText(second.frontText, { exact: true }).click();
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: The third card front appears", async () => {
    await expectFront(page, third.frontText);
  });
  await test.step("When: Navigate forward past the final card", async () => {
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: Viewing returns to the deck list", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("When: Reopen View mode", async () => {
    await openView(page, deck.name);
  });
  await test.step("Then: Viewing restarts at the first card", async () => {
    await expectFront(page, first.frontText);
  });
  await test.step("When: Navigate backward before the first card", async () => {
    await page.keyboard.press("ArrowLeft");
  });
  await test.step("Then: Viewing exits without changing saved learning data or preferences", async () => {
    await expect(page).toHaveURL(/\/$/);
    expect(await readSavedData(page, fixture)).toEqual(before);
  });
});

test("NAVIGATION-09 resets local-only viewing position on reload and reentry without saving", async ({
  fixture,
  page,
}) => {
  const { local, deck, studyFront, before, first, second } =
    await test.step("Given: An anonymous deck with an active study session and View mode open", async () => {
      await fixture.apply(page);
      const local = await createAnonymousDeck(page);
      const { deck } = local;
      const studyFront = await startAnonymousStudy(page, deck.id);

      await page.goto("/");
      await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
      const before = await readSavedData(page, fixture);
      await openView(page, deck.name);
      const viewFront = await page.getByRole("button", { name: "Card front", exact: true }).innerText();
      expect(local.cards.map((card) => card.frontText)).toContain(viewFront);
      const [first, second] =
        viewFront === local.first.frontText ? [local.first, local.second] : [local.second, local.first];
      return { local, deck, studyFront, before, first, second };
    });
  await test.step("When: Reveal the first card answer", async () => {
    await page.getByText(first.frontText, { exact: true }).click();
  });
  await test.step("Then: The first answer is shown", async () => {
    await expect(page.getByRole("region", { name: "Card answer", exact: true })).toContainText(first.backText);
  });
  await test.step("When: Navigate to the next card", async () => {
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, second.frontText);
  });
  await test.step("When: Reveal the second card answer", async () => {
    await page.getByText(second.frontText, { exact: true }).click();
  });
  await test.step("Then: The second answer is shown", async () => {
    await expect(page.getByRole("region", { name: "Card answer", exact: true })).toContainText(second.backText);
  });
  await test.step("When: Reload View mode", async () => {
    await page.reload();
  });
  await test.step("Then: Viewing resets to the first card front", async () => {
    await expectFront(page, first.frontText);
  });
  await test.step("When: Choose Next card", async () => {
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, second.frontText);
  });
  await test.step("When: Return to the deck list", async () => {
    await page.getByRole("button", { name: "Back to deck list", exact: true }).first().click();
  });
  await test.step("Then: The deck list opens", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("When: Reenter View mode", async () => {
    await openView(page, deck.name);
  });
  await test.step("Then: Viewing restarts at the first card", async () => {
    await expectFront(page, first.frontText);
  });
  await test.step("When: Navigate backward before the first card", async () => {
    await page.getByRole("button", { name: "Previous card", exact: true }).click();
  });
  await test.step("Then: Viewing exits to the deck list", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("When: Reenter View mode and advance once", async () => {
    await openView(page, deck.name);
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, second.frontText);
  });
  await test.step("When: Advance past the final card", async () => {
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  });
  await test.step("Then: Viewing exits without changing saved data", async () => {
    await expect(page).toHaveURL(/\/$/);
    expect(await readSavedData(page, fixture)).toEqual(before);
  });
  await test.step("When: Continue the original study session", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  });
  await test.step("Then: Study position and every saved card field remain unchanged", async () => {
    await expect(page.getByText(studyFront, { exact: true })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("0");
    expect(
      (await downloadDeckCards(page, deck.name)).sort((a, b) => String(a.uniqueKey).localeCompare(String(b.uniqueKey)))
    ).toEqual(
      local.cards
        .toSorted((a, b) => a.id.localeCompare(b.id))
        .map(({ id, frontText, backText }) => ({ frontText, backText, tags: [], uniqueKey: id }))
    );
  });
});

test("NAVIGATION-10 views all cards in standard order independently of study conditions", async ({ fixture, page }) => {
  const { deck, matching, before } =
    await test.step("Given: A deck with saved study conditions and shuffled study enabled", async () => {
      const deck = fixture.deck();
      const matching = ["card-1", "card-2", "card-3", "card-4", "card-5"].map((id) => fixture.card(id));
      await fixture.apply(page, { preferences: { study: { shuffled: true } } });
      await page.goto("/");
      await expect(page.getByRole("button", { name: `Study ${deck.name}`, exact: true })).toBeVisible();
      const before = await readSavedData(page, fixture);
      return { deck, matching, before };
    });
  await test.step("When: Open the deck in View mode", async () => {
    await openView(page, deck.name);
  });
  for (const [index, card] of matching.entries()) {
    await test.step("Then: The next card and progress follow standard browsing order", async () => {
      await expectFront(page, card.frontText);
      await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", `${String(index + 1)} of 5`);
    });
    await test.step("When: Advance to the next browsing card", async () => {
      await page.getByRole("button", { name: "Next card", exact: true }).click();
    });
  }
  await test.step("Then: Browsing exits after every card without changing saved data", async () => {
    await expect(page).toHaveURL(/\/$/);
    expect(await readSavedData(page, fixture)).toEqual(before);
  });
});

test("NAVIGATION-11 includes future reviews in read-only viewing", async ({ fixture, page }) => {
  const { unscheduled, future, before } =
    await test.step("Given: View mode starts with a due card in a review-scheduled deck", async () => {
      const deck = fixture.deck();
      const due = fixture.card("card-due");
      const unscheduled = fixture.card("card-unscheduled");
      const future = fixture.card("card-future");
      await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
      await page.goto("/");
      await expect(page.getByRole("button", { name: `Open actions for ${deck.name}`, exact: true })).toBeVisible();
      const before = await readSavedData(page, fixture);
      await openView(page, deck.name);
      await expectFront(page, due.frontText);
      await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 3");
      return { unscheduled, future, before };
    });
  await test.step("When: Advance to the future review card", async () => {
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  });
  await test.step("Then: Future reviews remain available for browsing", async () => {
    await expectFront(page, future.frontText);
  });
  await test.step("When: Reveal the future card answer", async () => {
    await page.getByRole("button", { name: "Card front" }).click();
  });
  await test.step("Then: Its saved back text is shown", async () => {
    await expect(page.getByRole("region", { name: "Card answer" })).toContainText(future.backText);
  });
  await test.step("When: Close the answer and advance to the unscheduled card", async () => {
    await page.getByRole("region", { name: "Card answer" }).click();
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  });
  await test.step("Then: The unscheduled card front appears", async () => {
    await expectFront(page, unscheduled.frontText);
  });
  await test.step("When: Advance beyond the final card", async () => {
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  });
  await test.step("Then: Viewing exits without changing saved data", async () => {
    await expect(page).toHaveURL(/\/$/);
    expect(await readSavedData(page, fixture)).toEqual(before);
  });
});

test("NAVIGATION-12 recovers from empty and missing Deck views without saving", async ({
  fixture,
  page,
  namespace,
}) => {
  const { before } = await test.step("Given: An empty deck view with no browsing controls", async () => {
    const deck = fixture.deck();
    await fixture.apply(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: `Open actions for ${deck.name}`, exact: true })).toBeVisible();
    const before = await readSavedData(page, fixture);
    await openView(page, deck.name);
    await expect(page.getByText("No cards yet", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
    return { before };
  });
  await test.step("When: Return from the empty deck view", async () => {
    await page.getByRole("button", { name: "Back to deck list", exact: true }).first().click();
  });
  await test.step("Then: The deck list opens", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("When: Open a missing deck view route", async () => {
    await page.goto(`/deck/${namespace.id("missing")}/view`);
  });
  await test.step("Then: Missing-deck guidance replaces browsing controls", async () => {
    await expect(page.getByRole("heading", { name: "Deck not found", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
  });
  await test.step("When: Choose Go home", async () => {
    await page.getByRole("button", { name: "Go home", exact: true }).click();
  });
  await test.step("Then: Home opens without saving any data", async () => {
    await expect(page).toHaveURL(/\/$/);
    expect(await readSavedData(page, fixture)).toEqual(before);
  });
});

test("NAVIGATION-13 scrolls one long answer with touch and exits at either horizontal boundary", async ({
  fixture,
  page,
}) => {
  const { deck, card, before } = await test.step("Given: A single-card deck in a narrow viewport", async () => {
    const deck = fixture.deck();
    const card = fixture.card("card-1");

    await page.setViewportSize({ width: 320, height: 568 });
    await fixture.apply(page);
    await page.goto("/");
    const before = await readSavedData(page, fixture);
    return { deck, card, before };
  });
  await test.step("When: Open View mode", async () => {
    await openView(page, deck.name);
  });
  await test.step("Then: The card front and one-card progress are shown", async () => {
    await expectFront(page, card.frontText);
    await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
  });
  await test.step("When: Tap the card front", async () => {
    await touchGesture(page, page.getByRole("button", { name: "Card front", exact: true }));
  });
  const { answer, height } = await test.step("Then: Its answer overflows the visible answer region", async () => {
    const answer = page.getByRole("region", { name: "Card answer", exact: true });
    await expect(answer).toBeVisible();
    const height = await answer.evaluate((element) => ({ client: element.clientHeight, scroll: element.scrollHeight }));
    expect(height.scroll).toBeGreaterThan(height.client);
    return { answer, height };
  });
  await test.step("When: Scroll the answer with the mouse wheel", async () => {
    await answer.hover();
    await page.mouse.wheel(0, height.client);
  });
  await test.step("Then: The answer scroll position increases", async () => {
    await expect.poll(() => answer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  });
  await test.step("When: Reset scrolling and drag the answer upward by touch", async () => {
    await answer.evaluate((element) => {
      element.scrollTop = 0;
    });
    await touchGesture(page, answer, "up");
  });
  await test.step("Then: Touch scrolling reaches the long answer content", async () => {
    await expect.poll(() => answer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(answer).toContainText(card.backText.split("\n").at(-1) ?? card.backText);
  });
  await test.step("When: Swipe left past the beginning of the single-card deck", async () => {
    await touchGesture(page, answer, "left");
  });
  await test.step("Then: Viewing exits to the deck list", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("When: Reenter View mode", async () => {
    await openView(page, deck.name);
  });
  await test.step("Then: The card front is restored", async () => {
    await expectFront(page, card.frontText);
  });
  await test.step("When: Swipe right past the end of the single-card deck", async () => {
    await touchGesture(page, page.getByRole("button", { name: "Card front", exact: true }), "right");
  });
  await test.step("Then: Viewing exits without saving data", async () => {
    await expect(page).toHaveURL(/\/$/);
    expect(await readSavedData(page, fixture)).toEqual(before);
  });
});

test("NAVIGATION-14 shares display preferences with Study and explains viewing actions", async ({ fixture, page }) => {
  const { deck, before, edit } =
    await test.step("Given: View mode exposes the first card edit link and saved display preferences", async () => {
      const deck = fixture.deck();
      await fixture.apply(page);
      await page.goto("/");
      await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
      const before = await readSavedData(page, fixture);
      await openView(page, deck.name);
      const edit = page.getByRole("link", { name: "Edit card", exact: true });
      await expect(edit).toHaveAttribute("href", `/card/${fixture.card("card-1").id}/edit`);
      await expect(edit).toHaveText("");
      await expect(edit.locator("svg")).toBeVisible();
      return { deck, before, edit };
    });
  await test.step("When: Navigate to the second card", async () => {
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: The edit link targets the current card", async () => {
    await expect(edit).toHaveAttribute("href", `/card/${fixture.card("card-2").id}/edit`);
  });
  await test.step("When: Activate that edit link with Enter", async () => {
    await edit.focus();
    await page.keyboard.press("Enter");
  });
  await test.step("Then: The selected card editor opens", async () => {
    await expect(page).toHaveURL(`/card/${fixture.card("card-2").id}/edit`);
    await expect(page.getByRole("heading", { name: "Edit card" })).toBeVisible();
  });
  await test.step("When: Navigate back to View mode", async () => {
    await page.goBack();
  });
  await test.step("Then: Viewing restarts at the first card", async () => {
    await expectFront(page, fixture.card("card-1").frontText);
  });
  await test.step("When: Reveal the card answer", async () => {
    await page.getByRole("button", { name: "Card front", exact: true }).click();
  });
  await test.step("Then: The edit link is hidden while the answer is open", async () => {
    await expect(edit).toHaveCount(0);
  });
  await test.step("When: Close the answer and open Viewing Help", async () => {
    await page.getByRole("region", { name: "Card answer", exact: true }).click();
    await page.getByRole("button", { name: "Open viewing help" }).click();
  });
  await test.step("Then: Help describes previous-card navigation and unsupported actions", async () => {
    const dialog = page.getByRole("dialog", { name: "Viewing controls" });
    await expect(dialog).toContainText("Go to the previous card");
    await expect(dialog.getByText("No action", { exact: true })).toHaveCount(2);
  });
  await test.step("When: Try navigation inside help and dismiss it with Escape", async () => {
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");
  });
  await test.step("Then: Viewing stays on the same card and help-trigger focus returns", async () => {
    await expect(page.getByRole("button", { name: "Open viewing help" })).toBeFocused();
    await expectFront(page, fixture.card("card-1").frontText);
  });
  await test.step("When: Open card display actions", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
  });
  for (const name of ["Card details", "Swipe controls", "Playback controls", "Help button", "Edit link"]) {
    await test.step("When: Disable the current display control", async () => {
      await page.getByRole("button", { name, exact: true }).click();
    });
    await test.step("Then: The current display control reports its disabled state", async () => {
      await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "false");
    });
  }
  await test.step("When: Close card display actions", async () => {
    await page.getByRole("button", { name: "Close card actions" }).click();
  });
  await test.step("Then: The edit link is hidden", async () => {
    await expect(edit).toHaveCount(0);
  });
  await test.step("When: Reload View mode", async () => {
    await page.reload();
  });
  await test.step("Then: Hidden controls persist without changing learning data", async () => {
    await expectFront(page, fixture.card("card-1").frontText);
    await expect(page.getByRole("button", { name: "Open viewing help" })).toHaveCount(0);
    await expect(page.getByRole("slider")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Next card" })).toHaveCount(0);
    await expect(edit).toHaveCount(0);
    const after = await readSavedData(page, fixture);
    expect({ ...after, preferences: before.preferences }).toEqual(before);
    expect(after.preferences).toEqual({
      ...before.preferences,
      state: {
        ...before.preferences.state,
        preferences: {
          ...before.preferences.state.preferences,
          controls: {
            ...before.preferences.state.preferences.controls,
            showHelp: false,
            showEditLink: false,
            showCardDetails: false,
            showSwipeButtonList: false,
            showPlaybackControls: false,
          },
        },
      },
    });
  });
  await test.step("When: Reenable the View mode edit link", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
    await page.getByRole("button", { name: "Edit link", exact: true }).click();
    await page.getByRole("button", { name: "Close card actions" }).click();
  });
  await test.step("Then: The edit link becomes visible", async () => {
    await expect(edit).toBeVisible();
  });
  await test.step("When: Leave View mode and continue Study", async () => {
    await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
    await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  });
  await test.step("Then: Study shares the hidden-help preference", async () => {
    await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
  });
  await test.step("When: Open Study display actions", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
  });
  await test.step("Then: Shared controls stay disabled while the View-only edit link is absent", async () => {
    await expect(page.getByRole("button", { name: "Edit link", exact: true })).toHaveCount(0);
    for (const name of ["Card details", "Swipe controls", "Playback controls", "Help button"]) {
      await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "false");
    }
  });
});

test("NAVIGATION-15 starts viewing stopped and autoplays without persisting learning data", async ({
  fixture,
  page,
}) => {
  const { deck, before } =
    await test.step("Given: View mode starts stopped despite enabled autoplay preferences", async () => {
      const deck = fixture.deck();
      await fixture.apply(page, { preferences: { study: { defaultAutoPlay: true, cardInterval: 1 } } });
      await page.goto("/");
      await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
      const before = await readSavedData(page, fixture);
      await page.clock.install({ time: new Date() });
      await openView(page, deck.name);
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
      await page.clock.runFor(2000);
      await expectFront(page, fixture.card("card-1").frontText);
      return { deck, before };
    });
  await test.step("When: Start autoplay and keep Viewing Help open across intervals", async () => {
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.getByRole("button", { name: "Open viewing help" }).click();
    await page.clock.runFor(2000);
    await page.getByRole("button", { name: "Close help" }).click();
  });
  await test.step("Then: Help prevents browsing from advancing", async () => {
    await expectFront(page, fixture.card("card-1").frontText);
  });
  await test.step("When: Let one autoplay interval pass after help closes", async () => {
    await page.clock.runFor(1000);
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, fixture.card("card-2").frontText);
  });
  await test.step("When: Pause autoplay and let further intervals pass", async () => {
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page.clock.runFor(2000);
  });
  await test.step("Then: Viewing stays on the second card", async () => {
    await expectFront(page, fixture.card("card-2").frontText);
  });
  await test.step("When: Resume autoplay for one interval", async () => {
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.clock.runFor(1000);
  });
  await test.step("Then: The third card front appears", async () => {
    await expectFront(page, fixture.card("card-3").frontText);
  });
  await test.step("When: Let another interval pass beyond the last card", async () => {
    await page.clock.runFor(1000);
  });
  await test.step("Then: Viewing exits to the deck list", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("When: Reopen View mode and let time pass", async () => {
    await openView(page, deck.name);
    await page.clock.runFor(2000);
  });
  await test.step("Then: Viewing starts stopped at the first card without saving data", async () => {
    await expectFront(page, fixture.card("card-1").frontText);
    expect(await readSavedData(page, fixture)).toEqual(before);
  });
});

test("NAVIGATION-16 browses forward and backward with the progress slider without saving", async ({
  fixture,
  page,
}) => {
  const { local, deck, studyFront, before, first, second, slider } =
    await test.step("Given: An anonymous deck with Study and View mode at their initial positions", async () => {
      await fixture.apply(page);
      const local = await createAnonymousDeck(page);
      const { deck } = local;
      const studyFront = await startAnonymousStudy(page, deck.id);

      await page.goto("/");
      await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
      const before = await readSavedData(page, fixture);
      await openView(page, deck.name);
      const viewFront = await page.getByRole("button", { name: "Card front", exact: true }).innerText();
      expect(local.cards.map((card) => card.frontText)).toContain(viewFront);
      const [first, second] =
        viewFront === local.first.frontText ? [local.first, local.second] : [local.second, local.first];
      const slider = page.getByRole("slider", { name: "Viewing progress" });
      await slider.focus();
      return { local, deck, studyFront, before, first, second, slider };
    });
  await test.step("When: Move the viewing slider to End", async () => {
    await page.keyboard.press("End");
  });
  await test.step("Then: The last card and its progress are shown", async () => {
    await expectFront(page, second.frontText);
    await expect(slider).toHaveAttribute("aria-valuetext", "2 of 2");
  });
  await test.step("When: Move the viewing slider left", async () => {
    await page.keyboard.press("ArrowLeft");
  });
  await test.step("Then: The first card and its progress return", async () => {
    await expectFront(page, first.frontText);
    await expect(slider).toHaveAttribute("aria-valuetext", "1 of 2");
  });
  await test.step("When: Reveal the card answer", async () => {
    await page.getByRole("button", { name: "Card front", exact: true }).click();
  });
  await test.step("Then: Answer reading hides the progress and back controls", async () => {
    await expect(page.getByRole("region", { name: "Card answer" })).toBeVisible();
    await expect(slider).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Back to deck list", exact: true })).toHaveCount(0);
  });
  await test.step("When: Navigate right from the answer", async () => {
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: The second card front appears", async () => {
    await expectFront(page, second.frontText);
  });
  await test.step("When: Return home and reopen View mode", async () => {
    await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
    await openView(page, deck.name);
  });
  await test.step("Then: Viewing resets without changing saved data", async () => {
    await expectFront(page, first.frontText);
    expect(await readSavedData(page, fixture)).toEqual(before);
  });
  await test.step("When: Continue the original study session", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  });
  await test.step("Then: Study position and all card fields are unchanged", async () => {
    await expect(page.getByText(studyFront, { exact: true })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("0");
    expect(
      (await downloadDeckCards(page, deck.name)).sort((a, b) => String(a.uniqueKey).localeCompare(String(b.uniqueKey)))
    ).toEqual(
      local.cards
        .toSorted((a, b) => a.id.localeCompare(b.id))
        .map(({ id, frontText, backText }) => ({ frontText, backText, tags: [], uniqueKey: id }))
    );
  });
});

test("NAVIGATION-06 navigates from the Deck list to its Card list", async ({ fixture, page }) => {
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

test("NAVIGATION-07 recovers home from a missing Deck route", async ({ fixture, page, namespace }) => {
  await test.step("Given: A missing deck route with home recovery", async () => {
    await fixture.apply(page);

    await page.goto(`/deck/${namespace.id("missing")}`);
    await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  });
  await test.step("When: Choose Go home", async () => {
    await page.getByRole("button", { name: "Go home" }).click();
  });
  await test.step("Then: The deck list opens", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  });
});

async function failNextThemeUpdate(page: Page): Promise<void> {
  await page.evaluate(() => {
    const toggle = DOMTokenList.prototype.toggle;
    DOMTokenList.prototype.toggle = function (token, force) {
      if (this === document.documentElement.classList && token === "dark") {
        DOMTokenList.prototype.toggle = toggle;
        throw new Error("E2E_RENDER_FAILURE");
      }
      return force === undefined ? toggle.call(this, token) : toggle.call(this, token, force);
    };
  });
}

test("NAVIGATION-01 An unknown route recovers to the Deck list", async ({ fixture, page, namespace }) => {
  const { notFound } = await test.step("Given: An unknown route with Page not found guidance", async () => {
    await fixture.apply(page);

    await page.goto(`/${namespace.id("not-a-route")}`);
    const notFound = page.getByRole("heading", { level: 1, name: "Page not found" });
    await expect(notFound).toBeVisible();
    return { notFound };
  });
  await test.step("When: Choose Go home", async () => {
    await page.getByRole("button", { name: "Go home" }).click();
  });
  await test.step("Then: The deck list replaces the unknown-route screen", async () => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    await expect(notFound).toHaveCount(0);
  });
});

test("NAVIGATION-02 Screen shortcuts navigate to their configured routes", async ({ fixture, page }) => {
  const { deck, card, deckBefore, cardBefore } =
    await test.step("Given: A deck list with saved deck and card baselines", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      await fixture.apply(page);
      const deckBefore = await requireDocument("deck", deck.id);
      const cardBefore = await requireDocument("card", card.id);

      await page.goto("/");
      await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
      return { deck, card, deckBefore, cardBefore };
    });
  await test.step("When: Press the configured settings shortcut", async () => {
    await page.keyboard.press("s");
  });
  await test.step("Then: Settings opens", async () => {
    await expect(page).toHaveURL(/\/settings$/);
  });
  await test.step("Given: The deck list is open for the import shortcut", async () => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  });
  await test.step("When: Press the configured import shortcut", async () => {
    await page.keyboard.press("i");
  });
  await test.step("Then: Import opens", async () => {
    await expect(page).toHaveURL(/\/import$/);
  });
  await test.step("Given: The deck card list is open for the home shortcut", async () => {
    await page.goto(`/deck/${deck.id}`);
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  });
  await test.step("When: Press the configured home shortcut", async () => {
    await page.keyboard.press("t");
  });
  await test.step("Then: The deck list opens", async () => {
    await expect(page).toHaveURL(/\/$/);
  });
  await test.step("Given: The deck card list is open for the settings shortcut", async () => {
    await page.goto(`/deck/${deck.id}`);
    await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  });
  await test.step("When: Press the configured settings shortcut from the card list", async () => {
    await page.keyboard.press("s");
  });
  await test.step("Then: Settings opens without changing the saved deck or card", async () => {
    await expect(page).toHaveURL(/\/settings$/);

    expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
    expect(await requireDocument("card", card.id)).toEqual(cardBefore);
  });
});

test("NAVIGATION-03 Generic recovery offers only reload and preserves anonymous data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { deck, first, uid } =
    await test.step("Given: An anonymous account with saved cards and recovery URL context", async () => {
      await fixture.apply(page, { auth: false, preferences: false });
      const { deck, first } = await createAnonymousDeck(page);
      await page.goto("/account");
      const uid = await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").innerText();
      await page.goto("/settings?recovery=reload#preserved");
      return { deck, first, uid };
    });
  await test.step("When: Trigger a render failure after selecting Japanese", async () => {
    await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
    await page.evaluate(() => {
      localStorage.setItem("recovery-marker", "keep");
      sessionStorage.setItem("recovery-marker", "keep");
    });
    browserErrors.allow(/E2E_RENDER_FAILURE/);
    await failNextThemeUpdate(page);
    await page.getByRole("checkbox", { name: "ダークモード" }).locator("xpath=parent::label").click();
  });
  await test.step("Then: Localized recovery offers reload and explains anonymous-data risk", async () => {
    await expect(page.getByRole("heading", { name: "問題が発生しました" })).toBeVisible();
    await expect(page.getByText(/再読み込みしてお試しください/)).toBeVisible();
    await expect(page.getByText(/匿名データは復元できません/)).toBeVisible();
    await expect(page.getByRole("button", { name: /ローカルデータを削除|Clear local data/ })).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });
  const { preferences } = await test.step("Given: Saved preferences are recorded before recovery reload", async () => {
    const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
    return { preferences };
  });
  await test.step("When: Choose Reload on the recovery screen", async () => {
    await page.getByRole("button", { name: "再読み込み", exact: true }).click();
  });
  await test.step("Then: Settings and both storage markers survive with the same URL", async () => {
    await expect(page).toHaveURL(/\/settings\?recovery=reload#preserved$/);
    await expect(page.getByRole("heading", { name: "設定", exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    expect(await page.evaluate(() => localStorage.getItem("recovery-marker"))).toBe("keep");
    expect(await page.evaluate(() => sessionStorage.getItem("recovery-marker"))).toBe("keep");
  });
  await test.step("When: Open the account screen", async () => {
    await page.goto("/account");
  });
  await test.step("Then: The same anonymous identity remains", async () => {
    await expect(page.getByText(uid, { exact: true })).toBeVisible();
  });
  await test.step("When: Open the anonymous deck", async () => {
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: Its saved card remains available", async () => {
    await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
  });
});

test("NAVIGATION-04 Unhandled browser errors share recovery without clearing data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  await test.step("Given: A browser configured for the expected unhandled error variants", async () => {
    await fixture.apply(page);
    browserErrors.allow(/E2E_UNHANDLED_FAILURE|(?:page error: )?(?:null|undefined)/);
  });
  for (const failure of ["timer", "promise", "string", "null", "undefined"] as const) {
    const { preferences } =
      await test.step("Given: Settings and saved preferences are loaded for this error variant", async () => {
        await page.goto("/settings");
        await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
        const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
        return { preferences };
      });
    await test.step("When: Trigger the current unhandled browser error", async () => {
      await page.evaluate((kind) => {
        if (kind === "timer") {
          setTimeout(() => {
            throw new Error("E2E_UNHANDLED_FAILURE");
          }, 0);
        } else {
          const reasons = {
            promise: new Error("E2E_UNHANDLED_FAILURE"),
            string: "E2E_UNHANDLED_FAILURE",
            null: null,
            undefined,
          };
          const reason = reasons[kind];
          void Promise.reject(reason);
        }
      }, failure);
    });
    await test.step("Then: Recovery appears without offering data deletion or changing preferences", async () => {
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page.getByRole("button", { name: "Clear local data and reload" })).toHaveCount(0);
      expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    });
    await test.step("When: Choose Reload on the recovery screen", async () => {
      await page.getByRole("button", { name: "Reload", exact: true }).click();
    });
    await test.step("Then: Settings recovers", async () => {
      await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    });
  }
  await test.step("When: Dispatch an empty error event and a handled rejection", async () => {
    await page.evaluate(async () => {
      window.dispatchEvent(new Event("error"));
      await Promise.reject(new Error("handled")).catch(() => undefined);
    });
  });
  await test.step("Then: Settings remains usable without recovery", async () => {
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  });
});

test("NAVIGATION-05 Corrupt PWA cache shows manual recovery guidance without deleting data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { deck, card, deckBefore, cardBefore, preferences, assetPath, cachedResponse } =
    await test.step("Given: A remote deck with saved data and a corrupted cached startup asset", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
      await fixture.apply(page);
      const deckBefore = await requireDocument("deck", deck.id);
      const cardBefore = await requireDocument("card", card.id);
      await page.goto("/");
      await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
      const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));

      const assetPath = await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
        const scope = `${window.location.origin}/`;
        const name = (await caches.keys()).find((key) => key.startsWith("workbox-precache-") && key.endsWith(scope));
        if (!name) throw new Error("Expected Tango's precache");
        const cache = await caches.open(name);
        for (const request of await cache.keys()) {
          if (!new URL(request.url).pathname.endsWith(".js")) continue;
          const response = await cache.match(request);
          if (!response) continue;
          const source = await response.text();
          // Keep React and recovery usable while corrupting a startup effect in the actual cached application.
          const corrupted = source.replace(
            /\.classList\.toggle\((["'`])dark\1\s*,/,
            '.classList.toggle("E2E INVALID CACHE TOKEN",'
          );
          if (corrupted === source) continue;
          await cache.put(request, new Response(corrupted, { headers: response.headers }));
          return new URL(request.url).pathname;
        }
        throw new Error("Could not find the cached startup class token");
      });
      browserErrors.allow(/E2E INVALID CACHE TOKEN/);

      const cachedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === assetPath);
      return { deck, card, deckBefore, cardBefore, preferences, assetPath, cachedResponse };
    });
  await test.step("When: Reload the corrupted application from its service worker", async () => {
    await page.reload();
  });
  await test.step("Then: Startup recovery replaces the deck list", async () => {
    expect((await cachedResponse).fromServiceWorker()).toBe(true);
    await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toHaveCount(0);
  });
  await test.step("When: Choose Reload while the corrupt cached asset remains", async () => {
    await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: "Reload", exact: true }).click()]);
  });
  await test.step("Then: Manual recovery guidance preserves cached assets and saved user data", async () => {
    await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toBeVisible();
    await expect(page.getByText(/delete Tango's site data in your browser's site settings/)).toBeVisible();
    await expect(page.getByText(/Anonymous data cannot be recovered/)).toBeVisible();
    await expect(page.getByRole("button", { name: /ローカルデータを削除|Clear local data/ })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    expect(
      await page.evaluate(async (path) => {
        const response = await caches.match(path, { ignoreSearch: true });
        return (await response?.text())?.includes("E2E INVALID CACHE TOKEN") ?? false;
      }, assetPath)
    ).toBe(true);
    expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
    expect(await requireDocument("card", card.id)).toEqual(cardBefore);
  });
});

test("NAVIGATION-22 Clears anonymous local data after storage initialization fails", async ({ fixture, page }) => {
  const { deck, uid } =
    await test.step("Given: An anonymous account with saved study data and recovery URL context", async () => {
      await fixture.apply(page, { auth: false, preferences: false });
      await page.clock.setFixedTime(new Date("2026-01-02T03:04:05Z"));
      const { deck } = await createAnonymousDeck(page);
      await startAnonymousStudy(page, deck.id);
      await page.goto("/account");
      const uid = await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").innerText();
      await page.goto("/settings?recovery=local#preserved");
      return { deck, uid };
    });
  const { originalUrl, worker } =
    await test.step("When: Select Japanese, prepare storage markers and trigger a storage initialization failure", async () => {
      await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
      await page.evaluate(async () => {
        localStorage.setItem("recovery-marker", "keep");
        sessionStorage.setItem("recovery-marker", "keep");
        for (const name of ["tango-card-replica", "recovery-other-database"]) {
          await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(name);
            request.onupgradeneeded = () => request.result.createObjectStore("recovery-marker");
            request.onsuccess = () => {
              request.result.close();
              resolve();
            };
            request.onerror = () => reject(request.error);
          });
        }
        sessionStorage.setItem("fail-storage-read", "true");
        await navigator.serviceWorker.ready;
        await (await caches.open("recovery-marker")).put("/recovery-marker", new Response("keep"));
      });
      await page.addInitScript(() => {
        // Fail conversion of the dates created through the UI, without accessing SDK storage or records.
        const getTime = Date.prototype.getTime;
        Date.prototype.getTime = function () {
          const value = getTime.call(this);
          if (sessionStorage.getItem("fail-storage-read") && value === Date.parse("2026-01-02T03:04:05Z")) {
            throw new Error("E2E_SAVED_DATE_FAILURE");
          }
          return value;
        };
      });
      const originalUrl = page.url();
      const worker = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL);
      await page.reload();
      return { originalUrl, worker };
    });
  await test.step("Then: Localized recovery offers local-data clearing", async () => {
    await expect(page.getByRole("button", { name: "ローカルデータを削除して再読み込み" })).toBeVisible();
  });
  await test.step("When: Remove the injected storage fault", async () => {
    await page.evaluate(() => sessionStorage.removeItem("fail-storage-read"));
  });
  await test.step("Then: Anonymous-data loss guidance remains visible", async () => {
    await expect(page.getByText(/匿名データは復元できません/)).toBeVisible();
  });
  await test.step("When: Choose Clear local data and reload", async () => {
    await page.getByRole("button", { name: "ローカルデータを削除して再読み込み" }).click();
  });
  await test.step("Then: Storage and preferences reset while URL, service worker and cached assets remain", async () => {
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page).toHaveURL(originalUrl);
    await expect(page.getByRole("combobox", { name: "Language" })).not.toHaveValue("ja");
    expect(await page.evaluate(async () => (await indexedDB.databases()).map(({ name }) => name))).not.toContain(
      "tango-card-replica"
    );
    expect(await page.evaluate(async () => (await indexedDB.databases()).map(({ name }) => name))).not.toContain(
      "recovery-other-database"
    );
    expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL)).toBe(worker);
    expect(await page.evaluate(() => localStorage.getItem("recovery-marker"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
    expect(await page.evaluate(async () => (await caches.match("/recovery-marker"))?.text())).toBe("keep");
  });
  await test.step("When: Open the account screen after recovery", async () => {
    await page.goto("/account");
  });
  await test.step("Then: A new anonymous identity replaces the previous account", async () => {
    await expect(page.getByText(uid, { exact: true })).toHaveCount(0);
    const newUid = page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd");
    await expect(newUid).toHaveText(/\S+/);
    await expect(newUid).not.toHaveText(uid);
  });
  await test.step("When: Return to the deck list", async () => {
    await page.goto("/");
  });
  await test.step("Then: The previous local deck is absent", async () => {
    await expect(page.getByRole("article", { name: deck.name, exact: true })).toHaveCount(0);
  });
  await test.step("When: Reload the recovered deck list", async () => {
    await page.reload();
  });
  await test.step("Then: The fresh deck list remains usable without the old data", async () => {
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
    await expect(page.getByRole("article", { name: deck.name, exact: true })).toHaveCount(0);
  });
});

const enterViewMode = async (page: Page) => {
  await page.getByRole("button", { name: "View mode", exact: true }).click();
};

const readViewMode = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.controls?.viewMode);

const touchScroll = async (page: Page, surface: Locator) => {
  const box = await surface.boundingBox();
  if (box === null) throw new Error("Missing reading surface");
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  const x = box.x + box.width / 2;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 0, x, y: box.y + box.height * 0.8 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 0, x, y: box.y + box.height * 0.2 }],
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
};

const readLongFront = async (page: Page) => {
  const surface = page.getByRole("region", { name: "Card front text" });
  await expect(surface).toBeVisible();
  const box = await surface.boundingBox();
  if (box === null) throw new Error("Missing reading surface");
  await surface.hover();
  await page.mouse.wheel(0, box.height);
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await surface.focus();
  for (const key of ["ArrowDown", "Space", "PageDown"]) {
    await surface.press("Home");
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
    await surface.press(key);
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  }
  await surface.press("Home");
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
  await touchScroll(page, surface);
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  for (const key of ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Space", "PageDown", "PageUp"]) {
    await surface.focus();
    await page.keyboard.press(key);
  }
  for (const [dx, dy] of [
    [-80, 0],
    [80, 0],
    [0, -60],
    [0, 60],
  ]) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + (dx ?? 0), y + (dy ?? 0), { steps: 5 });
    await page.mouse.up();
    await expect(surface).toBeVisible();
  }
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await surface.focus();
  await surface.press("End");
  await expect
    .poll(() => surface.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1))
    .toBe(true);
  await expect.poll(() => readViewMode(page)).toBe(true);
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await surface.press("Home");
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
};

const verifyStudyViewModeControls = async (page: Page, uid: string, deckId: string) => {
  expect((await readSession(uid, deckId))?.currentIndex).toBe(0);
  const viewModeButton = page.getByRole("button", { name: "View mode", exact: true });
  await page.getByRole("button", { name: "Open card actions" }).click();
  await viewModeButton.click();
  await expect(viewModeButton).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => readViewMode(page)).toBe(true);
  await page.getByRole("button", { name: "Close card actions" }).click();
  await expect(viewModeButton).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "Open card actions" })).toBeVisible();
  await expect(viewModeButton).toHaveCount(0);
  await page.goto(`/deck/${deckId}/view`);
  await expect(page.getByRole("button", { name: "Open card actions" })).toBeVisible();
  await expect(viewModeButton).toHaveCount(0);
  await page.getByRole("button", { name: "Open card actions" }).click();
  await viewModeButton.click();
  await page.getByRole("button", { name: "Close card actions" }).click();
  await expect(viewModeButton).toHaveAttribute("title", "Exit view mode");
  await page.goto(`/deck/${deckId}/study`);
  await expect(viewModeButton).toBeVisible();

  await page.getByRole("button", { name: "Open study help" }).click();
  await expect(page.getByRole("dialog")).toContainText("Exit view mode and keep the front visible");
  await expect(page.getByRole("dialog")).toContainText("Space scrolls the front text");
  expect((await readSession(uid, deckId))?.currentIndex).toBe(0);
};

test.describe("View mode", () => {
  const scenario = { id: "NAVIGATION-19", route: "view" };
  test("NAVIGATION-19 scrolls the entire front without gesture actions or accidental exit", async ({
    fixture,
    page,
  }) => {
    const { deck, card, before } =
      await test.step("Given: A long card front open in reading mode on a narrow viewport", async () => {
        const deck = fixture.deck();
        const card = fixture.card("card-1");

        await page.setViewportSize({ width: 320, height: 568 });
        await fixture.apply(page);
        await page.goto(`/deck/${deck.id}/${scenario.route}`);
        const before = await readProgress(card.id);
        await enterViewMode(page);
        return { deck, card, before };
      });
    await test.step("When: Scroll and select the entire front with wheel, touch and keyboard", async () => {
      await readLongFront(page);
    });
    await test.step("Then: Reading preserves the route, visible content and saved progress", async () => {
      await expect(page).toHaveURL(`/deck/${deck.id}/${scenario.route}`);
      await expect(page.getByRole("region", { name: "Card front text" })).toContainText(card.frontText);
      expect(await readProgress(card.id)).toEqual(before);
    });
    await test.step("When: Check Study controls when the scenario uses Study mode", async () => {
      if (scenario.route === "study") await verifyStudyViewModeControls(page, fixture.user().uid, deck.id);
    });
  });
});

test.describe("View mode", () => {
  const scenario = { id: "NAVIGATION-20", route: "view", answer: "Card answer" };
  test("NAVIGATION-20 exits view mode with a tap or Enter before flipping the card", async ({ fixture, page }) => {
    const { card } = await test.step("Given: A card front open in reading mode", async () => {
      const deck = fixture.deck();
      const card = fixture.card("card-1");
      await fixture.apply(page);
      await page.goto(`/deck/${deck.id}/${scenario.route}`);
      await enterViewMode(page);
      return { card };
    });
    await test.step("When: Tap the readable card front", async () => {
      await page.getByRole("region", { name: "Card front text" }).getByText(card.frontText, { exact: true }).click();
    });
    await test.step("Then: Reading mode exits without revealing the answer", async () => {
      await expect.poll(() => readViewMode(page)).toBe(false);
      await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    });
    await test.step("When: Reenter reading mode and hold Enter through a repeated keydown", async () => {
      await enterViewMode(page);
      await page.getByRole("region", { name: "Card front text" }).focus();
      await page.keyboard.down("Enter");
      await page.keyboard.down("Enter");
      await page.keyboard.up("Enter");
    });
    await test.step("Then: Enter exits reading mode without accidentally flipping the card", async () => {
      await expect.poll(() => readViewMode(page)).toBe(false);
      await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    });
    await test.step("When: Press Enter again outside reading mode", async () => {
      await page.keyboard.press("Enter");
    });
    await test.step("Then: The card answer is revealed", async () => {
      await expect(page.getByRole("region", { name: scenario.answer })).toContainText(card.backText);
    });
    await test.step("When: Click the revealed answer", async () => {
      await page.getByRole("region", { name: scenario.answer }).getByText(card.backText, { exact: true }).click();
    });
    await test.step("Then: The answer closes", async () => {
      await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    });
  });
});

test.describe("View mode", () => {
  const scenario = { id: "NAVIGATION-21", route: "view", next: "Next card" };
  test("NAVIGATION-21 keeps button actions and autoplay available in view mode", async ({ fixture, page }) => {
    const { first, before } =
      await test.step("Given: A deck with reading mode enabled and a positive autoplay interval", async () => {
        const deck = fixture.deck();
        const first = fixture.card("card-1");
        await fixture.apply(page, { preferences: { study: { cardInterval: 1 }, controls: { viewMode: true } } });
        await page.goto(`/deck/${deck.id}/${scenario.route}`);
        const before = await readProgress(first.id);
        return { first, before };
      });
    await test.step("When: Activate the next-card or rating button", async () => {
      await page.getByRole("button", { name: scenario.next, exact: true }).click();
    });
    const { surface } = await test.step("Then: The next readable card starts at its top", async () => {
      const surface = page.getByRole("region", { name: "Card front text" });
      await expect(surface).toContainText(fixture.card("card-2").frontText);
      await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
      return { surface };
    });
    await test.step("When: Start autoplay while reading", async () => {
      await page.getByRole("button", { name: "Play", exact: true }).click();
    });
    await test.step("Then: Autoplay advances to the following readable card", async () => {
      await expect(surface).toContainText(fixture.card("card-3").frontText);
    });
    await test.step("When: Pause autoplay", async () => {
      await page.getByRole("button", { name: "Pause", exact: true }).click();
    });
    await test.step("Then: Reading mode remains enabled with only the expected study progress change", async () => {
      await expect.poll(() => readViewMode(page)).toBe(true);
      await expect
        .poll(() => readProgress(first.id))
        .toEqual(scenario.route === "view" ? before : { ...before, reps: 1 });
    });
  });
});
