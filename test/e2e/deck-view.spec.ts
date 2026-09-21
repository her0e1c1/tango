import type { Locator, Page } from "@playwright/test";

import { type E2EFixture, expect, getDocument, readLocalData, requireDocument, test } from "./fixtures";

const readSavedData = async (page: Page, fixture: E2EFixture) => ({
  local: await readLocalData(page),
  preferences: await page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}")),
  decks: await Promise.all(
    [...fixture.state.remote.decks, ...fixture.state.browser.localDecks].map(({ id }) => getDocument("deck", id))
  ),
  cards: await Promise.all(
    [...fixture.state.remote.cards, ...fixture.state.browser.localCards].map(({ id }) => getDocument("card", id))
  ),
});

const openView = async (page: Page, deckName: string) => {
  await page.getByRole("button", { name: `View cards in ${deckName}`, exact: true }).click();
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

test("DECK-NAVIGATION-03 browses remote Cards without changing learning data or preferences", async ({
  fixture,
  page,
}) => {
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
  await openView(page, deck.name);
  await expect(page).toHaveURL(`/deck/${deck.id}/view`);
  await expectFront(page, first.frontText);
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 3");
  await expect(page.getByRole("button", { name: "Swipe up" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();

  const front = page.getByRole("button", { name: "Card front", exact: true });
  const answer = page.getByRole("region", { name: "Card answer", exact: true });
  await mouseSwipe(page, front, "right", "right");
  await mouseSwipe(page, front, "right", "middle");
  await mouseSwipe(page, front, "up");
  await mouseSwipe(page, front, "down");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowDown");
  await expectFront(page, first.frontText);
  await front.getByText(first.frontText, { exact: true }).click();
  await expect(answer).toContainText(first.backText);
  await answer.getByText(first.backText, { exact: true }).click();
  await expectFront(page, first.frontText);

  await mouseSwipe(page, front, "right");
  await expectFront(page, second.frontText);
  await front.getByText(second.frontText, { exact: true }).click();
  await mouseSwipe(page, answer, "left");
  await expectFront(page, first.frontText);
  await front.getByText(first.frontText, { exact: true }).click();
  await mouseSwipe(page, answer, "right");
  await expectFront(page, second.frontText);
  await mouseSwipe(page, front, "left");
  await expectFront(page, first.frontText);

  await page.keyboard.press("ArrowRight");
  await expectFront(page, second.frontText);
  await page.keyboard.press("ArrowRight");
  await expectFront(page, third.frontText);
  await front.getByText(third.frontText, { exact: true }).click();
  await page.keyboard.press("ArrowLeft");
  await expectFront(page, second.frontText);
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  await expectFront(page, third.frontText);
  await page.getByRole("button", { name: "Previous card", exact: true }).click();
  await expectFront(page, second.frontText);
  await front.getByText(second.frontText, { exact: true }).click();
  await page.keyboard.press("ArrowRight");
  await expectFront(page, third.frontText);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/$/);
  await openView(page, deck.name);
  await expectFront(page, first.frontText);
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("DECK-NAVIGATION-04 resets local-only viewing position on reload and reentry without saving", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const first = fixture.card("card-1");
  const second = fixture.card("card-2");
  await fixture.apply(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  await page.getByText(first.frontText, { exact: true }).click();
  await expect(page.getByRole("region", { name: "Card answer", exact: true })).toContainText(first.backText);
  await page.keyboard.press("ArrowRight");
  await expectFront(page, second.frontText);
  await page.getByText(second.frontText, { exact: true }).click();
  await expect(page.getByRole("region", { name: "Card answer", exact: true })).toContainText(second.backText);
  await page.reload();
  await expectFront(page, first.frontText);
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  await expectFront(page, second.frontText);
  await page.getByRole("button", { name: "Back to deck list", exact: true }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await openView(page, deck.name);
  await expectFront(page, first.frontText);
  await page.getByRole("button", { name: "Previous card", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await openView(page, deck.name);
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  await expectFront(page, second.frontText);
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("DECK-NAVIGATION-05 views all difficulty and tag matches in standard order without the study limit", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const matching = [fixture.card("card-1"), fixture.card("card-2"), fixture.card("card-3")];
  await fixture.apply(page, { preferences: { study: { shuffled: true } } });
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Study ${deck.name}`, exact: true })).toBeVisible();
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  for (const [index, card] of matching.entries()) {
    await expectFront(page, card.frontText);
    await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", `${String(index + 1)} of 3`);
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  }
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);

  const queuedMatch = fixture.card("card-5");
  const queuedTag = queuedMatch.tags[0];
  const previousTag = deck.selectedTags[0];
  if (queuedTag === undefined || previousTag === undefined) throw new Error("Expected both filter fixture tags");
  const writeArrived = Promise.withResolvers<void>();
  const releaseWrite = Promise.withResolvers<void>();
  const writePattern = "**/google.firestore.v1.Firestore/Write/channel**";
  await page.route(writePattern, async (route) => {
    const body = decodeURIComponent((route.request().postData() ?? "").replaceAll("+", "%20"));
    if (body.includes(`/documents/deck/${deck.id}`)) {
      writeArrived.resolve();
      await releaseWrite.promise;
    }
    await route.fallback();
  });
  try {
    await page.getByRole("button", { name: `View ${deck.name}`, exact: true }).click();
    await page.getByText("Filters", { exact: true }).click();
    await page.getByRole("combobox", { name: "Minimum difficulty" }).selectOption(String(queuedMatch.difficulty));
    await writeArrived.promise;
    // Local filter changes are usable while cloud acknowledgement is held.
    await page.getByRole("checkbox", { name: queuedTag, exact: true }).locator("xpath=parent::label").click();
    await page.getByRole("checkbox", { name: previousTag, exact: true }).locator("xpath=parent::label").click();
    await expect(page.getByRole("checkbox", { name: queuedTag, exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: previousTag, exact: true })).not.toBeChecked();
    await expect
      .poll(async () => (await readLocalData(page)).decks.find((value) => value.id === deck.id)?.selectedTags)
      .toEqual([queuedTag]);
    const beforeQueuedView = await readSavedData(page, fixture);
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await openView(page, deck.name);
    await expectFront(page, queuedMatch.frontText);
    await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
    await page.getByRole("button", { name: "Next card", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(await readSavedData(page, fixture)).toEqual(beforeQueuedView);

    releaseWrite.resolve();
    await expect
      .poll(async () => (await requireDocument("deck", deck.id)).fields.selectedTags?.arrayValue?.values)
      .toEqual([{ stringValue: queuedTag }]);
    expect((await requireDocument("deck", deck.id)).fields.difficultyMin?.integerValue).toBe(
      String(queuedMatch.difficulty)
    );
    const afterFilterSave = await readSavedData(page, fixture);
    expect(afterFilterSave.cards).toEqual(before.cards);
    expect(afterFilterSave.local).toEqual(beforeQueuedView.local);
    expect(afterFilterSave.preferences).toEqual(before.preferences);
  } finally {
    releaseWrite.resolve();
    await page.unroute(writePattern);
  }
});

test("DECK-NAVIGATION-06 applies review scheduling to read-only viewing", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const due = fixture.card("card-due");
  const unscheduled = fixture.card("card-unscheduled");
  await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
  await page.goto("/");
  await expect(page.getByRole("button", { name: `View cards in ${deck.name}`, exact: true })).toBeVisible();
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  await expectFront(page, due.frontText);
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 2");
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  await expectFront(page, unscheduled.frontText);
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("DECK-NAVIGATION-07 recovers from empty and missing Deck views without saving", async ({
  fixture,
  page,
  namespace,
}) => {
  const deck = fixture.deck();
  await fixture.apply(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: `View cards in ${deck.name}`, exact: true })).toBeVisible();
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  await expect(page.getByText("No cards match the current filters.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to deck list", exact: true }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(`/deck/${namespace.id("missing")}/view`);
  await expect(page.getByRole("heading", { name: "Deck not found", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Go home", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("DECK-NAVIGATION-08 scrolls one long answer with touch and exits at either horizontal boundary", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const card = fixture.card("card-1");
  await page.setViewportSize({ width: 320, height: 568 });
  await fixture.apply(page);
  await page.goto("/");
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  await expectFront(page, card.frontText);
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
  await touchGesture(page, page.getByRole("button", { name: "Card front", exact: true }));
  const answer = page.getByRole("region", { name: "Card answer", exact: true });
  await expect(answer).toBeVisible();
  const height = await answer.evaluate((element) => ({ client: element.clientHeight, scroll: element.scrollHeight }));
  expect(height.scroll).toBeGreaterThan(height.client);
  await answer.hover();
  await page.mouse.wheel(0, height.client);
  await expect.poll(() => answer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await answer.evaluate((element) => {
    element.scrollTop = 0;
  });
  await touchGesture(page, answer, "up");
  await expect.poll(() => answer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(answer).toContainText(card.backText.split("\n").at(-1) ?? card.backText);
  await touchGesture(page, answer, "left");
  await expect(page).toHaveURL(/\/$/);
  await openView(page, deck.name);
  await expectFront(page, card.frontText);
  await touchGesture(page, page.getByRole("button", { name: "Card front", exact: true }), "right");
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("DECK-NAVIGATION-09 shares display preferences with Study and explains viewing actions", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  await fixture.apply(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  await page.getByRole("button", { name: "Open viewing help" }).click();
  const dialog = page.getByRole("dialog", { name: "Viewing controls" });
  await expect(dialog).toContainText("Go to the previous card");
  await expect(dialog.getByText("No action", { exact: true })).toHaveCount(2);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open viewing help" })).toBeFocused();
  await expectFront(page, fixture.card("card-1").frontText);
  await page.getByRole("button", { name: "Open card actions" }).click();
  for (const name of ["Card details", "Swipe controls", "Playback controls", "Help button"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "false");
  }
  await page.reload();
  await expectFront(page, fixture.card("card-1").frontText);
  await expect(page.getByRole("button", { name: "Open viewing help" })).toHaveCount(0);
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next card" })).toHaveCount(0);
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
          showCardDetails: false,
          showSwipeButtonList: false,
          showPlaybackControls: false,
        },
      },
    },
  });
  await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open card actions" }).click();
  for (const name of ["Card details", "Swipe controls", "Playback controls", "Help button"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "false");
  }
});

test("DECK-NAVIGATION-10 starts viewing stopped and autoplays without persisting learning data", async ({
  fixture,
  page,
}) => {
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
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Open viewing help" }).click();
  await page.clock.runFor(2000);
  await page.getByRole("button", { name: "Close help" }).click();
  await expectFront(page, fixture.card("card-1").frontText);
  await page.clock.runFor(1000);
  await expectFront(page, fixture.card("card-2").frontText);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.runFor(2000);
  await expectFront(page, fixture.card("card-2").frontText);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.clock.runFor(1000);
  await expectFront(page, fixture.card("card-3").frontText);
  await page.clock.runFor(1000);
  await expect(page).toHaveURL(/\/$/);
  await openView(page, deck.name);
  await page.clock.runFor(2000);
  await expectFront(page, fixture.card("card-1").frontText);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("DECK-NAVIGATION-11 browses forward and backward with the progress slider without saving", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  await fixture.apply(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  const slider = page.getByRole("slider", { name: "Viewing progress" });
  await slider.focus();
  await page.keyboard.press("End");
  await expectFront(page, fixture.card("card-2").frontText);
  await expect(slider).toHaveAttribute("aria-valuetext", "2 of 2");
  await page.keyboard.press("ArrowLeft");
  await expectFront(page, fixture.card("card-1").frontText);
  await expect(slider).toHaveAttribute("aria-valuetext", "1 of 2");
  await page.getByRole("button", { name: "Card front", exact: true }).click();
  await expect(page.getByRole("region", { name: "Card answer" })).toBeVisible();
  await expect(slider).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Back to deck list", exact: true })).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expectFront(page, fixture.card("card-2").frontText);
  await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  await openView(page, deck.name);
  await expectFront(page, fixture.card("card-1").frontText);
  expect(await readSavedData(page, fixture)).toEqual(before);
});
