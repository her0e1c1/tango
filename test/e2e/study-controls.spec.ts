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
  const { deck, currentCard, nextCard } =
    await test.step("Given: An unanswered remote study card with a following card", async () => {
      const deck = fixture.deck();
      const currentCard = fixture.card("card-1");
      const nextCard = fixture.card("card-2");
      await fixture.apply(page);
      return { deck, currentCard, nextCard };
    });
  await test.step("When: Open study and drag the card upward with the primary mouse button", async () => {
    await page.goto(`/deck/${deck.id}/study`);
    await swipeFrontUp(page, currentCard.frontText);
  });
  await test.step("Then: Good progress saves and the next card front appears", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
    await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
  });
});

test("STUDY-CONTROLS-02 ignores non-primary mouse drags", async ({ fixture, page }) => {
  const { deck, session, currentCard } =
    await test.step("Given: A remote study session with unchanged current progress", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      await fixture.apply(page);
      return { deck, session, currentCard };
    });
  await test.step("When: Open study and drag with the secondary and middle mouse buttons", async () => {
    await page.goto(`/deck/${deck.id}/study`);
    await swipeFrontUp(page, currentCard.frontText, "right");
    await swipeFrontUp(page, currentCard.frontText, "middle");
  });
  await test.step("Then: Non-primary drags leave the current card and session unchanged", async () => {
    await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex);
  });
});

test("STUDY-CONTROLS-03 saves local-only progress and advances on a primary upward mouse drag", async ({
  fixture,
  page,
}) => {
  const { deck, currentCard, nextCard } =
    await test.step("Given: An anonymous study session with two local cards", async () => {
      await fixture.apply(page);
      const local = await createAnonymousDeck(page);
      const { deck } = local;
      const frontText = await startAnonymousStudy(page, deck.id);
      const currentCard = frontText === local.first.frontText ? local.first : local.second;
      const nextCard = currentCard === local.first ? local.second : local.first;
      return { deck, currentCard, nextCard };
    });
  await test.step("When: Open study and drag the current card upward", async () => {
    await page.goto(`/deck/${deck.id}/study`);
    await swipeFrontUp(page, currentCard.frontText);
  });
  await test.step("Then: The next local card front appears at the saved position", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
    await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("1");
  });
  await test.step("When: Open the rated local card", async () => {
    await page.goto(`/card/${currentCard.id}`);
  });
  await test.step("Then: Its FSRS memory records the rating", async () => {
    await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  });
});

test("STUDY-CONTROLS-04 shows configured Study controls without changing the active session", async ({
  fixture,
  page,
}) => {
  const { deck, session, currentCard, progressBeforeHelp } =
    await test.step("Given: An active session with configured controls and hidden swipe buttons", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      await fixture.apply(page);

      await page.goto(`/deck/${deck.id}/study`);
      const progressBeforeHelp = await readProgress(currentCard.id);
      await expect(page.getByRole("button", { name: "Open study help" })).toBeVisible();
      return { deck, session, currentCard, progressBeforeHelp };
    });
  await test.step("When: Open Study Help", async () => {
    await page.getByRole("button", { name: "Open study help" }).click();
  });
  const { dialog, close } =
    await test.step("Then: Help describes the configured actions and initially focuses Close", async () => {
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
      return { dialog, close };
    });
  await test.step("When: Tab inside the help dialog", async () => {
    await page.keyboard.press("Tab");
  });
  await test.step("Then: Focus stays within the dialog", async () => {
    await expect(close).toBeFocused();
  });
  await test.step("When: Try study shortcuts while help is open", async () => {
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("b");
  });
  await test.step("Then: Help blocks shortcuts without changing progress or position", async () => {
    await expect(dialog).toContainText("B / Swipe controls buttonShow the currently hidden swipe buttons");
    await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
    await expect.poll(() => readProgress(currentCard.id)).toEqual(progressBeforeHelp);
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex);
  });
  await test.step("When: Close help with Escape", async () => {
    await page.keyboard.press("Escape");
  });
  await test.step("Then: Focus returns to Help and swipe buttons stay hidden", async () => {
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Open study help" })).toBeFocused();
    await expect(page.getByRole("button", { name: /^Swipe left/ })).toHaveCount(0);
  });
});

