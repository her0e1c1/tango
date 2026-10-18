import { type E2EFixture, expect, getDocument, listDocuments, requireDocument, test } from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";
import { createAnonymousDeck, downloadDeckCards, startAnonymousStudy } from "./utils/ui-helpers";
import type { Locator, Page } from "@playwright/test";

test("NAVIGATION-17 shows held review counts and opens existing study settings", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `before` and any shared test state below.
  const deck = fixture.deck();
  await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
  const before = await requireDocument("deck", deck.id);
  await page.goto("/");
  await expect(page.getByRole("article", { name: deck.name, exact: true })).toBeVisible();
  await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
  // When: Exercise `page.getByText("About counts", { exact: true }).click` with the prepared inputs.
  await page.getByText("About counts", { exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
  const review = page.getByRole("button", { name: `Review ${deck.name}`, exact: true });
  // When: Exercise `review.focus` with the prepared inputs.
  await review.focus();
  await page.keyboard.press("Enter");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(`/deck/${deck.id}/start`);
  expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
  expect(await requireDocument("deck", deck.id)).toEqual(before);
});

test("NAVIGATION-18 updates the list when a review deadline arrives", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `future`, `before` and any shared test state below.
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
  // When: Exercise `page.evaluate` with the prepared inputs.
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
  // When: Exercise `page.clock.runFor` with the prepared inputs.
  await page.clock.runFor(500);
  // Then: Verify the expected result in the assertions below.
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
  // Given: Use this case's inputs and any shared test setup.
  // When: Observe the prepared result through the following checks.
  // Then: Verify the expected result in the assertions below.
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
  // Given: Prepare `deck`, `first`, `second` and any shared test state below.
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
  // When: Choose View for the prepared Deck.
  await openView(page, deck.name);
  // Then: The first Card opens with browsing controls and progress.
  await expect(page).toHaveURL(`/deck/${deck.id}/view`);
  await expectFront(page, first.frontText);
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 3");
  await expect(page.getByRole("button", { name: "Swipe up" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();

  const front = page.getByRole("button", { name: "Card front", exact: true });
  const answer = page.getByRole("region", { name: "Card answer", exact: true });
  // When: Attempt unsupported mouse gestures and vertical keyboard navigation.
  await mouseSwipe(page, front, "right", "right");
  await mouseSwipe(page, front, "right", "middle");
  await mouseSwipe(page, front, "up");
  await mouseSwipe(page, front, "down");
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowDown");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, first.frontText);
  // When: Exercise `front.getByText(first.frontText, { exact: true }).click` with the prepared inputs.
  await front.getByText(first.frontText, { exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(answer).toContainText(first.backText);
  // When: Exercise `answer.getByText(first.backText, { exact: true }).click` with the prepared inputs.
  await answer.getByText(first.backText, { exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, first.frontText);

  // When: Exercise `mouseSwipe` with the prepared inputs.
  await mouseSwipe(page, front, "right");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  // When: Exercise `front.getByText(second.frontText, { exact: true }).click` with the prepared inputs.
  await front.getByText(second.frontText, { exact: true }).click();
  await mouseSwipe(page, answer, "left");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, first.frontText);
  // When: Exercise `front.getByText(first.frontText, { exact: true }).click` with the prepared inputs.
  await front.getByText(first.frontText, { exact: true }).click();
  await mouseSwipe(page, answer, "right");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  // When: Exercise `mouseSwipe` with the prepared inputs.
  await mouseSwipe(page, front, "left");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, first.frontText);

  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowRight");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowRight");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, third.frontText);
  // When: Exercise `front.getByText(third.frontText, { exact: true }).click` with the prepared inputs.
  await front.getByText(third.frontText, { exact: true }).click();
  await page.keyboard.press("ArrowLeft");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  // When: Exercise `page.getByRole("button", { name: "Next card", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, third.frontText);
  // When: Exercise `page.getByRole("button", { name: "Previous card", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Previous card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  // When: Exercise `front.getByText(second.frontText, { exact: true }).click` with the prepared inputs.
  await front.getByText(second.frontText, { exact: true }).click();
  await page.keyboard.press("ArrowRight");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, third.frontText);
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowRight");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  // When: Exercise `openView` with the prepared inputs.
  await openView(page, deck.name);
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, first.frontText);
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowLeft");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("NAVIGATION-09 resets local-only viewing position on reload and reentry without saving", async ({
  fixture,
  page,
}) => {
  // Given: Prepare `local`, `studyFront`, `before` and any shared test state below.
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
  // When: Exercise `page.getByText(first.frontText, { exact: true }).click` with the prepared inputs.
  await page.getByText(first.frontText, { exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("region", { name: "Card answer", exact: true })).toContainText(first.backText);
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowRight");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  // When: Exercise `page.getByText(second.frontText, { exact: true }).click` with the prepared inputs.
  await page.getByText(second.frontText, { exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("region", { name: "Card answer", exact: true })).toContainText(second.backText);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, first.frontText);
  // When: Exercise `page.getByRole("button", { name: "Next card", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  // When: Apply the operation or event under test.
  await page.getByRole("button", { name: "Back to deck list", exact: true }).first().click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  // When: Exercise `openView` with the prepared inputs.
  await openView(page, deck.name);
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, first.frontText);
  // When: Exercise `page.getByRole("button", { name: "Previous card", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Previous card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  // When: Exercise `openView` with the prepared inputs.
  await openView(page, deck.name);
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  // When: Exercise `page.getByRole("button", { name: "Next card", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  // Then: Verify the expected result in the assertions below.
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

test("NAVIGATION-10 views all cards in standard order independently of study conditions", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `matching`, `before` and any shared test state below.
  const deck = fixture.deck();
  const matching = ["card-1", "card-2", "card-3", "card-4", "card-5"].map((id) => fixture.card(id));
  await fixture.apply(page, { preferences: { study: { shuffled: true } } });
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Study ${deck.name}`, exact: true })).toBeVisible();
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  for (const [index, card] of matching.entries()) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    await expectFront(page, card.frontText);
    await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", `${String(index + 1)} of 5`);
    // When: Exercise `page.getByRole("button", { name: "Next card", exact: true }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Next card", exact: true }).click();
  }
  // When: Observe the prepared result through the following checks.
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("NAVIGATION-11 includes future reviews in read-only viewing", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `due`, `unscheduled` and any shared test state below.
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
  // When: Exercise `page.getByRole("button", { name: "Next card", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, future.frontText);
  // When: Exercise `page.getByRole("button", { name: "Card front" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Card front" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("region", { name: "Card answer" })).toContainText(future.backText);
  // When: Exercise `page.getByRole("region", { name: "Card answer" }).click` with the prepared inputs.
  await page.getByRole("region", { name: "Card answer" }).click();
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, unscheduled.frontText);
  // When: Exercise `page.getByRole("button", { name: "Next card", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Next card", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("NAVIGATION-12 recovers from empty and missing Deck views without saving", async ({
  fixture,
  page,
  namespace,
}) => {
  // Given: Prepare `deck`, `before` and any shared test state below.
  const deck = fixture.deck();
  await fixture.apply(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open actions for ${deck.name}`, exact: true })).toBeVisible();
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  await expect(page.getByText("No cards yet", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
  // When: Apply the operation or event under test.
  await page.getByRole("button", { name: "Back to deck list", exact: true }).first().click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${namespace.id("missing")}/view`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "Deck not found", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: "Go home", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Go home", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("NAVIGATION-13 scrolls one long answer with touch and exits at either horizontal boundary", async ({
  fixture,
  page,
}) => {
  // Given: Prepare `deck`, `card` and any shared test state below.
  const deck = fixture.deck();
  const card = fixture.card("card-1");
  // When: Exercise `page.setViewportSize` with the prepared inputs.
  await page.setViewportSize({ width: 320, height: 568 });
  await fixture.apply(page);
  await page.goto("/");
  const before = await readSavedData(page, fixture);
  await openView(page, deck.name);
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, card.frontText);
  await expect(page.getByLabel("Viewing progress")).toHaveAttribute("aria-valuetext", "1 of 1");
  // When: Exercise `touchGesture` with the prepared inputs.
  await touchGesture(page, page.getByRole("button", { name: "Card front", exact: true }));
  const answer = page.getByRole("region", { name: "Card answer", exact: true });
  // Then: Verify the expected result in the assertions below.
  await expect(answer).toBeVisible();
  // When: Exercise `answer.evaluate` with the prepared inputs.
  const height = await answer.evaluate((element) => ({ client: element.clientHeight, scroll: element.scrollHeight }));
  // Then: Verify the expected result in the assertions below.
  expect(height.scroll).toBeGreaterThan(height.client);
  // When: Exercise `answer.hover` with the prepared inputs.
  await answer.hover();
  await page.mouse.wheel(0, height.client);
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => answer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  // When: Exercise `answer.evaluate` with the prepared inputs.
  await answer.evaluate((element) => {
    element.scrollTop = 0;
  });
  await touchGesture(page, answer, "up");
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => answer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(answer).toContainText(card.backText.split("\n").at(-1) ?? card.backText);
  // When: Exercise `touchGesture` with the prepared inputs.
  await touchGesture(page, answer, "left");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  // When: Exercise `openView` with the prepared inputs.
  await openView(page, deck.name);
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, card.frontText);
  // When: Exercise `touchGesture` with the prepared inputs.
  await touchGesture(page, page.getByRole("button", { name: "Card front", exact: true }), "right");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("NAVIGATION-14 shares display preferences with Study and explains viewing actions", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `before`, `edit` and any shared test state below.
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
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowRight");
  // Then: Verify the expected result in the assertions below.
  await expect(edit).toHaveAttribute("href", `/card/${fixture.card("card-2").id}/edit`);
  // When: Exercise `edit.focus` with the prepared inputs.
  await edit.focus();
  await page.keyboard.press("Enter");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(`/card/${fixture.card("card-2").id}/edit`);
  await expect(page.getByRole("heading", { name: "Edit card" })).toBeVisible();
  // When: Exercise `page.goBack` with the prepared inputs.
  await page.goBack();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, fixture.card("card-1").frontText);
  // When: Exercise `page.getByRole("button", { name: "Card front", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Card front", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(edit).toHaveCount(0);
  // When: Exercise `page.getByRole("region", { name: "Card answer", exact: true }).click` with the prepared inputs.
  await page.getByRole("region", { name: "Card answer", exact: true }).click();
  await page.getByRole("button", { name: "Open viewing help" }).click();
  const dialog = page.getByRole("dialog", { name: "Viewing controls" });
  // Then: Verify the expected result in the assertions below.
  await expect(dialog).toContainText("Go to the previous card");
  await expect(dialog.getByText("No action", { exact: true })).toHaveCount(2);
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Open viewing help" })).toBeFocused();
  await expectFront(page, fixture.card("card-1").frontText);
  // When: Exercise `page.getByRole("button", { name: "Open card actions" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Open card actions" }).click();
  for (const name of ["Card details", "Swipe controls", "Playback controls", "Help button", "Edit link"]) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // When: Exercise `page.getByRole("button", { name, exact: true }).click` with the prepared inputs.
    await page.getByRole("button", { name, exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "false");
  }
  // When: Exercise `page.getByRole("button", { name: "Close card actions" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Close card actions" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(edit).toHaveCount(0);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
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
  // When: Exercise `page.getByRole("button", { name: "Open card actions" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Open card actions" }).click();
  await page.getByRole("button", { name: "Edit link", exact: true }).click();
  await page.getByRole("button", { name: "Close card actions" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(edit).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "Back to deck list", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: "Open card actions" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Open card actions" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Edit link", exact: true })).toHaveCount(0);
  for (const name of ["Card details", "Swipe controls", "Playback controls", "Help button"]) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "false");
  }
});

