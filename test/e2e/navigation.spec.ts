import { type E2EFixture, expect, getDocument, listDocuments, requireDocument, test } from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";
import { createAnonymousDeck, downloadDeckCards, startAnonymousStudy } from "./utils/ui-helpers";
import type { Locator, Page } from "@playwright/test";

test("NAVIGATION-17 shows held review counts and opens existing study settings", async ({ fixture, page }) => {
  const deck = fixture.deck();
  await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
  const before = await requireDocument("deck", deck.id);
  await page.goto("/");
  await expect(page.getByRole("article", { name: deck.name, exact: true })).toBeVisible();
  await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
  await page.getByText("About counts", { exact: true }).click();
  await expect(page.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
  const review = page.getByRole("button", { name: `Review ${deck.name}`, exact: true });
  await review.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/deck/${deck.id}/start`);
  expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
  expect(await requireDocument("deck", deck.id)).toEqual(before);
});

test("NAVIGATION-18 updates the list when a review deadline arrives", async ({ fixture, page }) => {
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
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
  await page.clock.runFor(500);
  await expect(page.getByText("2 due · 1 new", { exact: true })).toHaveCount(2);
  expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
  expect(await requireDocument("card", future.id)).toEqual(before);
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

test("NAVIGATION-09 resets local-only viewing position on reload and reentry without saving", async ({
  fixture,
  page,
}) => {
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
  await page.goto("/");
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
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

test("NAVIGATION-10 views all tag matches in standard order without the study limit", async ({ fixture, page }) => {
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
    await page.getByRole("button", { name: `Open cards in ${deck.name}`, exact: true }).click();
    await page.getByText("Filters", { exact: true }).click();
    await page.getByRole("checkbox", { name: queuedTag, exact: true }).locator("xpath=parent::label").click();
    await writeArrived.promise;
    // Local filter changes are usable while cloud acknowledgement is held.
    await page.getByRole("checkbox", { name: previousTag, exact: true }).locator("xpath=parent::label").click();
    await expect(page.getByRole("checkbox", { name: queuedTag, exact: true })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: previousTag, exact: true })).not.toBeChecked();
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
    const afterFilterSave = await readSavedData(page, fixture);
    expect(afterFilterSave.cards).toEqual(before.cards);
    expect(afterFilterSave.learning).toEqual(beforeQueuedView.learning);
    expect(afterFilterSave.preferences).toEqual(before.preferences);
  } finally {
    releaseWrite.resolve();
    await page.unroute(writePattern);
  }
});

test("NAVIGATION-11 applies review scheduling to read-only viewing", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const due = fixture.card("card-due");
  const unscheduled = fixture.card("card-unscheduled");
  await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open actions for ${deck.name}`, exact: true })).toBeVisible();
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

test("NAVIGATION-12 recovers from empty and missing Deck views without saving", async ({
  fixture,
  page,
  namespace,
}) => {
  const deck = fixture.deck();
  await fixture.apply(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open actions for ${deck.name}`, exact: true })).toBeVisible();
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

test("NAVIGATION-13 scrolls one long answer with touch and exits at either horizontal boundary", async ({
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

test("NAVIGATION-14 shares display preferences with Study and explains viewing actions", async ({ fixture, page }) => {
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
  await page.keyboard.press("ArrowRight");
  await expect(edit).toHaveAttribute("href", `/card/${fixture.card("card-2").id}/edit`);
  await edit.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/card/${fixture.card("card-2").id}/edit`);
  await expect(page.getByRole("heading", { name: "Edit card" })).toBeVisible();
  await page.goBack();
  await expectFront(page, fixture.card("card-1").frontText);
  await page.getByRole("button", { name: "Card front", exact: true }).click();
  await expect(edit).toHaveCount(0);
  await page.getByRole("region", { name: "Card answer", exact: true }).click();
  await page.getByRole("button", { name: "Open viewing help" }).click();
  const dialog = page.getByRole("dialog", { name: "Viewing controls" });
  await expect(dialog).toContainText("Go to the previous card");
  await expect(dialog.getByText("No action", { exact: true })).toHaveCount(2);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open viewing help" })).toBeFocused();
  await expectFront(page, fixture.card("card-1").frontText);
  await page.getByRole("button", { name: "Open card actions" }).click();
  for (const name of ["Card details", "Swipe controls", "Playback controls", "Help button", "Edit link"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "false");
  }
  await page.getByRole("button", { name: "Close card actions" }).click();
  await expect(edit).toHaveCount(0);
  await page.reload();
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
  await page.getByRole("button", { name: "Open card actions" }).click();
  await page.getByRole("button", { name: "Edit link", exact: true }).click();
  await page.getByRole("button", { name: "Close card actions" }).click();
  await expect(edit).toBeVisible();
  await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open card actions" }).click();
  await expect(page.getByRole("button", { name: "Edit link", exact: true })).toHaveCount(0);
  for (const name of ["Card details", "Swipe controls", "Playback controls", "Help button"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "false");
  }
});

