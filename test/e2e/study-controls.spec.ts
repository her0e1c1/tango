import { expect, getDocument, listDocuments, test } from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";
import { createAnonymousDeck, startAnonymousStudy } from "./utils/ui-helpers";
import type { Locator, Page } from "@playwright/test";

const swipeFrontUp = async (page: Page, frontText: string, button: "left" | "middle" | "right" = "left") => {
  const box = await page.getByRole("button", { name: frontText, exact: true }).boundingBox();
  if (box == null) throw new Error("Study card front is not visible");
  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + box.height * 0.5);
  await page.mouse.down({ button });
  await page.mouse.move(x, box.y + box.height * 0.2, { steps: 5 });
  await page.mouse.up({ button });
};

test("STUDY-CONTROLS-01 advances a remote session on a primary upward mouse drag without flipping", async ({
  fixture,
  page,
}) => {
  // Given: Prepare `deck`, `currentCard`, `nextCard` and any shared test state below.
  const deck = fixture.deck();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText);

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
});

test("STUDY-CONTROLS-02 ignores non-primary mouse drags", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `session`, `currentCard` and any shared test state below.
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText, "right");
  await swipeFrontUp(page, currentCard.frontText, "middle");

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex);
});

test("STUDY-CONTROLS-03 saves local-only progress and advances on a primary upward mouse drag", async ({
  fixture,
  page,
}) => {
  // Given: Prepare `local`, `frontText`, `currentCard` and any shared test state below.
  await fixture.apply(page);
  const local = await createAnonymousDeck(page);
  const { deck } = local;
  const frontText = await startAnonymousStudy(page, deck.id);
  const currentCard = frontText === local.first.frontText ? local.first : local.second;
  const nextCard = currentCard === local.first ? local.second : local.first;

  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText);

  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("1");
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/card/${currentCard.id}`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
});

test("STUDY-CONTROLS-04 shows configured Study controls without changing the active session", async ({
  fixture,
  page,
}) => {
  // Given: Prepare `deck`, `session`, `currentCard` and any shared test state below.
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  const progressBeforeHelp = await readProgress(currentCard.id);
  await expect(page.getByRole("button", { name: "Open study help" })).toBeVisible();
  // When: Exercise `page.getByRole("button", { name: "Open study help" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Open study help" }).click();

  const dialog = page.getByRole("dialog", { name: "Study controls" });
  // Then: Verify the expected result in the assertions below.
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Arrow Up / Swipe UpEnd the current session and return to the deck list");
  await expect(dialog).toContainText("Arrow Down / Swipe DownNo action");
  await expect(dialog).toContainText("Arrow Left / Swipe LeftHard — answer and continue");
  await expect(dialog).toContainText("Arrow Right / Swipe RightEasy — answer and continue");
  await expect(dialog).toContainText("Enter / Select CardFlip or reveal the current card");
  await expect(dialog).toContainText("Space / Play or Pause buttonPlay or pause autoplay");
  await expect(dialog).toContainText("B / Swipe controls buttonShow the currently hidden swipe buttons");
  await expect(dialog).toContainText("Playback controls buttonShow the currently hidden playback controls");
  await expect(dialog).toContainText("Card details buttonShow or hide FSRS difficulty and last review");
  await expect(dialog).toContainText("Back to deck list buttonExit without ending the current study session");

  const close = dialog.getByRole("button", { name: "Close help" });
  await expect(close).toBeFocused();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("Tab");
  // Then: Verify the expected result in the assertions below.
  await expect(close).toBeFocused();
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("b");

  // Then: Verify the expected result in the assertions below.
  await expect(dialog).toContainText("B / Swipe controls buttonShow the currently hidden swipe buttons");
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressBeforeHelp);
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex);

  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("Escape");

  // Then: Verify the expected result in the assertions below.
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Open study help" })).toBeFocused();
  await expect(page.getByRole("button", { name: /^Swipe left/ })).toHaveCount(0);
});