test("NAVIGATION-15 starts viewing stopped and autoplays without persisting learning data", async ({
  fixture,
  page,
}) => {
  // Given: Prepare `deck`, `before` and any shared test state below.
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
  // When: Exercise `page.getByRole("button", { name: "Play", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Open viewing help" }).click();
  await page.clock.runFor(2000);
  await page.getByRole("button", { name: "Close help" }).click();
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, fixture.card("card-1").frontText);
  // When: Exercise `page.clock.runFor` with the prepared inputs.
  await page.clock.runFor(1000);
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, fixture.card("card-2").frontText);
  // When: Exercise `page.getByRole("button", { name: "Pause", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.runFor(2000);
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, fixture.card("card-2").frontText);
  // When: Exercise `page.getByRole("button", { name: "Play", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.clock.runFor(1000);
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, fixture.card("card-3").frontText);
  // When: Exercise `page.clock.runFor` with the prepared inputs.
  await page.clock.runFor(1000);
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  // When: Exercise `openView` with the prepared inputs.
  await openView(page, deck.name);
  await page.clock.runFor(2000);
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, fixture.card("card-1").frontText);
  expect(await readSavedData(page, fixture)).toEqual(before);
});

test("NAVIGATION-16 browses forward and backward with the progress slider without saving", async ({
  fixture,
  page,
}) => {
  // Given: Prepare `local`, `studyFront`, `before` and any shared test state below.
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
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("End");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  await expect(slider).toHaveAttribute("aria-valuetext", "2 of 2");
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowLeft");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, first.frontText);
  await expect(slider).toHaveAttribute("aria-valuetext", "1 of 2");
  // When: Exercise `page.getByRole("button", { name: "Card front", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Card front", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("region", { name: "Card answer" })).toBeVisible();
  await expect(slider).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Back to deck list", exact: true })).toHaveCount(0);
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowRight");
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, second.frontText);
  // When: Exercise `page.getByRole("button", { name: "Back to deck list", exact: true }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  await openView(page, deck.name);
  // Then: Verify the expected result in the assertions below.
  await expectFront(page, first.frontText);
  expect(await readSavedData(page, fixture)).toEqual(before);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
  // Then: Verify the expected result in the assertions below.
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
  // Given: Prepare `deck`, `card`, `actions` and any shared test state below.
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);

  await page.goto("/");
  const actions = page.getByRole("button", { name: "Add", exact: true });
  await actions.focus();
  // When: Exercise `actions.press` with the prepared inputs.
  await actions.press("Enter");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("menuitem", { name: "Create deck" })).toBeFocused();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowDown");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("menuitem", { name: "Import decks" })).toBeFocused();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("Escape");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(actions).toBeFocused();

  // When: Exercise `page.getByRole("button", { name: `Open actions for ${deck.name}` }).click` with the prepared inputs.
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
  await actions.click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("menu")).toHaveCount(1);
  await expect(page.getByRole("menu", { name: "Add", exact: true })).toBeVisible();
  // Use the keyboard to reach the Deck trigger while the list menu may cover it.
  // When: Exercise `page.getByRole("button", { name: `Open actions for ${deck.name}` }).press` with the prepared inputs.
  await page.getByRole("button", { name: `Open actions for ${deck.name}` }).press("Enter");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("menu")).toHaveCount(1);
  await expect(page.getByRole("menu", { name: `Actions for ${deck.name}` })).toBeVisible();

  // When: Exercise `actions.click` with the prepared inputs.
  await actions.click();
  await page.getByRole("menuitem", { name: "Create deck" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/deck\/new$/);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  await actions.click();
  await page.getByRole("menuitem", { name: "Import decks" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/import$/);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  await page.getByRole("button", { name: `Open cards in ${deck.name}` }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}$`));
  await expect(page.getByText(card.frontText)).toBeVisible();

  const specialDecks = fixture.state.remote.decks.filter(({ id }) => id !== deck.id);
  const specialCards = fixture.state.remote.cards.filter(({ deckId }) => deckId !== deck.id);
  const before = await Promise.all(fixture.state.remote.cards.map(({ id }) => requireDocument("card", id)));
  for (const selected of specialDecks) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // When: Exercise `page.goto` with the prepared inputs.
    await page.goto("/");
    await page.getByRole("button", { name: `Open cards in ${selected.name}`, exact: true }).click();
    const destination = new URL(page.url());
    // Then: Verify the expected result in the assertions below.
    expect(destination.pathname).toBe(`/deck/${encodeURIComponent(selected.id)}`);
    expect(destination.search).toBe("");
    expect(destination.hash).toBe("");
    for (const entry of ["navigation", "direct", "reload"]) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `page.goto` with the prepared inputs.
      if (entry === "direct") await page.goto(destination.href);
      if (entry === "reload") await page.reload();
      // Then: Verify the expected result in the assertions below.
      await expect(page).toHaveURL(destination.href);
      for (const candidate of specialCards) {
        // Given: Prepare `button` and any shared test state below.
        // When: Apply the operation or event under test.
        const button = page.getByRole("button", { name: `View ${candidate.frontText}`, exact: true });
        // Then: Verify the expected result in the assertions below.
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
  // Given: Use this case's inputs and any shared test setup.
  await fixture.apply(page);

  await page.goto(`/deck/${namespace.id("missing")}`);
  await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "Go home" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Go home" }).click();

  // Then: Verify the expected result in the assertions below.
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
  // Given: Prepare `notFound` and any shared test state below.
  await fixture.apply(page);

  await page.goto(`/${namespace.id("not-a-route")}`);
  const notFound = page.getByRole("heading", { level: 1, name: "Page not found" });
  await expect(notFound).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "Go home" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Go home" }).click();

  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(notFound).toHaveCount(0);
});

test("NAVIGATION-02 Screen shortcuts navigate to their configured routes", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `card`, `deckBefore` and any shared test state below.
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  const deckBefore = await requireDocument("deck", deck.id);
  const cardBefore = await requireDocument("card", card.id);

  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("s");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/settings$/);

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("i");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/import$/);

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("t");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/$/);

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("s");
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/settings$/);

  expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
  expect(await requireDocument("card", card.id)).toEqual(cardBefore);
});

test("NAVIGATION-03 Generic recovery offers only reload and preserves anonymous data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  // Given: Prepare `uid` and any shared test state below.
  await fixture.apply(page, { auth: false, preferences: false });
  const { deck, first } = await createAnonymousDeck(page);
  await page.goto("/account");
  const uid = await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").innerText();
  await page.goto("/settings?recovery=reload#preserved");
  // When: Exercise `page.getByRole("combobox", { name: "Language" }).selectOption` with the prepared inputs.
  await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
  await page.evaluate(() => {
    localStorage.setItem("recovery-marker", "keep");
    sessionStorage.setItem("recovery-marker", "keep");
  });
  browserErrors.allow(/E2E_RENDER_FAILURE/);
  await failNextThemeUpdate(page);
  await page.getByRole("checkbox", { name: "ダークモード" }).locator("xpath=parent::label").click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "問題が発生しました" })).toBeVisible();
  await expect(page.getByText(/再読み込みしてお試しください/)).toBeVisible();
  await expect(page.getByText(/匿名データは復元できません/)).toBeVisible();
  await expect(page.getByRole("button", { name: /ローカルデータを削除|Clear local data/ })).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  // When: Exercise `page.evaluate` with the prepared inputs.
  const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
  await page.getByRole("button", { name: "再読み込み", exact: true }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page).toHaveURL(/\/settings\?recovery=reload#preserved$/);
  await expect(page.getByRole("heading", { name: "設定", exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
  expect(await page.evaluate(() => localStorage.getItem("recovery-marker"))).toBe("keep");
  expect(await page.evaluate(() => sessionStorage.getItem("recovery-marker"))).toBe("keep");
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/account");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(uid, { exact: true })).toBeVisible();
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
});

test("NAVIGATION-04 Unhandled browser errors share recovery without clearing data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  // Given: Use this case's inputs and any shared test setup.
  await fixture.apply(page);
  browserErrors.allow(/E2E_UNHANDLED_FAILURE|(?:page error: )?(?:null|undefined)/);
  for (const failure of ["timer", "promise", "string", "null", "undefined"] as const) {
    // Given: Prepare `preferences` and any shared test state below.
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
    await expect(page.getByRole("button", { name: "Clear local data and reload" })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    // When: Exercise `page.getByRole("button", { name: "Reload", exact: true }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Reload", exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  }
  // When: Exercise `page.evaluate` with the prepared inputs.
  await page.evaluate(async () => {
    window.dispatchEvent(new Event("error"));
    await Promise.reject(new Error("handled")).catch(() => undefined);
  });
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
});

test("NAVIGATION-05 Corrupt PWA cache shows manual recovery guidance without deleting data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  // Given: Prepare `deck`, `card`, `deckBefore` and any shared test state below.
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
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  expect((await cachedResponse).fromServiceWorker()).toBe(true);
  await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toHaveCount(0);

  // When: Exercise `page.getByRole("button", { name: "Reload", exact: true }).click` with the prepared inputs.
  await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: "Reload", exact: true }).click()]);
  // Then: Verify the expected result in the assertions below.
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