test("NAVIGATION-15 starts viewing stopped and autoplays without persisting learning data", async ({
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

test("NAVIGATION-16 browses forward and backward with the progress slider without saving", async ({
  fixture,
  page,
}) => {
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
  await page.keyboard.press("End");
  await expectFront(page, second.frontText);
  await expect(slider).toHaveAttribute("aria-valuetext", "2 of 2");
  await page.keyboard.press("ArrowLeft");
  await expectFront(page, first.frontText);
  await expect(slider).toHaveAttribute("aria-valuetext", "1 of 2");
  await page.getByRole("button", { name: "Card front", exact: true }).click();
  await expect(page.getByRole("region", { name: "Card answer" })).toBeVisible();
  await expect(slider).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Back to deck list", exact: true })).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expectFront(page, second.frontText);
  await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  await openView(page, deck.name);
  await expectFront(page, first.frontText);
  expect(await readSavedData(page, fixture)).toEqual(before);
  await page.goto("/");
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
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

test("NAVIGATION-06 navigates from the Deck list to its Card list", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);

  await page.goto("/");
  const actions = page.getByRole("button", { name: "Add", exact: true });
  await actions.focus();
  await actions.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Create deck" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Import decks" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(actions).toBeFocused();

  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await actions.click();
  await expect(page.getByRole("menu")).toHaveCount(1);
  await expect(page.getByRole("menu", { name: "Add", exact: true })).toBeVisible();
  // Use the keyboard to reach the Deck trigger while the list menu may cover it.
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).press("Enter");
  await expect(page.getByRole("menu")).toHaveCount(1);
  await expect(page.getByRole("menu", { name: `Actions for ${deck.name}` })).toBeVisible();

  await actions.click();
  await page.getByRole("menuitem", { name: "Create deck" }).click();
  await expect(page).toHaveURL(/\/deck\/new$/);
  await page.goto("/");
  await actions.click();
  await page.getByRole("menuitem", { name: "Import decks" }).click();
  await expect(page).toHaveURL(/\/import$/);
  await page.goto("/");
  await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();

  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByText(card.frontText)).toBeVisible();

  const specialDecks = fixture.state.remote.decks.filter(({ id }) => id !== deck.id);
  const specialCards = fixture.state.remote.cards.filter(({ deckId }) => deckId !== deck.id);
  const before = await Promise.all(fixture.state.remote.cards.map(({ id }) => requireDocument("card", id)));
  for (const selected of specialDecks) {
    await page.goto("/");
    await page.getByRole("button", { name: `Open cards in ${selected.name}`, exact: true }).click();
    const destination = new URL(page.url());
    expect(destination.pathname).toBe(`/deck/${encodeURIComponent(selected.id)}`);
    expect(destination.search).toBe("");
    expect(destination.hash).toBe("");
    for (const entry of ["navigation", "direct", "reload"]) {
      if (entry === "direct") await page.goto(destination.href);
      if (entry === "reload") await page.reload();
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
    }
  }
});

test("NAVIGATION-07 recovers home from a missing Deck route", async ({ fixture, page, namespace }) => {
  await fixture.apply(page);

  await page.goto(`/deck/${namespace.id("missing")}`);
  await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
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
  await fixture.apply(page);

  await page.goto(`/${namespace.id("not-a-route")}`);
  const notFound = page.getByRole("heading", { level: 1, name: "Page not found" });
  await expect(notFound).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(notFound).toHaveCount(0);
});

test("NAVIGATION-02 Screen shortcuts navigate to their configured routes", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  const deckBefore = await requireDocument("deck", deck.id);
  const cardBefore = await requireDocument("card", card.id);

  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  await page.keyboard.press("s");
  await expect(page).toHaveURL(/\/settings$/);

  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  await page.keyboard.press("i");
  await expect(page).toHaveURL(/\/import$/);

  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  await page.keyboard.press("t");
  await expect(page).toHaveURL(/\/$/);

  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  await page.keyboard.press("s");
  await expect(page).toHaveURL(/\/settings$/);

  expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
  expect(await requireDocument("card", card.id)).toEqual(cardBefore);
});