test("STUDY-CONTROLS-05 toggles and persists the Study Help button", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `help`, `actions` and any shared test state below.
  const deck = fixture.deck();
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  const help = page.getByRole("button", { name: "Open study help" });
  const actions = page.getByRole("button", { name: "Open card actions" });
  await expect(help).toBeVisible();
  await expect(actions).toBeVisible();
  const helpBounds = await help.boundingBox();
  const actionsBounds = await actions.boundingBox();
  expect(helpBounds).not.toBeNull();
  expect(actionsBounds).not.toBeNull();
  if (helpBounds === null || actionsBounds === null) throw new Error("Missing toolbar bounds");
  expect(helpBounds.x + helpBounds.width).toBeLessThanOrEqual(actionsBounds.x);

  // When: Exercise `actions.click` with the prepared inputs.
  await actions.click();
  await page.getByRole("button", { name: "Help button" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);

  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
  // When: Exercise `page.getByRole("button", { name: "Open card actions" }).click` with the prepared inputs.
  await page.getByRole("button", { name: "Open card actions" }).click();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Help button" })).toHaveAttribute("aria-pressed", "false");
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
  const scenario = { id: "STUDY-CONTROLS-06", route: "study" };
  test("STUDY-CONTROLS-06 scrolls the entire front without gesture actions or accidental exit", async ({
    fixture,
    page,
  }) => {
    // Given: Prepare `deck`, `card` and any shared test state below.
    const deck = fixture.deck();
    const card = fixture.card("card-1");

    await page.setViewportSize({ width: 320, height: 568 });
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    const before = await readProgress(card.id);
    await enterViewMode(page);
    // When: Scroll and drag through the long front text in View mode.
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
  const scenario = { id: "STUDY-CONTROLS-07", route: "study", answer: "Study answer" };
  test("STUDY-CONTROLS-07 exits view mode with a tap or Enter before flipping the card", async ({ fixture, page }) => {
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
  const scenario = { id: "STUDY-CONTROLS-08", route: "study", next: "Swipe right: Good" };
  test("STUDY-CONTROLS-08 keeps button actions and autoplay available in view mode", async ({ fixture, page }) => {
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

test("STUDY-CONTROLS-09 shares and persists view mode across Study and Deck viewing", async ({ fixture, page }) => {
  // Given: Prepare `deck` and any shared test state below.
  const deck = fixture.deck();
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
  await enterViewMode(page);
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
  // When: Exercise `page.goto` with the prepared inputs.
  await page.goto(`/deck/${deck.id}/view`);
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
  // When: Apply the operation or event under test.
  await page
    .getByRole("region", { name: "Card front text" })
    .getByText(fixture.card("card-1").frontText, { exact: true })
    .click();
  await page.goto(`/deck/${deck.id}/study`);
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: fixture.card("card-1").frontText, exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
  await expect.poll(() => readViewMode(page)).toBe(false);
});

test("STUDY-CONTROLS-10 keeps long text and all controls reachable on a short viewport", async ({ fixture, page }) => {
  // Given: Prepare `deck` and any shared test state below.
  const deck = fixture.deck();

  await page.setViewportSize({ width: 568, height: 320 });
  await fixture.apply(page, {
    preferences: {
      controls: {
        viewMode: true,
        showCardDetails: true,
        showSwipeButtonList: true,
        showPlaybackControls: true,
        showSkip: true,
      },
    },
  });
  await page.goto(`/deck/${deck.id}/study`);
  // When: Expand the controls and scroll the short viewport's reading surface.
  await page.getByRole("button", { name: "Open card actions" }).click();
  const surface = page.getByRole("region", { name: "Card front text" });
  await surface.scrollIntoViewIfNeeded();
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => surface.evaluate((element) => element.clientHeight)).toBeGreaterThanOrEqual(160);
  await expect(surface).toBeInViewport();
  // When: Exercise `surface.focus` with the prepared inputs.
  await surface.focus();
  await surface.press("End");
  // Then: Verify the expected result in the assertions below.
  await expect
    .poll(() => surface.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1))
    .toBe(true);
  for (const name of ["Swipe right: Good", "Play", "Skip"]) {
    // Given: Prepare `button` and any shared test state below.
    // When: Apply the operation or event under test.
    const button = page.getByRole("button", { name, exact: true });
    await button.scrollIntoViewIfNeeded();
    // Then: Verify the expected result in the assertions below.
    await expect(button).toBeInViewport();
  }
  await expect.poll(() => readViewMode(page)).toBe(true);
  expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
});

test("STUDY-CONTROLS-11 allows touch scrolling and pinch enlargement without card actions", async ({
  fixture,
  page,
}) => {
  // Given: Prepare `deck` and any shared test state below.
  const deck = fixture.deck();

  await page.setViewportSize({ width: 390, height: 844 });
  await fixture.apply(page, { preferences: { controls: { viewMode: true } } });
  await page.goto(`/deck/${deck.id}/study`);
  const surface = page.getByRole("region", { name: "Card front text" });
  // When: Touch-scroll the reading surface.
  await touchScroll(page, surface);
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  // Given: Measure the surface and configure touch emulation for the pinch gesture.
  const box = await surface.boundingBox();
  if (box === null) throw new Error("Missing reading surface");
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  const scale = await page.evaluate(() => window.visualViewport?.scale ?? 1);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  // When: Pinch outward from the prepared surface coordinates.
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 0, x: x - 30, y },
      { id: 1, x: x + 30, y },
    ],
  });
  for (const distance of [40, 55, 75, 100, 130]) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // When: Exercise `session.send` with the prepared inputs.
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { id: 0, x: x - distance, y },
        { id: 1, x: x + distance, y },
      ],
    });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => page.evaluate(() => window.visualViewport?.scale ?? 1)).toBeGreaterThan(scale);

  await session.detach();
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => readViewMode(page)).toBe(true);
  expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
});

