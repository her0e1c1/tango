import { expect, test } from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";
import { createAnonymousDeck, startAnonymousStudy } from "./utils/ui-helpers";
import { type Locator, type Page } from "@playwright/test";

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
  const deck = fixture.deck();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText);

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
});

test("STUDY-CONTROLS-02 ignores non-primary mouse drags", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText, "right");
  await swipeFrontUp(page, currentCard.frontText, "middle");

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
  await fixture.apply(page);
  const local = await createAnonymousDeck(page);
  const { deck } = local;
  const frontText = await startAnonymousStudy(page, deck.id);
  const currentCard = frontText === local.first.frontText ? local.first : local.second;
  const nextCard = currentCard === local.first ? local.second : local.first;

  await page.goto(`/deck/${deck.id}/study`);
  await swipeFrontUp(page, currentCard.frontText);

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("1");
  await page.goto(`/card/${currentCard.id}`);
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
});

test("STUDY-CONTROLS-04 shows configured Study controls without changing the active session", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  const progressBeforeHelp = await readProgress(currentCard.id);
  await expect(page.getByRole("button", { name: "Open study help" })).toBeVisible();
  await page.getByRole("button", { name: "Open study help" }).click();

  const dialog = page.getByRole("dialog", { name: "Study controls" });
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
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("b");

  await expect(dialog).toContainText("B / Swipe controls buttonShow the currently hidden swipe buttons");
  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressBeforeHelp);
  await expect
    .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
    .toBe(session.currentIndex);

  await page.keyboard.press("Escape");

  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Open study help" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Swipe left" })).toHaveCount(0);
});

test("STUDY-CONTROLS-05 toggles and persists the Study Help button", async ({ fixture, page }) => {
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

  await actions.click();
  await page.getByRole("button", { name: "Help button" }).click();
  await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open card actions" }).click();
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
  const scenario = { id: "STUDY-CONTROLS-06", route: "study" };
  test("STUDY-CONTROLS-06 scrolls the entire front without gesture actions or accidental exit", async ({
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
  const scenario = { id: "STUDY-CONTROLS-07", route: "study", answer: "Study answer" };
  test("STUDY-CONTROLS-07 exits view mode with a tap or Enter before flipping the card", async ({ fixture, page }) => {
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
  const scenario = { id: "STUDY-CONTROLS-08", route: "study", next: "Swipe right" };
  test("STUDY-CONTROLS-08 keeps button actions and autoplay available in view mode", async ({ fixture, page }) => {
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

test("STUDY-CONTROLS-09 shares and persists view mode across Study and Deck viewing", async ({ fixture, page }) => {
  const deck = fixture.deck();
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
  await enterViewMode(page);
  await page.reload();
  await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
  await page.goto(`/deck/${deck.id}/view`);
  await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
  await page
    .getByRole("region", { name: "Card front text" })
    .getByText(fixture.card("card-1").frontText, { exact: true })
    .click();
  await page.goto(`/deck/${deck.id}/study`);
  await page.reload();
  await expect(page.getByRole("button", { name: fixture.card("card-1").frontText, exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
  await expect.poll(() => readViewMode(page)).toBe(false);
});

test("STUDY-CONTROLS-10 keeps long text and all controls reachable on a short viewport", async ({ fixture, page }) => {
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
  await page.getByRole("button", { name: "Open card actions" }).click();
  const surface = page.getByRole("region", { name: "Card front text" });
  await surface.scrollIntoViewIfNeeded();
  await expect.poll(() => surface.evaluate((element) => element.clientHeight)).toBeGreaterThanOrEqual(160);
  await expect(surface).toBeInViewport();
  await surface.focus();
  await surface.press("End");
  await expect
    .poll(() => surface.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1))
    .toBe(true);
  for (const name of ["Swipe right", "Play", "Skip"]) {
    const button = page.getByRole("button", { name, exact: true });
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeInViewport();
  }
  await expect.poll(() => readViewMode(page)).toBe(true);
  expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
});

test("STUDY-CONTROLS-11 allows touch scrolling and pinch enlargement without card actions", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture.apply(page, { preferences: { controls: { viewMode: true } } });
  await page.goto(`/deck/${deck.id}/study`);
  const surface = page.getByRole("region", { name: "Card front text" });
  await touchScroll(page, surface);
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
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
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 0, x: x - 30, y },
      { id: 1, x: x + 30, y },
    ],
  });
  for (const distance of [40, 55, 75, 100, 130]) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { id: 0, x: x - distance, y },
        { id: 1, x: x + distance, y },
      ],
    });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.visualViewport?.scale ?? 1)).toBeGreaterThan(scale);
  await session.detach();
  await expect.poll(() => readViewMode(page)).toBe(true);
  expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
});