test("NAVIGATION-03 The outer error boundary keeps the locale and supports reload and cache recovery", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/settings");
  await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  browserErrors.allow(/E2E_RENDER_FAILURE/);
  await failNextThemeUpdate(page);
  await page.getByRole("checkbox", { name: "ダークモード" }).locator("xpath=parent::label").click();
  await expect(page.getByRole("heading", { name: "問題が発生しました" })).toBeVisible();
  await expect(page.getByText(/再読み込みするか、アプリのキャッシュを削除して再読み込みしてください。/)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.getByRole("button", { name: "再読み込み", exact: true }).click();
  await expect(page.getByRole("heading", { name: "設定", exact: true })).toBeVisible();

  await page.evaluate(async () => {
    localStorage.setItem("unrelated-reset-marker", "keep");
    const scope = `${window.location.origin}/`;
    await navigator.serviceWorker.ready;
    const name = (await caches.keys()).find((key) => key.startsWith("workbox-precache-") && key.endsWith(scope));
    if (!name) throw new Error("Expected Tango's precache");
    const cache = await caches.open(name);
    await cache.put("/__reset-marker__", new Response("stale"));
    const unrelated = await caches.open("unrelated-reset-cache");
    await unrelated.put("/__unrelated-reset-marker__", new Response("keep"));
  });
  await failNextThemeUpdate(page);
  await page.getByRole("checkbox", { name: "ダークモード" }).locator("xpath=parent::label").click();
  const reset = page.getByRole("button", { name: "キャッシュを削除して再読み込み" });
  await expect(reset).toBeVisible();
  const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
  await reset.click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { level: 1, name: "設定", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
  expect(await page.evaluate(() => localStorage.getItem("unrelated-reset-marker"))).toBe("keep");
  expect(await page.evaluate(async () => (await caches.match("/__reset-marker__")) !== undefined)).toBe(false);
  expect(await page.evaluate(async () => (await caches.match("/__unrelated-reset-marker__"))?.text())).toBe("keep");
  await page.goto("/account");
  await expect(page.getByText(uid, { exact: true })).toBeVisible();
});

test("NAVIGATION-04 Unhandled browser errors share recovery without clearing data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  await fixture.apply(page);
  browserErrors.allow(/E2E_UNHANDLED_FAILURE|(?:page error: )?(?:null|undefined)/);
  for (const failure of ["timer", "promise", "string", "null", "undefined"] as const) {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
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
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    await page.getByRole("button", { name: "Reload", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  }
  await page.evaluate(async () => {
    window.dispatchEvent(new Event("error"));
    await Promise.reject(new Error("handled")).catch(() => undefined);
  });
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
});

test("NAVIGATION-05 Corrupt PWA cache fails startup until cache recovery reloads the healthy application", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const { uid } = fixture.user();
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
    const script = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
    if (!script) throw new Error("Expected the production application module");
    const pathname = new URL(script.src).pathname;
    const request = (await cache.keys()).find((key) => new URL(key.url).pathname === pathname);
    if (!request) throw new Error("Expected the cached application module");
    const response = await cache.match(request);
    if (!response) throw new Error("Expected the cached module response");
    const source = await response.text();
    // Keep React and the recovery UI usable, but corrupt a startup effect's class token in the real cached bundle.
    const corrupted = source.replace(
      /\.classList\.toggle\((["'`])dark\1\s*,/,
      '.classList.toggle("E2E INVALID CACHE TOKEN",'
    );
    if (corrupted === source) throw new Error("Could not corrupt the cached startup class token");
    await cache.put(request, new Response(corrupted, { headers: response.headers }));
    return pathname;
  });
  browserErrors.allow(/E2E INVALID CACHE TOKEN/);

  const cachedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === assetPath);
  await page.reload();
  expect((await cachedResponse).fromServiceWorker()).toBe(true);
  await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toHaveCount(0);

  await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: "Reload", exact: true }).click()]);
  await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear cache and reload", exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
  expect(
    await page.evaluate(async (path) => {
      const response = await caches.match(path, { ignoreSearch: true });
      return (await response?.text())?.includes("E2E INVALID CACHE TOKEN") ?? false;
    }, assetPath)
  ).toBe(false);
  await page.goto("/account");
  await expect(page.getByText(uid, { exact: true })).toBeVisible();
  expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
  expect(await requireDocument("card", card.id)).toEqual(cardBefore);
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
    const deck = fixture.deck();
    const card = fixture.card("card-1");
    await page.setViewportSize({ width: 320, height: 568 });
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    const before = await readProgress(card.id);
    await enterViewMode(page);
    await readLongFront(page);
    await expect(page).toHaveURL(`/deck/${deck.id}/${scenario.route}`);
    await expect(page.getByRole("region", { name: "Card front text" })).toContainText(card.frontText);
    expect(await readProgress(card.id)).toEqual(before);
    if (scenario.route === "study") await verifyStudyViewModeControls(page, fixture.user().uid, deck.id);
  });
});