test("NAVIGATION-22 Clears anonymous local data after storage initialization fails", async ({ fixture, page }) => {
  // Given: Prepare `uid` and any shared test state below.
  await fixture.apply(page, { auth: false, preferences: false });
  await page.clock.setFixedTime(new Date("2026-01-02T03:04:05Z"));
  const { deck } = await createAnonymousDeck(page);
  await startAnonymousStudy(page, deck.id);
  await page.goto("/account");
  const uid = await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").innerText();
  await page.goto("/settings?recovery=local#preserved");
  // When: Exercise `page.getByRole("combobox", { name: "Language" }).selectOption` with the prepared inputs.
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
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "ローカルデータを削除して再読み込み" })).toBeVisible();
  // When: Exercise `page.evaluate` with the prepared inputs.
  await page.evaluate(() => sessionStorage.removeItem("fail-storage-read"));
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(/匿名データは復元できません/)).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "ローカルデータを削除して再読み込み" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "ローカルデータを削除して再読み込み" }).click();
  // Then: Verify the expected result in the assertions below.
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
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/account");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(uid, { exact: true })).toHaveCount(0);
  // When: Exercise `page.getByText("User ID", { exact: true }).locator` with the prepared inputs.
  const newUid = page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd");
  // Then: Verify the expected result in the assertions below.
  await expect(newUid).toHaveText(/\S+/);
  await expect(newUid).not.toHaveText(uid);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto("/");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("article", { name: deck.name, exact: true })).toHaveCount(0);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: deck.name, exact: true })).toHaveCount(0);
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
  // Given: Prepare `surface`, `box` and any shared test state below.
  const surface = page.getByRole("region", { name: "Card front text" });
  await expect(surface).toBeVisible();
  const box = await surface.boundingBox();
  if (box === null) throw new Error("Missing reading surface");
  // When: Exercise `surface.hover` with the prepared inputs.
  await surface.hover();
  await page.mouse.wheel(0, box.height);
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  // When: Exercise `surface.focus` with the prepared inputs.
  await surface.focus();
  for (const key of ["ArrowDown", "Space", "PageDown"]) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // When: Exercise `surface.press` with the prepared inputs.
    await surface.press("Home");
    // Then: Verify the expected result in the assertions below.
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
    // When: Exercise `surface.press` with the prepared inputs.
    await surface.press(key);
    // Then: Verify the expected result in the assertions below.
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  }
  // When: Exercise `surface.press` with the prepared inputs.
  await surface.press("Home");
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
  // When: Exercise `touchScroll` with the prepared inputs.
  await touchScroll(page, surface);
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  for (const key of ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Space", "PageDown", "PageUp"]) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // When: Exercise `surface.focus` with the prepared inputs.
    await surface.focus();
    await page.keyboard.press(key);
  }
  for (const [dx, dy] of [
    [-80, 0],
    [80, 0],
    [0, -60],
    [0, 60],
  ]) {
    // Given: Prepare `x`, `y` and any shared test state below.
    // When: Apply the operation or event under test.
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + (dx ?? 0), y + (dy ?? 0), { steps: 5 });
    await page.mouse.up();
    // Then: Verify the expected result in the assertions below.
    await expect(surface).toBeVisible();
  }
  // When: Exercise `page.evaluate` with the prepared inputs.
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await surface.focus();
  await surface.press("End");
  // Then: Verify the expected result in the assertions below.
  await expect
    .poll(() => surface.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1))
    .toBe(true);
  await expect.poll(() => readViewMode(page)).toBe(true);
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  // When: Exercise `surface.press` with the prepared inputs.
  await surface.press("Home");
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
};