for (const language of ["en", "ja"] as const) {
  for (const remapped of [false, true]) {
    test(`STUDY-CONTROLS-12 names the current direction actions (${language}, remapped=${remapped})`, async ({
      fixture,
      page,
    }) => {
      // Given: Prepare `deck`, `card`, `progress` and any shared test state below.
      const deck = fixture.deck();
      const card = fixture.card("card-1");
      await fixture.apply(page, {
        preferences: {
          language,
          ...(remapped
            ? {
                controls: {
                  cardSwipeUp: "GoBack",
                  cardSwipeDown: "DoNothing",
                  cardSwipeLeft: "GoToNextCard",
                  cardSwipeRight: "RateHard",
                },
              }
            : {}),
        },
      });
      // When: Open Study with the configured language and direction mappings.
      await page.goto(`/deck/${deck.id}/study`);
      await expect(page.getByRole("button", { name: card.frontText, exact: true })).toBeVisible();
      // Entering Study records its visit independently of the label-only interactions below.
      await expect.poll(async () => (await readSession(fixture.user().uid, deck.id))?.lastStudiedAt).toBeGreaterThan(0);
      const progress = await readProgress(card.id);
      const session = await readSession(fixture.user().uid, deck.id);
      const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
      const directions =
        language === "en"
          ? ["Swipe left", "Swipe up", "Swipe down", "Swipe right"]
          : ["左へスワイプ", "上へスワイプ", "下へスワイプ", "右へスワイプ"];
      const actions = remapped
        ? language === "en"
          ? ["Skip", "End session", "No action", "Hard"]
          : ["スキップ", "学習を終了", "何もしない", "Hard"]
        : ["Again", "Easy", "Hard", "Good"];
      const buttons = directions.map((direction, index) =>
        page.getByRole("button", { name: `${direction}: ${actions[index]}`, exact: true })
      );
      for (const [index, button] of buttons.entries()) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        // Then: Verify the expected result in the assertions below.
        await expect(button).toBeVisible();
        await expect(button).toHaveText(actions[index]!);
        await expect(button).toHaveAttribute("aria-description", actions[index]!);
      }
      await buttons[1]!.focus();
      // When: Exercise `page.keyboard.press` with the prepared inputs.
      await page.keyboard.press("Tab");
      // Then: Verify the expected result in the assertions below.
      await expect(buttons[remapped ? 3 : 2]!).toBeFocused();
      if (remapped) await expect(buttons[2]!).toBeDisabled();
      const help = page.getByRole("button", {
        name: language === "en" ? "Open study help" : "学習ヘルプを開く",
        exact: true,
      });
      // When: Exercise `help.click` with the prepared inputs.
      await help.click();
      const dialog = page.getByRole("dialog");
      const expectedHelp = remapped
        ? language === "en"
          ? [
              "End the current session and return to the deck list",
              "No action",
              "Go to the next card",
              "Hard — answer and continue",
            ]
          : [
              "現在の学習セッションを終了してデッキ一覧へ戻る",
              "何もしない",
              "次のカードへ移動",
              "Hard（難しい）で回答して次へ",
            ]
        : language === "en"
          ? [
              "Easy — answer and continue",
              "Hard — answer and continue",
              "Again — answer and continue",
              "Good — answer and continue",
            ]
          : [
              "Easy（簡単）で回答して次へ",
              "Hard（難しい）で回答して次へ",
              "Again（もう一度）で回答して次へ",
              "Good（普通）で回答して次へ",
            ];
      // Then: Verify the expected result in the assertions below.
      for (const text of expectedHelp) await expect(dialog).toContainText(text);
      await expect(dialog).toContainText(
        language === "en"
          ? "Exit without ending the current study session"
          : "現在の学習セッションを終了せずに画面を離れる"
      );
      // When: Exercise `page.keyboard.press` with the prepared inputs.
      await page.keyboard.press("Escape");
      // Then: Verify the expected result in the assertions below.
      await expect(help).toBeFocused();
      expect(await readProgress(card.id)).toEqual(progress);
      expect(await readSession(fixture.user().uid, deck.id)).toEqual(session);
      expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    });
  }
}