test.describe("View mode", () => {
  const scenario = { id: "NAVIGATION-20", route: "view", answer: "Card answer" };
  test("NAVIGATION-20 exits view mode with a tap or Enter before flipping the card", async ({ fixture, page }) => {
    const deck = fixture.deck();
    const card = fixture.card("card-1");
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    await enterViewMode(page);
    await page.getByRole("region", { name: "Card front text" }).getByText(card.frontText, { exact: true }).click();
    await expect.poll(() => readViewMode(page)).toBe(false);
    await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    await enterViewMode(page);
    await page.getByRole("region", { name: "Card front text" }).focus();
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter");
    await page.keyboard.up("Enter");
    await expect.poll(() => readViewMode(page)).toBe(false);
    await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("region", { name: scenario.answer })).toContainText(card.backText);
    await page.getByRole("region", { name: scenario.answer }).getByText(card.backText, { exact: true }).click();
    await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
  });
});

test.describe("View mode", () => {
  const scenario = { id: "NAVIGATION-21", route: "view", next: "Next card" };
  test("NAVIGATION-21 keeps button actions and autoplay available in view mode", async ({ fixture, page }) => {
    const deck = fixture.deck();
    const first = fixture.card("card-1");
    await fixture.apply(page, { preferences: { study: { cardInterval: 1 }, controls: { viewMode: true } } });
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    const before = await readProgress(first.id);
    await page.getByRole("button", { name: scenario.next, exact: true }).click();
    const surface = page.getByRole("region", { name: "Card front text" });
    await expect(surface).toContainText(fixture.card("card-2").frontText);
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(surface).toContainText(fixture.card("card-3").frontText);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect.poll(() => readViewMode(page)).toBe(true);
    await expect
      .poll(() => readProgress(first.id))
      .toEqual(scenario.route === "view" ? before : { ...before, reps: 1 });
  });
});