const verifyStudyViewModeControls = async (page: Page, uid: string, deckId: string) => {
  // Given: Prepare `viewModeButton` and any shared test state below.
  expect((await readSession(uid, deckId))?.currentIndex).toBe(0);
  const viewModeButton = page.getByRole("button", { name: "View mode", exact: true });
  // When: Exercise `page.getByRole("button", { name: "Open card actions" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Open card actions" }).click();
  await viewModeButton.click();
  // Then: Verify the expected result in the assertions below.
  await expect(viewModeButton).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => readViewMode(page)).toBe(true);
  // When: Exercise `page.getByRole("button", { name: "Close card actions" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Close card actions" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(viewModeButton).toHaveCount(0);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Open card actions" })).toBeVisible();
  await expect(viewModeButton).toHaveCount(0);
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deckId}/view`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Open card actions" })).toBeVisible();
  await expect(viewModeButton).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: "Open card actions" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Open card actions" }).click();
  await viewModeButton.click();
  await page.getByRole("button", { name: "Close card actions" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(viewModeButton).toHaveAttribute("title", "Exit view mode");
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deckId}/study`);
  // Then: Verify the expected result in the assertions below.
  await expect(viewModeButton).toBeVisible();

  // When: Exercise `page.getByRole("button", { name: "Open study help" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Open study help" }).click();
  // Then: Verify the expected result in the assertions below.
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
    // Given: Prepare `deck`, `card` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card("card-1");
    // When: Exercise `page.setViewportSize` with the prepared inputs.
    await page.setViewportSize({ width: 320, height: 568 });
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    const before = await readProgress(card.id);
    await enterViewMode(page);
    await readLongFront(page);
    // Then: Verify the expected result in the assertions below.
    await expect(page).toHaveURL(`/deck/${deck.id}/${scenario.route}`);
    await expect(page.getByRole("region", { name: "Card front text" })).toContainText(card.frontText);
    expect(await readProgress(card.id)).toEqual(before);
    // When: Exercise `verifyStudyViewModeControls` with the prepared inputs.
    if (scenario.route === "study") await verifyStudyViewModeControls(page, fixture.user().uid, deck.id);
  });
});