const readAnswers = async (sessionId: string) =>
  (await listDocuments("studyAnswer")).filter((item) => item.fields.sessionId?.stringValue === sessionId);

for (const [key, rating] of [
  ["ArrowUp", "easy"],
  ["ArrowDown", "hard"],
  ["ArrowLeft", "again"],
  ["ArrowRight", "good"],
] as const) {
  test(`STUDY-CONTROLS-13 ignores held ${key} after saving and accepts a fresh press`, async ({ fixture, page }) => {
    // Given: Prepare `deck`, `session`, `first` and any shared test state below.
    const deck = fixture.deck();
    const session = fixture.session();
    const first = fixture.card("card-1");
    const second = fixture.card("card-2");
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}/study`);
    await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
    // When: Exercise `page.keyboard.down` with the prepared inputs.
    await page.keyboard.down(key);
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByText(second.frontText, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Swipe right: Good" })).toBeEnabled();
    await expect.poll(() => readAnswers(session.sessionId)).toHaveLength(1);
    const savedSession = await readSession(fixture.user().uid, deck.id);
    const nextCard = await getDocument("card", second.id);
    const answers = await readAnswers(session.sessionId);
    expect(answers[0]?.fields.answer?.mapValue?.fields?.rating?.stringValue).toBe(rating);

    // When: Exercise `page.keyboard.down` with the prepared inputs.
    await page.keyboard.down(key);
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByText(second.frontText, { exact: true })).toBeVisible();
    expect(await readSession(fixture.user().uid, deck.id)).toEqual(savedSession);
    expect(await getDocument("card", second.id)).toEqual(nextCard);
    expect(await readAnswers(session.sessionId)).toEqual(answers);

    // When: Exercise `page.keyboard.up` with the prepared inputs.
    await page.keyboard.up(key);
    await page.keyboard.press(key);
    // Then: Verify the expected result in the assertions below.
    await expect(page.getByText(fixture.card("card-3").frontText, { exact: true })).toBeVisible();
    await expect.poll(() => readAnswers(session.sessionId)).toHaveLength(2);
    const nextAnswer = (await readAnswers(session.sessionId)).find(
      (item) => item.fields.cardId?.stringValue === second.id
    );
    expect(nextAnswer?.fields.answer?.mapValue?.fields?.rating?.stringValue).toBe(rating);
    await expect.poll(() => readProgress(second.id)).toEqual({ reps: 1 });
  });
}

test("STUDY-CONTROLS-14 toggles playback and swipe controls only on fresh presses", async ({ fixture, page }) => {
  // Given: Prepare `deck` and any shared test state below.
  const deck = fixture.deck();
  await fixture.apply(page, { preferences: { study: { cardInterval: 60 } } });
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  // When: Exercise `page.keyboard.down` with the prepared inputs.
  await page.keyboard.down("Space");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  // When: Exercise `page.keyboard.down` with the prepared inputs.
  await page.keyboard.down("Space");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  // When: Exercise `page.keyboard.up` with the prepared inputs.
  await page.keyboard.up("Space");
  await page.keyboard.press("Space");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  // When: Exercise `page.keyboard.down` with the prepared inputs.
  await page.keyboard.down("b");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Swipe right: Good" })).toHaveCount(0);
  // When: Exercise `page.keyboard.down` with the prepared inputs.
  await page.keyboard.down("b");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Swipe right: Good" })).toHaveCount(0);
  // When: Exercise `page.keyboard.up` with the prepared inputs.
  await page.keyboard.up("b");
  await page.keyboard.press("b");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("button", { name: "Swipe right: Good" })).toBeVisible();
  await expect(page.getByText(fixture.card("card-1").frontText, { exact: true })).toBeVisible();
  expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
  expect(await readAnswers(fixture.session().sessionId)).toHaveLength(0);
  expect(await readProgress(fixture.card("card-1").id)).toEqual({ reps: 0 });
});

// Dispatch at the browser boundary so OS-reserved shortcuts cannot disappear before reaching the app.
const sendModifiedKey = (
  page: Page,
  key: string,
  modifiers: Pick<KeyboardEventInit, "ctrlKey" | "metaKey" | "altKey" | "shiftKey">
) =>
  page.evaluate(
    ({ key, modifiers }) => {
      const event = new KeyboardEvent("keydown", { key, ...modifiers, bubbles: true, cancelable: true });
      let delivered = false;
      const observe = (received: KeyboardEvent) => {
        delivered = received === event;
      };
      window.addEventListener("keydown", observe);
      document.body.dispatchEvent(event);
      window.removeEventListener("keydown", observe);
      return { delivered, defaultPrevented: event.defaultPrevented };
    },
    { key, modifiers }
  );

const shortcutModifiers = [
  { ctrlKey: true },
  { metaKey: true },
  { altKey: true },
  { ctrlKey: true, shiftKey: true },
  { metaKey: true, shiftKey: true },
  { altKey: true, shiftKey: true },
];

test("STUDY-CONTROLS-15 ignores delivered modified keys and then accepts ordinary input", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `first`, `before` and any shared test state below.
  const deck = fixture.deck();
  const first = fixture.card("card-1");
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
  const before = await getDocument("card", first.id);
  const session = await readSession(fixture.user().uid, deck.id);
  for (const modifiers of shortcutModifiers) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " ", "b"]) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Evaluate `sendModifiedKey` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      expect(await sendModifiedKey(page, key, modifiers)).toEqual({ delivered: true, defaultPrevented: false });
      await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Swipe right: Good" })).toBeVisible();
    }
  }
  expect(await getDocument("card", first.id)).toEqual(before);
  expect(await readSession(fixture.user().uid, deck.id)).toEqual(session);
  expect(await readAnswers(fixture.session().sessionId)).toHaveLength(0);
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("Enter");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("region", { name: "Study answer" })).toContainText(first.backText);
  // When: Exercise `page.keyboard.press` with the prepared inputs.
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(fixture.card("card-2").frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readAnswers(fixture.session().sessionId)).toHaveLength(1);
  expect(
    (await readAnswers(fixture.session().sessionId))[0]?.fields.answer?.mapValue?.fields?.rating?.stringValue
  ).toBe("good");
});

test("STUDY-CONTROLS-16 keeps view mode persisted until an unmodified Enter", async ({ fixture, page }) => {
  // Given: Prepare `deck`, `surface` and any shared test state below.
  const deck = fixture.deck();
  await fixture.apply(page, { preferences: { controls: { viewMode: true } } });
  await page.goto(`/deck/${deck.id}/study`);
  const surface = page.getByRole("region", { name: "Card front text" });
  await expect(surface).toBeVisible();
  for (const modifiers of shortcutModifiers) {
    // Given: Use the current iteration or branch inputs from the enclosing case.
    // When: Evaluate `sendModifiedKey` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(await sendModifiedKey(page, "Enter", modifiers)).toEqual({ delivered: true, defaultPrevented: false });
    await expect(surface).toBeVisible();
    expect(await readViewMode(page)).toBe(true);
  }
  // When: Exercise `page.reload` with the prepared inputs.
  await page.reload();
  // Then: Verify the expected result in the assertions below.
  await expect(surface).toBeVisible();
  // When: Exercise `surface.focus` with the prepared inputs.
  await surface.focus();
  await page.keyboard.down("Enter");
  // Then: Verify the expected result in the assertions below.
  await expect.poll(() => readViewMode(page)).toBe(false);
  // When: Exercise `page.keyboard.down` with the prepared inputs.
  await page.keyboard.down("Enter");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByText(fixture.card("card-1").frontText, { exact: true })).toBeVisible();
  // When: Exercise `page.keyboard.up` with the prepared inputs.
  await page.keyboard.up("Enter");
  await page.keyboard.press("Enter");
  // Then: Verify the expected result in the assertions below.
  await expect(page.getByRole("region", { name: "Study answer" })).toBeVisible();
  expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
  expect(await readAnswers(fixture.session().sessionId)).toHaveLength(0);
  expect(await readProgress(fixture.card("card-1").id)).toEqual({ reps: 0 });
});