test("STUDY-CONTROLS-05 toggles and persists the Study Help button", async ({ fixture, page }) => {
  const { actions } =
    await test.step("Given: Study Help and card actions are visible without overlapping", async () => {
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
      return { actions };
    });
  await test.step("When: Hide the Help button through card actions", async () => {
    await actions.click();
    await page.getByRole("button", { name: "Help button" }).click();
  });
  await test.step("Then: The Help button is removed", async () => {
    await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
  });
  await test.step("When: Reload study", async () => {
    await page.reload();
  });
  await test.step("Then: Help stays hidden", async () => {
    await expect(page.getByRole("button", { name: "Open study help" })).toHaveCount(0);
  });
  await test.step("When: Reopen card actions", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
  });
  await test.step("Then: The Help toggle restores its disabled state", async () => {
    await expect(page.getByRole("button", { name: "Help button" })).toHaveAttribute("aria-pressed", "false");
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
  const scenario = { id: "STUDY-CONTROLS-06", route: "study" };
  test("STUDY-CONTROLS-06 scrolls the entire front without gesture actions or accidental exit", async ({
    fixture,
    page,
  }) => {
    const { deck, card, before } =
      await test.step("Given: A long study card front open in reading mode on a narrow viewport", async () => {
        const deck = fixture.deck();
        const card = fixture.card("card-1");

        await page.setViewportSize({ width: 320, height: 568 });
        await fixture.apply(page);
        await page.goto(`/deck/${deck.id}/${scenario.route}`);
        const before = await readProgress(card.id);
        await enterViewMode(page);
        return { deck, card, before };
      });
    await test.step("When: Scroll, select and drag through the entire readable front", async () => {
      await readLongFront(page);
    });
    await test.step("Then: Reading preserves the route, card content and saved progress", async () => {
      await expect(page).toHaveURL(`/deck/${deck.id}/${scenario.route}`);
      await expect(page.getByRole("region", { name: "Card front text" })).toContainText(card.frontText);
      expect(await readProgress(card.id)).toEqual(before);
    });
    await test.step("When: Use the existing Study reading-mode controls workflow", async () => {
      if (scenario.route === "study") await verifyStudyViewModeControls(page, fixture.user().uid, deck.id);
    });
  });
});

test.describe("View mode", () => {
  const scenario = { id: "STUDY-CONTROLS-07", route: "study", answer: "Study answer" };
  test("STUDY-CONTROLS-07 exits view mode with a tap or Enter before flipping the card", async ({ fixture, page }) => {
    const { card } = await test.step("Given: A study card front open in reading mode", async () => {
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
    await test.step("When: Reenter reading mode and hold Enter through repeated keydown", async () => {
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
    await test.step("Then: The study answer appears", async () => {
      await expect(page.getByRole("region", { name: scenario.answer })).toContainText(card.backText);
    });
    await test.step("When: Click the revealed study answer", async () => {
      await page.getByRole("region", { name: scenario.answer }).getByText(card.backText, { exact: true }).click();
    });
    await test.step("Then: The answer closes", async () => {
      await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    });
  });
});

test.describe("View mode", () => {
  const scenario = { id: "STUDY-CONTROLS-08", route: "study", next: "Swipe right: Good" };
  test("STUDY-CONTROLS-08 keeps button actions and autoplay available in view mode", async ({ fixture, page }) => {
    const { first, before } =
      await test.step("Given: Study uses reading mode and a positive autoplay interval", async () => {
        const deck = fixture.deck();
        const first = fixture.card("card-1");
        await fixture.apply(page, { preferences: { study: { cardInterval: 1 }, controls: { viewMode: true } } });
        await page.goto(`/deck/${deck.id}/${scenario.route}`);
        const before = await readProgress(first.id);
        return { first, before };
      });
    await test.step("When: Rate the current readable card with the configured button", async () => {
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
    await test.step("Then: Autoplay advances to the following card", async () => {
      await expect(surface).toContainText(fixture.card("card-3").frontText);
    });
    await test.step("When: Pause autoplay", async () => {
      await page.getByRole("button", { name: "Pause", exact: true }).click();
    });
    await test.step("Then: Reading mode remains active with only the expected progress change", async () => {
      await expect.poll(() => readViewMode(page)).toBe(true);
      await expect
        .poll(() => readProgress(first.id))
        .toEqual(scenario.route === "view" ? before : { ...before, reps: 1 });
    });
  });
});

test("STUDY-CONTROLS-09 shares and persists view mode across Study and Deck viewing", async ({ fixture, page }) => {
  const { deck } = await test.step("Given: Reading mode has been enabled from an ordinary study card", async () => {
    const deck = fixture.deck();
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}/study`);
    await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
    await enterViewMode(page);
    return { deck };
  });
  await test.step("When: Reload Study", async () => {
    await page.reload();
  });
  await test.step("Then: Reading mode is restored", async () => {
    await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
  });
  await test.step("When: Open the same deck in View mode", async () => {
    await page.goto(`/deck/${deck.id}/view`);
  });
  await test.step("Then: Reading mode is shared with deck browsing", async () => {
    await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
  });
  await test.step("When: Exit reading mode in View and reopen Study after reload", async () => {
    await page
      .getByRole("region", { name: "Card front text" })
      .getByText(fixture.card("card-1").frontText, { exact: true })
      .click();
    await page.goto(`/deck/${deck.id}/study`);
    await page.reload();
  });
  await test.step("Then: Ordinary study controls return and the reading preference is disabled", async () => {
    await expect(page.getByRole("button", { name: fixture.card("card-1").frontText, exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
    await expect.poll(() => readViewMode(page)).toBe(false);
  });
});

test("STUDY-CONTROLS-10 keeps long text and all controls reachable on a short viewport", async ({ fixture, page }) => {
  const { deck } =
    await test.step("Given: A short viewport with long text and all study controls enabled", async () => {
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
      return { deck };
    });
  await test.step("When: Expand card actions and scroll to the reading surface", async () => {
    await page.getByRole("button", { name: "Open card actions" }).click();
  });
  const { surface } =
    await test.step("Then: The reading surface retains a usable height inside the viewport", async () => {
      const surface = page.getByRole("region", { name: "Card front text" });
      await surface.scrollIntoViewIfNeeded();
      await expect.poll(() => surface.evaluate((element) => element.clientHeight)).toBeGreaterThanOrEqual(160);
      await expect(surface).toBeInViewport();
      return { surface };
    });
  await test.step("When: Focus the reading surface and move to End", async () => {
    await surface.focus();
    await surface.press("End");
  });
  await test.step("Then: The entire long front can be reached", async () => {
    await expect
      .poll(() => surface.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1))
      .toBe(true);
  });
  for (const name of ["Swipe right: Good", "Play", "Skip"]) {
    const { button } = await test.step("When: Scroll the current study control into view", async () => {
      const button = page.getByRole("button", { name, exact: true });
      await button.scrollIntoViewIfNeeded();
      return { button };
    });
    await test.step("Then: The current control remains reachable", async () => {
      await expect(button).toBeInViewport();
    });
  }
  await test.step("Then: Reading stays enabled without advancing the session", async () => {
    await expect.poll(() => readViewMode(page)).toBe(true);
    expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
  });
});

test("STUDY-CONTROLS-11 allows touch scrolling and pinch enlargement without card actions", async ({
  fixture,
  page,
}) => {
  const { deck, surface } = await test.step("Given: A mobile study card front open in reading mode", async () => {
    const deck = fixture.deck();

    await page.setViewportSize({ width: 390, height: 844 });
    await fixture.apply(page, { preferences: { controls: { viewMode: true } } });
    await page.goto(`/deck/${deck.id}/study`);
    const surface = page.getByRole("region", { name: "Card front text" });
    return { deck, surface };
  });
  await test.step("When: Touch-scroll the reading surface", async () => {
    await touchScroll(page, surface);
  });
  await test.step("Then: The reading surface scrolls", async () => {
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  });
  const { session, scale, x, y } =
    await test.step("Given: The reading surface geometry and mobile touch context are ready to pinch", async () => {
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
      return { session, scale, x, y };
    });
  await test.step("When: Pinch outward across the reading surface", async () => {
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
  });
  await test.step("Then: The viewport enlarges without changing reading mode or position", async () => {
    await expect.poll(() => page.evaluate(() => window.visualViewport?.scale ?? 1)).toBeGreaterThan(scale);

    await session.detach();
    await expect.poll(() => readViewMode(page)).toBe(true);
    expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
  });
});

for (const language of ["en", "ja"] as const) {
  for (const remapped of [false, true]) {
    test(`STUDY-CONTROLS-12 names the current direction actions (${language}, remapped=${remapped})`, async ({
      fixture,
      page,
    }) => {
      const { deck, card } =
        await test.step("Given: A study deck with the scenario language and direction mappings", async () => {
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
          return { deck, card };
        });
      const { progress, session, preferences, actions, buttons } =
        await test.step("When: Open Study and record its settled entry baseline", async () => {
          await page.goto(`/deck/${deck.id}/study`);
          await expect(page.getByRole("button", { name: card.frontText, exact: true })).toBeVisible();
          // Entering Study records its visit independently of the label-only interactions below.
          await expect
            .poll(async () => (await readSession(fixture.user().uid, deck.id))?.lastStudiedAt)
            .toBeGreaterThan(0);
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
          return { progress, session, preferences, actions, buttons };
        });
      await test.step("Then: Direction buttons expose the current action names and descriptions", async () => {
        for (const [index, button] of buttons.entries()) {
          await expect(button).toBeVisible();
          await expect(button).toHaveText(actions[index]!);
          await expect(button).toHaveAttribute("aria-description", actions[index]!);
        }
      });
      await test.step("When: Move keyboard focus to the next enabled direction action", async () => {
        await buttons[1]!.focus();
        await page.keyboard.press("Tab");
      });
      const { help } = await test.step("Then: Focus skips disabled actions when mappings require it", async () => {
        await expect(buttons[remapped ? 3 : 2]!).toBeFocused();
        if (remapped) await expect(buttons[2]!).toBeDisabled();
        const help = page.getByRole("button", {
          name: language === "en" ? "Open study help" : "学習ヘルプを開く",
          exact: true,
        });
        return { help };
      });
      await test.step("When: Open Study Help", async () => {
        await help.click();
      });
      await test.step("Then: Help describes each mapped action and leaving the current session", async () => {
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
        for (const text of expectedHelp) await expect(dialog).toContainText(text);
        await expect(dialog).toContainText(
          language === "en"
            ? "Exit without ending the current study session"
            : "現在の学習セッションを終了せずに画面を離れる"
        );
      });
      await test.step("When: Dismiss help with Escape", async () => {
        await page.keyboard.press("Escape");
      });
      await test.step("Then: Focus returns without changing progress, session or preferences", async () => {
        await expect(help).toBeFocused();
        expect(await readProgress(card.id)).toEqual(progress);
        expect(await readSession(fixture.user().uid, deck.id)).toEqual(session);
        expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
      });
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
    const { deck, session, second } =
      await test.step("Given: A study session with an unanswered first card", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const first = fixture.card("card-1");
        const second = fixture.card("card-2");
        await fixture.apply(page);
        await page.goto(`/deck/${deck.id}/study`);
        await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
        return { deck, session, second };
      });
    await test.step("When: Press and hold the configured rating key", async () => {
      await page.keyboard.down(key);
    });
    const { savedSession, nextCard, answers } =
      await test.step("Then: One answer saves and the next card becomes ready", async () => {
        await expect(page.getByText(second.frontText, { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Swipe right: Good" })).toBeEnabled();
        await expect.poll(() => readAnswers(session.sessionId)).toHaveLength(1);
        const savedSession = await readSession(fixture.user().uid, deck.id);
        const nextCard = await getDocument("card", second.id);
        const answers = await readAnswers(session.sessionId);
        expect(answers[0]?.fields.answer?.mapValue?.fields?.rating?.stringValue).toBe(rating);
        return { savedSession, nextCard, answers };
      });
    await test.step("When: Repeat keydown without releasing the held key", async () => {
      await page.keyboard.down(key);
    });
    await test.step("Then: No second answer or saved-state change occurs", async () => {
      await expect(page.getByText(second.frontText, { exact: true })).toBeVisible();
      expect(await readSession(fixture.user().uid, deck.id)).toEqual(savedSession);
      expect(await getDocument("card", second.id)).toEqual(nextCard);
      expect(await readAnswers(session.sessionId)).toEqual(answers);
    });
    await test.step("When: Release the held key and press it freshly", async () => {
      await page.keyboard.up(key);
      await page.keyboard.press(key);
    });
    await test.step("Then: The next card is rated once with the configured rating", async () => {
      await expect(page.getByText(fixture.card("card-3").frontText, { exact: true })).toBeVisible();
      await expect.poll(() => readAnswers(session.sessionId)).toHaveLength(2);
      const nextAnswer = (await readAnswers(session.sessionId)).find(
        (item) => item.fields.cardId?.stringValue === second.id
      );
      expect(nextAnswer?.fields.answer?.mapValue?.fields?.rating?.stringValue).toBe(rating);
      await expect.poll(() => readProgress(second.id)).toEqual({ reps: 1 });
    });
  });
}

test("STUDY-CONTROLS-14 toggles playback and swipe controls only on fresh presses", async ({ fixture, page }) => {
  const { deck } =
    await test.step("Given: A study session with playback stopped and swipe controls visible", async () => {
      const deck = fixture.deck();
      await fixture.apply(page, { preferences: { study: { cardInterval: 60 } } });
      await page.goto(`/deck/${deck.id}/study`);
      await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
      return { deck };
    });
  await test.step("When: Press and hold Space", async () => {
    await page.keyboard.down("Space");
  });
  await test.step("Then: Autoplay starts", async () => {
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  });
  await test.step("When: Repeat Space keydown without releasing it", async () => {
    await page.keyboard.down("Space");
  });
  await test.step("Then: Autoplay remains active", async () => {
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  });
  await test.step("When: Release Space and press it freshly", async () => {
    await page.keyboard.up("Space");
    await page.keyboard.press("Space");
  });
  await test.step("Then: Autoplay pauses", async () => {
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  });
  await test.step("When: Press and hold the swipe-controls shortcut", async () => {
    await page.keyboard.down("b");
  });
  await test.step("Then: Swipe buttons are hidden", async () => {
    await expect(page.getByRole("button", { name: "Swipe right: Good" })).toHaveCount(0);
  });
  await test.step("When: Repeat the shortcut keydown without releasing it", async () => {
    await page.keyboard.down("b");
  });
  await test.step("Then: Swipe buttons remain hidden", async () => {
    await expect(page.getByRole("button", { name: "Swipe right: Good" })).toHaveCount(0);
  });
  await test.step("When: Release the shortcut and press it freshly", async () => {
    await page.keyboard.up("b");
    await page.keyboard.press("b");
  });
  await test.step("Then: Swipe buttons return without recording an answer or advancing", async () => {
    await expect(page.getByRole("button", { name: "Swipe right: Good" })).toBeVisible();
    await expect(page.getByText(fixture.card("card-1").frontText, { exact: true })).toBeVisible();
    expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
    expect(await readAnswers(fixture.session().sessionId)).toHaveLength(0);
    expect(await readProgress(fixture.card("card-1").id)).toEqual({ reps: 0 });
  });
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
  const { deck, first, before, session } =
    await test.step("Given: Study entry persistence has settled before card and session baselines", async () => {
      const deck = fixture.deck();
      const first = fixture.card("card-1");
      await fixture.apply(page);
      await page.goto(`/deck/${deck.id}/study`);
      await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
      // Wait for entry persistence so it cannot change the baseline during ignored-key checks.
      await expect.poll(async () => (await readSession(fixture.user().uid, deck.id))?.lastStudiedAt).toBeGreaterThan(0);
      const before = await getDocument("card", first.id);
      const session = await readSession(fixture.user().uid, deck.id);
      return { deck, first, before, session };
    });
  for (const modifiers of shortcutModifiers) {
    for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " ", "b"]) {
      const delivery =
        await test.step(`When: Deliver ${JSON.stringify(key)} with ${JSON.stringify(modifiers)}`, async () =>
          sendModifiedKey(page, key, modifiers));
      await test.step("Then: Modified shortcuts are delivered and ignored", async () => {
        expect(delivery).toEqual({ delivered: true, defaultPrevented: false });
        await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Swipe right: Good" })).toBeVisible();
      });
    }
  }
  await test.step("Then: All modified shortcuts leave saved card, session and answer history unchanged", async () => {
    expect(await getDocument("card", first.id)).toEqual(before);
    expect(await readSession(fixture.user().uid, deck.id)).toEqual(session);
    expect(await readAnswers(fixture.session().sessionId)).toHaveLength(0);
  });
  await test.step("When: Reveal the answer with ordinary Enter", async () => {
    await page.keyboard.press("Enter");
  });
  await test.step("Then: The current card answer appears", async () => {
    await expect(page.getByRole("region", { name: "Study answer" })).toContainText(first.backText);
  });
  await test.step("When: Close the answer and rate the card with an ordinary ArrowRight", async () => {
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowRight");
  });
  await test.step("Then: One Good answer saves and study advances", async () => {
    await expect(page.getByText(fixture.card("card-2").frontText, { exact: true })).toBeVisible();
    await expect.poll(() => readAnswers(fixture.session().sessionId)).toHaveLength(1);
    expect(
      (await readAnswers(fixture.session().sessionId))[0]?.fields.answer?.mapValue?.fields?.rating?.stringValue
    ).toBe("good");
  });
});

test("STUDY-CONTROLS-16 keeps view mode persisted until an unmodified Enter", async ({ fixture, page }) => {
  const { deck, surface } = await test.step("Given: A study card front open with reading mode persisted", async () => {
    const deck = fixture.deck();
    await fixture.apply(page, { preferences: { controls: { viewMode: true } } });
    await page.goto(`/deck/${deck.id}/study`);
    const surface = page.getByRole("region", { name: "Card front text" });
    await expect(surface).toBeVisible();
    return { deck, surface };
  });
  for (const modifiers of shortcutModifiers) {
    const delivery = await test.step(`When: Deliver Enter with ${JSON.stringify(modifiers)}`, async () =>
      sendModifiedKey(page, "Enter", modifiers));
    await test.step("Then: Modified Enter leaves the readable front and preference unchanged", async () => {
      expect(delivery).toEqual({ delivered: true, defaultPrevented: false });
      await expect(surface).toBeVisible();
      expect(await readViewMode(page)).toBe(true);
    });
  }
  await test.step("When: Reload study after the modified shortcuts", async () => {
    await page.reload();
  });
  await test.step("Then: Reading mode remains visible", async () => {
    await expect(surface).toBeVisible();
  });
  await test.step("When: Focus the reading surface and press Enter", async () => {
    await surface.focus();
    await page.keyboard.down("Enter");
  });
  await test.step("Then: Ordinary Enter exits reading mode", async () => {
    await expect.poll(() => readViewMode(page)).toBe(false);
  });
  await test.step("When: Repeat Enter keydown without releasing it", async () => {
    await page.keyboard.down("Enter");
  });
  await test.step("Then: The current card stays unflipped", async () => {
    await expect(page.getByText(fixture.card("card-1").frontText, { exact: true })).toBeVisible();
  });
  await test.step("When: Release Enter and press it freshly", async () => {
    await page.keyboard.up("Enter");
    await page.keyboard.press("Enter");
  });
  await test.step("Then: The answer appears without advancing or recording an answer", async () => {
    await expect(page.getByRole("region", { name: "Study answer" })).toBeVisible();
    expect((await readSession(fixture.user().uid, deck.id))?.currentIndex).toBe(0);
    expect(await readAnswers(fixture.session().sessionId)).toHaveLength(0);
    expect(await readProgress(fixture.card("card-1").id)).toEqual({ reps: 0 });
  });
});