test.describe("View mode", () => {
  const scenario = { id: "NAVIGATION-20", route: "view", answer: "Card answer" };
  test("NAVIGATION-20 exits view mode with a tap or Enter before flipping the card", async ({ fixture, page }) => {
    // Given: Prepare `deck`, `card` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card("card-1");
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    await enterViewMode(page);
    // When: Apply the operation or event under test.
    await page.getByRole("region", { name: "Card front text" }).getByText(card.frontText, { exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect.poll(() => readViewMode(page)).toBe(false);
    await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    // When: Exercise `enterViewMode` with the prepared inputs.
    await enterViewMode(page);
    await page.getByRole("region", { name: "Card front text" }).focus();
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter");
    await page.keyboard.up("Enter");
    // Then: Verify the expected result in the assertions below.
    await expect.poll(() => readViewMode(page)).toBe(false);
    await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    // When: Exercise `page.keyboard.press` with the prepared inputs.
    await page.keyboard.press("Enter");
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("region", { name: scenario.answer })).toContainText(card.backText);
    // When: Apply the operation or event under test.
    await page.getByRole("region", { name: scenario.answer }).getByText(card.backText, { exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
  });
});

test.describe("View mode", () => {
  const scenario = { id: "NAVIGATION-21", route: "view", next: "Next card" };
  test("NAVIGATION-21 keeps button actions and autoplay available in view mode", async ({ fixture, page }) => {
    // Given: Prepare `deck`, `first`, `before` and any shared test state below.
    const deck = fixture.deck();
    const first = fixture.card("card-1");
    await fixture.apply(page, { preferences: { study: { cardInterval: 1 }, controls: { viewMode: true } } });
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    const before = await readProgress(first.id);
    // When: Exercise `page.getByRole("button", { name: scenario.next, exact: true }).click` with the prepared inputs.
    await page.getByRole("button", { name: scenario.next, exact: true }).click();
    const surface = page.getByRole("region", { name: "Card front text" });
    // Then: Verify the expected result in the assertions below.
    await expect(surface).toContainText(fixture.card("card-2").frontText);
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
    // When: Exercise `page.getByRole("button", { name: "Play", exact: true }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Play", exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect(surface).toContainText(fixture.card("card-3").frontText);
    // When: Exercise `page.getByRole("button", { name: "Pause", exact: true }).click` with the prepared inputs.
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    // Then: Verify the expected result in the assertions below.
    await expect.poll(() => readViewMode(page)).toBe(true);
    await expect
      .poll(() => readProgress(first.id))
      .toEqual(scenario.route === "view" ? before : { ...before, reps: 1 });
  });
});
