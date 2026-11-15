import type { Locator, Page } from "@playwright/test";
import type { Deck } from "@/entities/deck/model/types";
import type { Card } from "@/entities/card/model/types";
import type { StudySession } from "@/entities/study-session/model/types";
import type { StudyAnswerInput } from "@/entities/study-answer/model/types";
import type { E2EConfigOverrides } from "../../e2e/utils/fixtures";
import { loadNamedFixtureSource, namespaceFixture } from "../../e2e/utils/yaml-fixture";
import { test, expect, callScenario, readEvents } from "./fixtures";

type Snapshot = {
  cards: Card[];
  sessions: Record<string, Omit<StudySession, "remote">>;
  preferences: unknown;
  decks: Deck[];
};
const snapshot = (page: Page) => callScenario<Snapshot>(page, "conditions", "snapshot");
const readCard = async (page: Page, id: string) => (await snapshot(page)).cards.find((card) => card.id === id);
const readProgress = async (page: Page, id: string) => ({ reps: (await readCard(page, id))?.fsrs?.reps ?? 0 });
const readSession = async (page: Page, _uid: string, deckId: string) => (await snapshot(page)).sessions[deckId];
const readAnswers = async (page: Page, sessionId: string) =>
  (await readEvents(page))
    .filter((event) => event.name === "writeStudyAnswer")
    .map((event) => event.args[0] as StudyAnswerInput)
    .filter((answer) => answer.sessionId === sessionId);

async function goto(page: Page, path: string) {
  await page.goto(path);
  await page.locator("#root > *").first().waitFor();
}

async function reload(page: Page) {
  await page.reload();
  await page.locator("#root > *").first().waitFor();
}

function createFixture(name: string, anonymous = false) {
  const value = namespaceFixture(loadNamedFixtureSource(name), { uid: "conditions-user", id: (name) => name });
  if (anonymous) {
    value.state.auth.users = [{ uid: "conditions-user", provider: "anonymous" }];
    value.state.remote.cards = value.state.remote.cards.slice(0, 2);
    for (const session of Object.values(value.state.remote.studySessions))
      session.cardOrderIds = session.cardOrderIds.slice(0, 2);
  }
  function required<T>(values: ReadonlyMap<string, T>, id?: string): T {
    const item = id === undefined ? values.values().next().value : values.get(id);
    if (item === undefined) throw new Error(`Missing fixture value: ${id}`);
    return item;
  }
  return {
    ...value,
    deck: (id?: string) => required(value.decks, id),
    card: (id?: string) => required(value.cards, id),
    session: (id?: string) => required(value.sessions, id),
    user: (id?: string) => required(value.users, id),
    apply: async (
      page: Page,
      options: { preferences?: E2EConfigOverrides; invalidCardIds?: string[]; recovery?: boolean } = {}
    ) => {
      const defaults = value.state.browser.preferences;
      const overrides = options.preferences;
      const state = {
        ...value.state,
        invalidCardIds: options.invalidCardIds ?? [],
        browser: {
          preferences: {
            ...defaults,
            ...overrides,
            appearance: { ...defaults.appearance, ...overrides?.appearance },
            study: { ...defaults.study, ...overrides?.study },
            controls: { ...defaults.controls, ...overrides?.controls },
          },
        },
      };
      await page.addInitScript(
        ({ state, recovery }) => {
          sessionStorage.setItem("tango-integration-seed", JSON.stringify(state));
          sessionStorage.setItem(
            "tango-integration-scenario",
            `scenario=conditions&variant=${recovery ? "global-recovery" : "seed"}`
          );
        },
        { state, recovery: options.recovery ?? false }
      );
    },
  };
}

const readHeldData = async (page: Page, _fixture: ReturnType<typeof createFixture>) => {
  const state = await snapshot(page);
  return {
    learning: {
      sessions: state.sessions,
      answers: (await readEvents(page)).filter((event) => event.name === "writeStudyAnswer"),
    },
    preferences: await page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}")),
    decks: state.decks,
    cards: state.cards,
  };
};
test.describe("study-controls conditions", () => {
  const swipeFrontUp = async (page: Page, frontText: string, button: "left" | "middle" | "right" = "left") => {
    const box = await page.getByRole("button", { name: frontText, exact: true }).boundingBox();
    if (box == null) throw new Error("Study card front is not visible");
    const x = box.x + box.width / 2;
    await page.mouse.move(x, box.y + box.height * 0.5);
    await page.mouse.down({ button });
    await page.mouse.move(x, box.y + box.height * 0.2, { steps: 5 });
    await page.mouse.up({ button });
  };

  test("PLAYWRIGHT-STUDY-SESSION-05 advances a remote session on a primary upward mouse drag without flipping", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-start-drag", false);

    const { deck, currentCard, nextCard } =
      await test.step("Given: An unanswered remote study card with a following card", async () => {
        const deck = fixture.deck();
        const currentCard = fixture.card("card-1");
        const nextCard = fixture.card("card-2");
        await fixture.apply(page);
        return { deck, currentCard, nextCard };
      });
    await test.step("When: Open study and drag the card upward with the primary mouse button", async () => {
      await goto(page, `/deck/${deck.id}/study`);
      await swipeFrontUp(page, currentCard.frontText);
    });
    await test.step("Then: Rated progress saves and the next card front appears", async () => {
      await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
      await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 1 });
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-06 ignores non-primary mouse drags", async ({ page }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck, session, currentCard } =
      await test.step("Given: A remote study session with unchanged current progress", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        await fixture.apply(page);
        return { deck, session, currentCard };
      });
    await test.step("When: Open study and drag with the secondary and middle mouse buttons", async () => {
      await goto(page, `/deck/${deck.id}/study`);
      await swipeFrontUp(page, currentCard.frontText, "right");
      await swipeFrontUp(page, currentCard.frontText, "middle");
    });
    await test.step("Then: Non-primary drags leave the current card and session unchanged", async () => {
      await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 0 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-05 saves local-only progress and advances on a primary upward mouse drag", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-start", true);

    const { deck, currentCard, nextCard } =
      await test.step("Given: An anonymous study session with two local cards", async () => {
        await fixture.apply(page);
        const local = {
          deck: fixture.deck(),
          first: fixture.card("card-1"),
          second: fixture.card("card-2"),
          cards: fixture.state.remote.cards,
        };
        const { deck } = local;
        const frontText = local.first.frontText;
        const currentCard = frontText === local.first.frontText ? local.first : local.second;
        const nextCard = currentCard === local.first ? local.second : local.first;
        return { deck, currentCard, nextCard };
      });
    await test.step("When: Open study and drag the current card upward", async () => {
      await goto(page, `/deck/${deck.id}/study`);
      await swipeFrontUp(page, currentCard.frontText);
    });
    await test.step("Then: The next local card front appears at the saved position", async () => {
      await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
      await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
      await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("1");
    });
    await test.step("When: Open the rated local card", async () => {
      await page.evaluate((id) => {
        window.history.pushState(window.history.state, "", `/card/${encodeURIComponent(id)}`);
        window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
      }, currentCard.id);
    });
    await test.step("Then: Its FSRS memory records the rating", async () => {
      await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-07 shows configured Study controls without changing the active session", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-help", false);

    const { deck, session, currentCard, progressBeforeHelp } =
      await test.step("Given: An active session with configured controls and hidden swipe buttons", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
        const progressBeforeHelp = await readProgress(page, currentCard.id);
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
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual(progressBeforeHelp);
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
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

  test("PLAYWRIGHT-STUDY-SESSION-12 toggles and persists the Study Help button", async ({ page }) => {
    const fixture = createFixture("study-session-help", false);

    const { actions } =
      await test.step("Given: Study Help and card actions are visible without overlapping", async () => {
        const deck = fixture.deck();
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
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
      await reload(page);
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
    page.evaluate(
      () => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.controls?.viewMode
    );

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
    expect((await readSession(page, uid, deckId))?.currentIndex).toBe(0);
    const viewModeButton = page.getByRole("button", { name: "View mode", exact: true });
    await page.getByRole("button", { name: "Open card actions" }).click();
    await viewModeButton.click();
    await expect(viewModeButton).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => readViewMode(page)).toBe(true);
    await page.getByRole("button", { name: "Close card actions" }).click();
    await expect(viewModeButton).toHaveCount(0);
    await reload(page);
    await expect(page.getByRole("button", { name: "Open card actions" })).toBeVisible();
    await expect(viewModeButton).toHaveCount(0);
    await goto(page, `/deck/${deckId}/view`);
    await expect(page.getByRole("button", { name: "Open card actions" })).toBeVisible();
    await expect(viewModeButton).toHaveCount(0);
    await page.getByRole("button", { name: "Open card actions" }).click();
    await viewModeButton.click();
    await page.getByRole("button", { name: "Close card actions" }).click();
    await expect(viewModeButton).toHaveAttribute("title", "Exit view mode");
    await goto(page, `/deck/${deckId}/study`);
    await expect(viewModeButton).toBeVisible();

    await page.getByRole("button", { name: "Open study help" }).click();
    await expect(page.getByRole("dialog")).toContainText("Exit view mode and keep the front visible");
    await expect(page.getByRole("dialog")).toContainText("Space scrolls the front text");
    expect((await readSession(page, uid, deckId))?.currentIndex).toBe(0);
  };

  test.describe("View mode", () => {
    const scenario = { route: "study" };
    test("PLAYWRIGHT-STUDY-SESSION-08 scrolls the entire front without gesture actions or accidental exit", async ({
      page,
    }) => {
      const fixture = createFixture("study-back-text-long", false);

      const { deck, card, before } =
        await test.step("Given: A long study card front open in reading mode on a narrow viewport", async () => {
          const deck = fixture.deck();
          const card = fixture.card("card-1");

          await page.setViewportSize({ width: 320, height: 568 });
          await fixture.apply(page);
          await goto(page, `/deck/${deck.id}/${scenario.route}`);
          const before = await readProgress(page, card.id);
          await enterViewMode(page);
          return { deck, card, before };
        });
      await test.step("When: Scroll, select and drag through the entire readable front", async () => {
        await readLongFront(page);
      });
      await test.step("Then: Reading preserves the route, card content and saved progress", async () => {
        await expect(page).toHaveURL(`/deck/${deck.id}/${scenario.route}`);
        await expect(page.getByRole("region", { name: "Card front text" })).toContainText(card.frontText);
        expect(await readProgress(page, card.id)).toEqual(before);
      });
      await test.step("When: Toggle reading controls, switch between Study and View, and open Help", async () => {
        if (scenario.route === "study") await verifyStudyViewModeControls(page, fixture.user().uid, deck.id);
      });
    });
  });

  test.describe("View mode", () => {
    const scenario = { route: "study", answer: "Study answer" };
    test("PLAYWRIGHT-STUDY-SESSION-13 exits view mode with a tap or Enter before flipping the card", async ({
      page,
    }) => {
      const fixture = createFixture("study-session-start", false);

      const { card } = await test.step("Given: A study card front open in reading mode", async () => {
        const deck = fixture.deck();
        const card = fixture.card("card-1");
        await fixture.apply(page);
        await goto(page, `/deck/${deck.id}/${scenario.route}`);
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
    const scenario = { route: "study", next: "Swipe right: Good" };
    test("PLAYWRIGHT-STUDY-SESSION-14 keeps button actions and autoplay available in view mode", async ({ page }) => {
      const fixture = createFixture("study-session-start", false);

      const { first, before } =
        await test.step("Given: Study uses reading mode and a positive autoplay interval", async () => {
          const deck = fixture.deck();
          const first = fixture.card("card-1");
          await fixture.apply(page, { preferences: { study: { cardInterval: 1 }, controls: { viewMode: true } } });
          await goto(page, `/deck/${deck.id}/${scenario.route}`);
          const before = await readProgress(page, first.id);
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
          .poll(() => readProgress(page, first.id))
          .toEqual(scenario.route === "view" ? before : { ...before, reps: 1 });
      });
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-15 shares and persists view mode across Study and Deck viewing", async ({ page }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck } = await test.step("Given: An ordinary study card with reading mode disabled", async () => {
      const deck = fixture.deck();
      await fixture.apply(page);
      await goto(page, `/deck/${deck.id}/study`);
      await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
      return { deck };
    });
    await test.step("When: Enable reading mode and reload Study", async () => {
      await enterViewMode(page);
      await reload(page);
    });
    await test.step("Then: Reading mode is restored", async () => {
      await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
    });
    await test.step("When: Open the same deck in View mode", async () => {
      await goto(page, `/deck/${deck.id}/view`);
    });
    await test.step("Then: Reading mode is shared with deck browsing", async () => {
      await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
    });
    await test.step("When: Exit reading mode in View and reopen Study after reload", async () => {
      await page
        .getByRole("region", { name: "Card front text" })
        .getByText(fixture.card("card-1").frontText, { exact: true })
        .click();
      await goto(page, `/deck/${deck.id}/study`);
      await reload(page);
    });
    await test.step("Then: Ordinary study controls return and the reading preference is disabled", async () => {
      await expect(page.getByRole("button", { name: fixture.card("card-1").frontText, exact: true })).toBeVisible();
      await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
      await expect.poll(() => readViewMode(page)).toBe(false);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-16 keeps long text and all controls reachable on a short viewport", async ({
    page,
  }) => {
    const fixture = createFixture("study-back-text-long", false);

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
        await goto(page, `/deck/${deck.id}/study`);
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
      expect((await readSession(page, fixture.user().uid, deck.id))?.currentIndex).toBe(0);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-11 allows touch scrolling and pinch enlargement without card actions", async ({
    page,
  }) => {
    const fixture = createFixture("study-back-text-long", false);

    const { deck, surface } = await test.step("Given: A mobile study card front open in reading mode", async () => {
      const deck = fixture.deck();

      await page.setViewportSize({ width: 390, height: 844 });
      await fixture.apply(page, { preferences: { controls: { viewMode: true } } });
      await goto(page, `/deck/${deck.id}/study`);
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
      expect((await readSession(page, fixture.user().uid, deck.id))?.currentIndex).toBe(0);
    });
  });

  for (const language of ["en", "ja"] as const) {
    for (const remapped of [false, true]) {
      test(`PLAYWRIGHT-STUDY-SESSION-17 names the current direction actions (${language}, remapped=${remapped})`, async ({
        page,
      }) => {
        const fixture = createFixture("study-session-start", false);

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
          await test.step("Given: Study is open with its settled entry baseline", async () => {
            await goto(page, `/deck/${deck.id}/study`);
            await expect(page.getByRole("button", { name: card.frontText, exact: true })).toBeVisible();
            // Entering Study records its visit independently of the label-only interactions below.
            await expect
              .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.lastStudiedAt)
              .toBeGreaterThan(0);
            const progress = await readProgress(page, card.id);
            const session = await readSession(page, fixture.user().uid, deck.id);
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
          expect(await readProgress(page, card.id)).toEqual(progress);
          expect(await readSession(page, fixture.user().uid, deck.id)).toEqual(session);
          expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
        });
      });
    }
  }

  for (const [key, rating] of [
    ["ArrowUp", "easy"],
    ["ArrowDown", "hard"],
    ["ArrowLeft", "again"],
    ["ArrowRight", "good"],
  ] as const) {
    test(`PLAYWRIGHT-STUDY-SESSION-18 ignores held ${key} after saving and accepts a fresh press`, async ({ page }) => {
      const fixture = createFixture("study-session-start", false);

      const { deck, session, second } =
        await test.step("Given: A study session with an unanswered first card", async () => {
          const deck = fixture.deck();
          const session = fixture.session();
          const first = fixture.card("card-1");
          const second = fixture.card("card-2");
          await fixture.apply(page);
          await goto(page, `/deck/${deck.id}/study`);
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
          await expect.poll(() => readAnswers(page, session.sessionId)).toHaveLength(1);
          const savedSession = await readSession(page, fixture.user().uid, deck.id);
          const nextCard = await readCard(page, second.id);
          const answers = await readAnswers(page, session.sessionId);
          expect(answers[0]?.rating).toBe(rating);
          return { savedSession, nextCard, answers };
        });
      await test.step("When: Repeat keydown without releasing the held key", async () => {
        await page.keyboard.down(key);
      });
      await test.step("Then: No second answer or saved-state change occurs", async () => {
        await expect(page.getByText(second.frontText, { exact: true })).toBeVisible();
        expect(await readSession(page, fixture.user().uid, deck.id)).toEqual(savedSession);
        expect(await readCard(page, second.id)).toEqual(nextCard);
        expect(await readAnswers(page, session.sessionId)).toEqual(answers);
      });
      await test.step("When: Release the held key and press it freshly", async () => {
        await page.keyboard.up(key);
        await page.keyboard.press(key);
      });
      await test.step("Then: The next card is rated once with the configured rating", async () => {
        await expect(page.getByText(fixture.card("card-3").frontText, { exact: true })).toBeVisible();
        await expect.poll(() => readAnswers(page, session.sessionId)).toHaveLength(2);
        const nextAnswer = (await readAnswers(page, session.sessionId)).find((item) => item.cardId === second.id);
        expect(nextAnswer?.rating).toBe(rating);
        await expect.poll(() => readProgress(page, second.id)).toEqual({ reps: 1 });
      });
    });
  }

  test("PLAYWRIGHT-STUDY-SESSION-09 toggles playback and swipe controls only on fresh presses", async ({ page }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck } =
      await test.step("Given: A study session with playback stopped and swipe controls visible", async () => {
        const deck = fixture.deck();
        await fixture.apply(page, { preferences: { study: { cardInterval: 60 } } });
        await goto(page, `/deck/${deck.id}/study`);
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
      expect((await readSession(page, fixture.user().uid, deck.id))?.currentIndex).toBe(0);
      expect(await readAnswers(page, fixture.session().sessionId)).toHaveLength(0);
      expect(await readProgress(page, fixture.card("card-1").id)).toEqual({ reps: 0 });
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

  test("PLAYWRIGHT-STUDY-SESSION-19 ignores delivered modified keys and then accepts ordinary input", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck, first, before, session } =
      await test.step("Given: Study entry persistence has settled before card and session baselines", async () => {
        const deck = fixture.deck();
        const first = fixture.card("card-1");
        await fixture.apply(page);
        await goto(page, `/deck/${deck.id}/study`);
        await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
        // Wait for entry persistence so it cannot change the baseline during ignored-key checks.
        await expect
          .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.lastStudiedAt)
          .toBeGreaterThan(0);
        const before = await readCard(page, first.id);
        const session = await readSession(page, fixture.user().uid, deck.id);
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
      expect(await readCard(page, first.id)).toEqual(before);
      expect(await readSession(page, fixture.user().uid, deck.id)).toEqual(session);
      expect(await readAnswers(page, fixture.session().sessionId)).toHaveLength(0);
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
      await expect.poll(() => readAnswers(page, fixture.session().sessionId)).toHaveLength(1);
      expect((await readAnswers(page, fixture.session().sessionId))[0]?.rating).toBe("good");
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-19 keeps view mode persisted until an unmodified Enter", async ({ page }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck, surface, before } =
      await test.step("Given: A study card front open with reading mode persisted", async () => {
        const deck = fixture.deck();
        await fixture.apply(page, { preferences: { controls: { viewMode: true } } });
        await goto(page, `/deck/${deck.id}/study`);
        const surface = page.getByRole("region", { name: "Card front text" });
        await expect(surface).toBeVisible();
        await expect
          .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.lastStudiedAt)
          .toBeGreaterThan(0);
        const before = await readHeldData(page, fixture);
        return { deck, surface, before };
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
    await test.step("Then: Modified Enter preserves held state before reload", async () => {
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
    await test.step("When: Reload study after the modified shortcuts", async () => {
      await reload(page);
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
      expect((await readSession(page, fixture.user().uid, deck.id))?.currentIndex).toBe(0);
      expect(await readAnswers(page, fixture.session().sessionId)).toHaveLength(0);
      expect(await readProgress(page, fixture.card("card-1").id)).toEqual({ reps: 0 });
    });
  });
});

test.describe("study-back-text conditions", () => {
  const revealAnswer = async (page: Page, frontText: string) => {
    await page.getByRole("button", { name: frontText, exact: true }).click();
    return page.getByRole("region", { name: "Study answer" });
  };

  const selectBackText = async (page: Page, backText: string) => {
    const textRect = await page.getByText(backText, { exact: true }).evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return { left: rect.left, right: rect.right, y: rect.top + rect.height / 2 };
    });
    await page.mouse.move(textRect.left + 1, textRect.y);
    await page.mouse.down();
    await page.mouse.move(textRect.right - 1, textRect.y, { steps: 5 });
    await page.mouse.up();
  };

  test("PLAYWRIGHT-STUDY-SESSION-21 reveals the current Card answer without changing progress", async ({ page }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck, session, currentCard, before } =
      await test.step("Given: An active study session with an unrevealed card", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
        const before = await readProgress(page, currentCard.id);
        return { deck, session, currentCard, before };
      });
    const { answerRegion } = await test.step("When: Reveal the current card answer", async () => {
      const answerRegion = await revealAnswer(page, currentCard.frontText);
      return { answerRegion };
    });
    await test.step("Then: The answer is visible without changing progress or position", async () => {
      await expect(answerRegion).toBeVisible();
      await expect(page.getByText(currentCard.backText, { exact: true })).toBeVisible();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual(before);
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-21 selects answer text without changing the Card state", async ({ page }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck, session, currentCard } =
      await test.step("Given: An active study session with answer text", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        await fixture.apply(page);
        return { deck, session, currentCard };
      });
    await test.step("When: Reveal and select the current card answer", async () => {
      await goto(page, `/deck/${deck.id}/study`);
      await revealAnswer(page, currentCard.frontText);
      await selectBackText(page, currentCard.backText);
    });
    await test.step("Then: The answer text is selected without rating or advancing", async () => {
      await expect(page.getByText(currentCard.backText, { exact: true })).toBeVisible();
      await expect
        .poll(async () => page.evaluate(() => window.getSelection()?.toString() ?? ""))
        .toContain(currentCard.backText);
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 0 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-21 returns to the same Card front when answer overlays are disabled", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck, session, currentCard } =
      await test.step("Given: The current answer is open with overlay actions disabled", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
        await revealAnswer(page, currentCard.frontText);
        await expect(page.getByRole("button", { name: "Swipe left" })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Swipe right" })).toHaveCount(0);
        return { deck, session, currentCard };
      });
    await test.step("When: Click the answer text", async () => {
      await page.getByText(currentCard.backText, { exact: true }).click();
    });
    await test.step("Then: The same card front returns without changing progress", async () => {
      await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
      await expect(page.getByText(currentCard.backText, { exact: true })).toBeHidden();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 0 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-22 scrolls a long answer without changing the Card state", async ({ page }) => {
    const fixture = createFixture("study-back-text-long", false);

    const { deck, session, currentCard, answerRegion, initialScroll } =
      await test.step("Given: A long answer open at the top of its scroll region", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
        const answerRegion = await revealAnswer(page, currentCard.frontText);
        const initialScroll = await answerRegion.evaluate((element) => ({
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          scrollTop: element.scrollTop,
        }));
        expect(initialScroll.scrollHeight).toBeGreaterThan(initialScroll.clientHeight);
        expect(initialScroll.scrollTop).toBe(0);
        return { deck, session, currentCard, answerRegion, initialScroll };
      });
    await test.step("When: Scroll the answer with the mouse wheel", async () => {
      await answerRegion.hover();
      await page.mouse.wheel(0, initialScroll.clientHeight);
    });
    await test.step("Then: The answer scrolls without changing the card or session", async () => {
      await expect.poll(async () => answerRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await expect(answerRegion).toContainText(currentCard.backText.split("\n").at(-1) ?? currentCard.backText);
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 0 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-23 runs the mapped left overlay action once and shows the next Card front", async ({
    page,
  }) => {
    const fixture = createFixture("study-back-text-overlays", false);

    const { deck, session, currentCard, nextCard } =
      await test.step("Given: The current answer is open with a mapped left overlay", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        const nextCard = fixture.card("card-2");
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
        await revealAnswer(page, currentCard.frontText);
        return { deck, session, currentCard, nextCard };
      });
    await test.step("When: Activate the left answer overlay", async () => {
      await page.getByRole("button", { name: "Swipe left" }).click();
    });
    await test.step("Then: The action saves once and shows the next card front", async () => {
      await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
      await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 1 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex + 1);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-23 runs the mapped right overlay action once and shows the next Card front", async ({
    page,
  }) => {
    const fixture = createFixture("study-back-text-overlays", false);

    const { deck, session, currentCard, nextCard } =
      await test.step("Given: The current answer is open with a mapped right overlay", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        const nextCard = fixture.card("card-2");
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
        await revealAnswer(page, currentCard.frontText);
        return { deck, session, currentCard, nextCard };
      });
    await test.step("When: Activate the right answer overlay", async () => {
      await page.getByRole("button", { name: "Swipe right" }).click();
    });
    await test.step("Then: The action saves once and shows the next card front", async () => {
      await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
      await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 1 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex + 1);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-22 keeps the full answer width beneath overlays on a narrow viewport", async ({
    page,
  }) => {
    const fixture = createFixture("study-back-text-overlays", false);

    const { deck, session, currentCard } =
      await test.step("Given: A narrow viewport with a long-answer study card", async () => {
        await page.setViewportSize({ width: 320, height: 568 });
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        await fixture.apply(page);
        return { deck, session, currentCard };
      });
    const { answerRegion } = await test.step("When: Open study and reveal the answer", async () => {
      await goto(page, `/deck/${deck.id}/study`);
      const answerRegion = await revealAnswer(page, currentCard.frontText);
      return { answerRegion };
    });
    await test.step("Then: The answer fills the region beneath both overlays without advancing", async () => {
      const answerContent = page.locator("[data-study-answer-content]");
      const backTextSurface = answerContent.locator(":scope > *").first();
      const leftOverlayButton = page.getByRole("button", { name: "Swipe left" });
      const rightOverlayButton = page.getByRole("button", { name: "Swipe right" });
      const answerText = page.getByText(currentCard.backText, { exact: true });
      const answerRegionBounds = await answerRegion.boundingBox();
      const backTextSurfaceBounds = await backTextSurface.boundingBox();
      const leftOverlayBounds = await leftOverlayButton.boundingBox();
      const rightOverlayBounds = await rightOverlayButton.boundingBox();
      if (
        answerRegionBounds == null ||
        backTextSurfaceBounds == null ||
        leftOverlayBounds == null ||
        rightOverlayBounds == null
      ) {
        throw new Error("Expected visible answer region, back text, and overlays");
      }

      expect(backTextSurfaceBounds.x).toBe(answerRegionBounds.x);
      expect(backTextSurfaceBounds.width).toBe(answerRegionBounds.width);
      expect(leftOverlayBounds.x + leftOverlayBounds.width).toBeGreaterThan(backTextSurfaceBounds.x);
      expect(rightOverlayBounds.x).toBeLessThan(backTextSurfaceBounds.x + backTextSurfaceBounds.width);

      await expect(answerText).toBeVisible();
      await expect(leftOverlayButton).toBeVisible();
      await expect(rightOverlayButton).toBeVisible();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 0 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-22 scrolls a long answer with wheel and touch from edge overlays", async ({
    page,
  }) => {
    const fixture = createFixture("study-back-text-overlays-long", false);

    const { deck, session, currentCard, answerRegion, initialScroll, leftOverlay, rightOverlay, rightOverlayBounds } =
      await test.step("Given: A long answer open at the top with visible edge overlays", async () => {
        await page.setViewportSize({ width: 320, height: 568 });
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
        const answerRegion = await revealAnswer(page, currentCard.frontText);
        const initialScroll = await answerRegion.evaluate((element) => ({
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          scrollTop: element.scrollTop,
        }));
        expect(initialScroll.scrollHeight).toBeGreaterThan(initialScroll.clientHeight);
        expect(initialScroll.scrollTop).toBe(0);

        const leftOverlay = page.getByRole("button", { name: "Swipe left" });
        const rightOverlay = page.getByRole("button", { name: "Swipe right" });
        await expect(leftOverlay).toBeVisible();
        await expect(rightOverlay).toBeVisible();
        const rightOverlayBounds = await rightOverlay.boundingBox();
        if (rightOverlayBounds == null) throw new Error("Expected a visible right back text overlay");
        expect(rightOverlayBounds.x + rightOverlayBounds.width).toBeLessThan(page.viewportSize()?.width ?? 0);
        return {
          deck,
          session,
          currentCard,
          answerRegion,
          initialScroll,
          leftOverlay,
          rightOverlay,
          rightOverlayBounds,
        };
      });
    await test.step("When: Scroll from the left overlay with the mouse wheel", async () => {
      await leftOverlay.hover();
      await page.mouse.wheel(0, initialScroll.clientHeight);
    });
    await test.step("Then: The answer scrolls from the overlay", async () => {
      await expect.poll(async () => answerRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    });
    await test.step("When: Reset scrolling and drag upward from the right overlay by touch", async () => {
      await answerRegion.evaluate((element) => {
        element.scrollTop = 0;
      });

      const touchSession = await page.context().newCDPSession(page);
      const touchX = rightOverlayBounds.x + rightOverlayBounds.width / 2;
      const touchStartY = rightOverlayBounds.y + rightOverlayBounds.height * 0.75;
      const touchEndY = rightOverlayBounds.y + rightOverlayBounds.height * 0.25;
      await touchSession.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
      await touchSession.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ id: 0, x: touchX, y: touchStartY }],
      });
      await touchSession.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ id: 0, x: touchX, y: touchEndY }],
      });
      await touchSession.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    });
    await test.step("Then: Touch scrolls the answer without rating or advancing", async () => {
      await expect.poll(async () => answerRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await expect(leftOverlay).toBeVisible();
      await expect(rightOverlay).toBeVisible();
      await expect(page.getByText(currentCard.backText, { exact: true })).toBeVisible();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 0 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex);
    });
  });
});

test.describe("navigation conditions", () => {
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

  test("PLAYWRIGHT-DECK-VIEW-09 browses remote Cards without changing learning data or preferences", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-middle", false);

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
        await goto(page, "/");
        await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
        const before = await readHeldData(page, fixture);
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
    await test.step("Then: Viewing exits without changing held learning data or preferences", async () => {
      await expect(page).toHaveURL(/\/$/);
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
  });

  test("PLAYWRIGHT-DECK-VIEW-09 resets local-only viewing position on reload and reentry without saving", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-start", true);

    const { local, deck, studyFront, before, first, second } =
      await test.step("Given: An anonymous deck with an active study session and View mode open", async () => {
        await fixture.apply(page);
        const local = {
          deck: fixture.deck(),
          first: fixture.card("card-1"),
          second: fixture.card("card-2"),
          cards: fixture.state.remote.cards,
        };
        const { deck } = local;
        const studyFront = local.first.frontText;

        await goto(page, "/");
        await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
        const before = await readHeldData(page, fixture);
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
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
    await test.step("When: Reload View mode", async () => {
      await reload(page);
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
    await test.step("Then: Viewing exits without changing held data", async () => {
      await expect(page).toHaveURL(/\/$/);
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
    await test.step("When: Continue the original study session", async () => {
      await goto(page, "/");
      await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
    });
    await test.step("Then: Study position and every saved card field remain unchanged", async () => {
      await expect(page.getByText(studyFront, { exact: true })).toBeVisible();
      await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("0");
      expect(
        (await snapshot(page)).cards.map(({ frontText, backText, tags, uniqueKey }) => ({
          frontText,
          backText,
          tags,
          uniqueKey,
        }))
      ).toEqual(
        local.cards.map(({ frontText, backText, tags, uniqueKey }) => ({ frontText, backText, tags, uniqueKey }))
      );
    });
  });

  test("PLAYWRIGHT-DECK-VIEW-10 views all cards in standard order independently of study conditions", async ({
    page,
  }) => {
    const fixture = createFixture("study-filter", false);

    const { deck, matching, before } =
      await test.step("Given: A deck with saved study conditions and shuffled study enabled", async () => {
        const deck = fixture.deck();
        const matching = ["card-1", "card-2", "card-3", "card-4", "card-5"].map((id) => fixture.card(id));
        await fixture.apply(page, { preferences: { study: { shuffled: true } } });
        await goto(page, "/");
        await expect(page.getByRole("button", { name: `Study ${deck.name}`, exact: true })).toBeVisible();
        const before = await readHeldData(page, fixture);
        return { deck, matching, before };
      });
    await test.step("When: Open the deck in View mode", async () => {
      await openView(page, deck.name);
    });
    for (const [index, card] of matching.entries()) {
      await test.step("Then: The next card and progress follow standard browsing order", async () => {
        await expectFront(page, card.frontText);
        await expect(page.getByLabel("Viewing progress")).toHaveAttribute(
          "aria-valuetext",
          `${String(index + 1)} of 5`
        );
      });
      await test.step("When: Advance to the next browsing card", async () => {
        await page.getByRole("button", { name: "Next card", exact: true }).click();
      });
    }
    await test.step("Then: Browsing exits after every card without changing held data", async () => {
      await expect(page).toHaveURL(/\/$/);
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
  });

  test("PLAYWRIGHT-DECK-VIEW-10 includes future reviews in read-only viewing", async ({ page }) => {
    const fixture = createFixture("study-review-schedule", false);

    const { unscheduled, future, before } =
      await test.step("Given: View mode starts with a due card in a review-scheduled deck", async () => {
        const deck = fixture.deck();
        const due = fixture.card("card-due");
        const unscheduled = fixture.card("card-unscheduled");
        const future = fixture.card("card-future");
        await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
        await goto(page, "/");
        await expect(page.getByRole("button", { name: `Open actions for ${deck.name}`, exact: true })).toBeVisible();
        const before = await readHeldData(page, fixture);
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
    await test.step("Then: Viewing exits without changing held data", async () => {
      await expect(page).toHaveURL(/\/$/);
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
  });

  test("PLAYWRIGHT-DECK-VIEW-06 recovers from empty and missing Deck views without saving", async ({ page }) => {
    const fixture = createFixture("browse-filter", false);

    const { before } = await test.step("Given: An empty deck view with no browsing controls", async () => {
      const deck = fixture.deck();
      await fixture.apply(page);
      await goto(page, "/");
      await expect(page.getByRole("button", { name: `Open actions for ${deck.name}`, exact: true })).toBeVisible();
      const before = await readHeldData(page, fixture);
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
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
    await test.step("When: Open a missing deck view route", async () => {
      await goto(page, `/deck/${fixture.id("missing")}/view`);
    });
    await test.step("Then: Missing-deck guidance replaces browsing controls", async () => {
      await expect(page.getByRole("heading", { name: "Deck not found", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
    });
    await test.step("When: Choose Go home", async () => {
      await page.getByRole("button", { name: "Go home", exact: true }).click();
    });
    await test.step("Then: Home opens without submitting any changes", async () => {
      await expect(page).toHaveURL(/\/$/);
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
  });

  test("PLAYWRIGHT-DECK-VIEW-12 scrolls one long answer with touch and exits at either horizontal boundary", async ({
    page,
  }) => {
    const fixture = createFixture("study-back-text-long", false);

    const { deck, card, before } = await test.step("Given: A single-card deck in a narrow viewport", async () => {
      const deck = fixture.deck();
      const card = fixture.card("card-1");

      await page.setViewportSize({ width: 320, height: 568 });
      await fixture.apply(page);
      await goto(page, "/");
      const before = await readHeldData(page, fixture);
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
      const height = await answer.evaluate((element) => ({
        client: element.clientHeight,
        scroll: element.scrollHeight,
      }));
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
    await test.step("Then: Viewing exits without submitting changes", async () => {
      await expect(page).toHaveURL(/\/$/);
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
  });

  test("PLAYWRIGHT-DECK-VIEW-22 shares display preferences with Study and explains viewing actions", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-middle", false);

    const { deck, before, edit } =
      await test.step("Given: View mode exposes the first card edit link and saved display preferences", async () => {
        const deck = fixture.deck();
        await fixture.apply(page);
        await goto(page, "/");
        await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
        const before = await readHeldData(page, fixture);
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
      const held = await readHeldData(page, fixture);
      expect({ ...held, preferences: before.preferences }).toEqual(before);
    });
    await test.step("When: Reload View mode", async () => {
      await reload(page);
    });
    await test.step("Then: Hidden controls persist without changing learning data", async () => {
      await expectFront(page, fixture.card("card-1").frontText);
      await expect(page.getByRole("button", { name: "Open viewing help" })).toHaveCount(0);
      await expect(page.getByRole("slider")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Next card" })).toHaveCount(0);
      await expect(edit).toHaveCount(0);
      const after = await readHeldData(page, fixture);
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

  test("PLAYWRIGHT-DECK-VIEW-13 starts viewing stopped and autoplays without persisting learning data", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-middle", false);

    const { deck, before } =
      await test.step("Given: View mode starts stopped despite enabled autoplay preferences", async () => {
        const deck = fixture.deck();
        await fixture.apply(page, { preferences: { study: { defaultAutoPlay: true, cardInterval: 1 } } });
        await goto(page, "/");
        await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
        const before = await readHeldData(page, fixture);
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
    await test.step("Then: Viewing starts stopped at the first card without submitting changes", async () => {
      await expectFront(page, fixture.card("card-1").frontText);
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
  });

  test("PLAYWRIGHT-DECK-VIEW-14 browses forward and backward with the progress slider without saving", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-start", true);

    const { local, deck, studyFront, before, first, second, slider } =
      await test.step("Given: An anonymous deck with Study and View mode at their initial positions", async () => {
        await fixture.apply(page);
        const local = {
          deck: fixture.deck(),
          first: fixture.card("card-1"),
          second: fixture.card("card-2"),
          cards: fixture.state.remote.cards,
        };
        const { deck } = local;
        const studyFront = local.first.frontText;

        await goto(page, "/");
        await expect(page.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
        const before = await readHeldData(page, fixture);
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
    await test.step("Then: Viewing resets without changing held data", async () => {
      await expectFront(page, first.frontText);
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
    await test.step("When: Continue the original study session", async () => {
      await goto(page, "/");
      await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
    });
    await test.step("Then: Study position and all card fields are unchanged", async () => {
      await expect(page.getByText(studyFront, { exact: true })).toBeVisible();
      await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("0");
      expect(
        (await snapshot(page)).cards.map(({ frontText, backText, tags, uniqueKey }) => ({
          frontText,
          backText,
          tags,
          uniqueKey,
        }))
      ).toEqual(
        local.cards.map(({ frontText, backText, tags, uniqueKey }) => ({ frontText, backText, tags, uniqueKey }))
      );
    });
  });

  const enterViewMode = async (page: Page) => {
    await page.getByRole("button", { name: "View mode", exact: true }).click();
  };

  const readViewMode = (page: Page) =>
    page.evaluate(
      () => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.controls?.viewMode
    );

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
    expect((await readSession(page, uid, deckId))?.currentIndex).toBe(0);
    const viewModeButton = page.getByRole("button", { name: "View mode", exact: true });
    await page.getByRole("button", { name: "Open card actions" }).click();
    await viewModeButton.click();
    await expect(viewModeButton).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => readViewMode(page)).toBe(true);
    await page.getByRole("button", { name: "Close card actions" }).click();
    await expect(viewModeButton).toHaveCount(0);
    await reload(page);
    await expect(page.getByRole("button", { name: "Open card actions" })).toBeVisible();
    await expect(viewModeButton).toHaveCount(0);
    await goto(page, `/deck/${deckId}/view`);
    await expect(page.getByRole("button", { name: "Open card actions" })).toBeVisible();
    await expect(viewModeButton).toHaveCount(0);
    await page.getByRole("button", { name: "Open card actions" }).click();
    await viewModeButton.click();
    await page.getByRole("button", { name: "Close card actions" }).click();
    await expect(viewModeButton).toHaveAttribute("title", "Exit view mode");
    await goto(page, `/deck/${deckId}/study`);
    await expect(viewModeButton).toBeVisible();

    await page.getByRole("button", { name: "Open study help" }).click();
    await expect(page.getByRole("dialog")).toContainText("Exit view mode and keep the front visible");
    await expect(page.getByRole("dialog")).toContainText("Space scrolls the front text");
    expect((await readSession(page, uid, deckId))?.currentIndex).toBe(0);
  };

  test.describe("View mode", () => {
    const scenario = { route: "view" };
    test("PLAYWRIGHT-DECK-VIEW-23 scrolls the entire front without gesture actions or accidental exit", async ({
      page,
    }) => {
      const fixture = createFixture("study-back-text-long", false);

      const { deck, card, before } =
        await test.step("Given: A long card front open in reading mode on a narrow viewport", async () => {
          const deck = fixture.deck();
          const card = fixture.card("card-1");

          await page.setViewportSize({ width: 320, height: 568 });
          await fixture.apply(page);
          await goto(page, `/deck/${deck.id}/${scenario.route}`);
          const before = await readProgress(page, card.id);
          await enterViewMode(page);
          return { deck, card, before };
        });
      await test.step("When: Scroll and select the entire front with wheel, touch and keyboard", async () => {
        await readLongFront(page);
      });
      await test.step("Then: Reading preserves the route, visible content and saved progress", async () => {
        await expect(page).toHaveURL(`/deck/${deck.id}/${scenario.route}`);
        await expect(page.getByRole("region", { name: "Card front text" })).toContainText(card.frontText);
        expect(await readProgress(page, card.id)).toEqual(before);
        if (scenario.route === "study") await verifyStudyViewModeControls(page, fixture.user().uid, deck.id);
      });
    });
  });

  test.describe("View mode", () => {
    const scenario = { route: "view", answer: "Card answer" };
    test("PLAYWRIGHT-DECK-VIEW-24 exits view mode with a tap or Enter before flipping the card", async ({ page }) => {
      const fixture = createFixture("study-session-start", false);

      const { card } = await test.step("Given: A card front open in reading mode", async () => {
        const deck = fixture.deck();
        const card = fixture.card("card-1");
        await fixture.apply(page);
        await goto(page, `/deck/${deck.id}/${scenario.route}`);
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
    const scenario = { route: "view", next: "Next card" };
    test("PLAYWRIGHT-DECK-VIEW-21 keeps button actions and autoplay available in view mode", async ({ page }) => {
      const fixture = createFixture("study-session-start", false);

      const { first, before } =
        await test.step("Given: A deck with reading mode enabled and a positive autoplay interval", async () => {
          const deck = fixture.deck();
          const first = fixture.card("card-1");
          await fixture.apply(page, { preferences: { study: { cardInterval: 1 }, controls: { viewMode: true } } });
          await goto(page, `/deck/${deck.id}/${scenario.route}`);
          const before = await readProgress(page, first.id);
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
          .poll(() => readProgress(page, first.id))
          .toEqual(scenario.route === "view" ? before : { ...before, reps: 1 });
      });
    });
  });
});

test.describe("study-actions conditions", () => {
  test("PLAYWRIGHT-STUDY-SESSION-25 saves an again answer and progress and advances to the next Card", async ({
    page,
  }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck, session, currentCard, nextCard } =
      await test.step("Given: A remote study session ready for an Again rating", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        const nextCard = fixture.card("card-2");
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
        return { deck, session, currentCard, nextCard };
      });
    await test.step("When: Rate the current card Again", async () => {
      await page.getByRole("button", { name: "Swipe left: Again" }).click();
    });
    await test.step("Then: The rating saves and study advances to the next card", async () => {
      await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 1 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex + 1);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-26 skips without creating an answer and advances", async ({ page }) => {
    const fixture = createFixture("study-session-start", false);

    const { deck, session, currentCard, nextCard } =
      await test.step("Given: A remote study session ready to skip a card", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-1");
        const nextCard = fixture.card("card-2");
        await fixture.apply(page);

        await goto(page, `/deck/${deck.id}/study`);
        return { deck, session, currentCard, nextCard };
      });
    await test.step("When: Skip the current card", async () => {
      await page.getByRole("button", { name: "Skip" }).click();
    });
    await test.step("Then: Study advances without a rating or answer history", async () => {
      await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 0 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex + 1);
      expect(await readAnswers(page, session.sessionId)).toHaveLength(0);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-24 prevents returning to previous Cards through study controls", async ({ page }) => {
    const fixture = createFixture("study-session-middle", false);

    const { deck, session, currentCard, front, slider } =
      await test.step("Given: An active study session with progress controls", async () => {
        const deck = fixture.deck();
        const session = fixture.session();
        const currentCard = fixture.card("card-2");
        await fixture.apply(page);
        await goto(page, `/deck/${deck.id}/study`);

        await expect(page.getByText("Again", { exact: true })).toBeVisible();
        await expect(page.getByText("Hard", { exact: true })).toBeVisible();
        await expect(page.getByText("Good", { exact: true })).toBeVisible();
        await expect(page.getByText("Easy", { exact: true })).toBeVisible();
        const front = page.getByRole("button", { name: currentCard.frontText, exact: true });
        const slider = page.getByRole("slider", { name: "Study progress" });
        return { deck, session, currentCard, front, slider };
      });
    await test.step("When: Try moving the progress slider to the beginning with Home", async () => {
      await slider.press("Home");
    });
    await test.step("Then: Keyboard input cannot change the current position", async () => {
      await expect(slider).toHaveValue(String(session.currentIndex));
    });
    await test.step("When: Try clicking an earlier progress position", async () => {
      await slider.click({ position: { x: 1, y: 10 } });
    });
    await test.step("Then: The current card, progress and saved position stay unchanged", async () => {
      await expect(slider).toHaveValue(String(session.currentIndex));
      await expect(front).toBeVisible();
      await expect.poll(() => readProgress(page, currentCard.id)).toEqual({ reps: 0 });
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.currentIndex)
        .toBe(session.currentIndex);
      await expect(page.getByTestId("swipe-feedback-direction")).toHaveCount(0);
    });
  });
});

test.describe("study-session conditions", () => {
  test("PLAYWRIGHT-STUDY-HISTORY-10 keeps Deck selection in the URL across navigation and reload", async ({ page }) => {
    const fixture = createFixture("remote-deck-with-cards", false);

    const { deck } = await test.step("Given: A deck with no study records", async () => {
      await fixture.apply(page);
      await goto(page, "/");
      const deck = fixture.deck();
      return { deck };
    });
    await test.step("When: Open study history from that deck", async () => {
      await page.getByRole("button", { name: `Open actions for ${deck.name}` }).click();
      await page.getByRole("menuitem", { name: "Study history" }).click();
    });
    await test.step("Then: The URL-scoped deck is selected", async () => {
      await expect(page.getByRole("combobox", { name: "Deck", exact: true })).toHaveValue(deck.id);
    });
    await test.step("When: Select all decks and navigate back", async () => {
      await page.getByRole("combobox").selectOption("");
      await page.goBack();
    });
    await test.step("Then: The original deck selection is restored", async () => {
      await expect(page.getByRole("combobox")).toHaveValue(deck.id);
    });
    await test.step("When: Navigate forward", async () => {
      await page.goForward();
    });
    await test.step("Then: All-decks selection returns", async () => {
      await expect(page.getByRole("combobox")).toHaveValue("");
    });
    await test.step("When: Reload study history", async () => {
      await reload(page);
    });
    await test.step("Then: The all-decks selection and empty state remain", async () => {
      await expect(page.getByRole("combobox")).toHaveValue("");
      await expect(page.getByText("No study records in this period.")).toBeVisible();
    });
    await test.step("When: Expand daily counts", async () => {
      await page.getByText("Show daily counts · 30 days").click();
    });
    await test.step("Then: Thirty days of history are available", async () => {
      await expect(page.getByRole("row")).toHaveCount(31);
    });
  });

  test("PLAYWRIGHT-STUDY-HISTORY-21 keeps unavailable Deck selection without displaying all history", async ({
    page,
  }) => {
    const fixture = createFixture("remote-deck-with-cards", false);

    await test.step("Given: History for an unavailable deck without a fallback to all history", async () => {
      await fixture.apply(page);
      const path = `/study-history?deckId=${fixture.id("missing")}`;
      await goto(page, path);
      await page.getByRole("heading", { level: 1, name: "Study history" }).waitFor();
      await expect(page.getByRole("status").filter({ hasText: "The selected deck is unavailable." })).toHaveText(
        "The selected deck is unavailable.All decks"
      );
      expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(path);
      await expect(page.getByRole("table")).toHaveCount(0);
    });
    await test.step("When: Choose all decks and expand daily counts", async () => {
      await page.getByRole("button", { name: "All decks" }).click();
      await page.getByText("Show daily counts · 30 days").click();
    });
    await test.step("Then: The all-decks history table opens", async () => {
      await expect(page.getByRole("table")).toBeVisible();
    });
  });

  test("PLAYWRIGHT-STUDY-HISTORY-11 selects presets and inclusive dates while preserving Deck and URL navigation", async ({
    page,
  }) => {
    const fixture = createFixture("remote-deck-with-cards", false);

    await test.step("Given: Study history at its initial period", async () => {
      await fixture.apply(page);
      await goto(page, "/study-history");
    });
    await test.step("When: Select seven days and expand daily counts", async () => {
      await page.getByRole("button", { name: "7 days" }).click();
      await page.getByText("Show daily counts · 7 days").click();
    });
    await test.step("Then: Seven daily rows and their heading are shown", async () => {
      await expect(page.getByRole("row")).toHaveCount(8);
    });
    await test.step("When: Select the ninety-day period", async () => {
      await page.getByRole("button", { name: "90 days" }).click();
    });
    await test.step("Then: The chart groups counts by seven days", async () => {
      await expect(page.getByText("Study counts per 7 days")).toBeVisible();
    });
    await test.step("When: Expand the ninety-day daily table", async () => {
      await page.getByText("Show daily counts · 90 days").click();
    });
    await test.step("Then: The first thirty daily rows are shown", async () => {
      await expect(page.getByRole("row")).toHaveCount(31);
    });
    await test.step("When: Page to the oldest dates", async () => {
      await page.getByRole("button", { name: "Older dates" }).click();
      await page.getByRole("button", { name: "Older dates" }).click();
    });
    await test.step("Then: The final thirty days are shown without another page", async () => {
      await expect(page.getByText("61–90 of 90 days")).toBeVisible();
      await expect(page.getByRole("button", { name: "Older dates" })).toBeDisabled();
    });
    await test.step("When: Apply an inclusive custom range, select a deck and navigate back", async () => {
      await page.getByRole("button", { name: "Custom range" }).click();
      await page.getByLabel("Start date").fill("2020-12-31");
      await page.getByLabel("End date").fill("2021-01-02");
      await page.getByRole("button", { name: "Apply" }).click();
      await page.getByRole("combobox").selectOption(fixture.deck().id);
      await page.goBack();
    });
    await test.step("Then: Back restores the all-decks selection", async () => {
      await expect(page.getByRole("combobox")).toHaveValue("");
    });
    await test.step("When: Navigate forward and reload", async () => {
      await page.goForward();
      await reload(page);
    });
    await test.step("Then: The deck and both custom range endpoints survive reload", async () => {
      await expect(page.getByRole("combobox")).toHaveValue(fixture.deck().id);
      await expect(page.getByLabel("Start date")).toHaveValue("2020-12-31");
      await expect(page.getByLabel("End date")).toHaveValue("2021-01-02");
      await expect(page.getByText("No study records in this period.")).toBeVisible();
    });
    await test.step("When: Expand the custom daily counts", async () => {
      await page.getByText("Show daily counts · 3 days").click();
    });
    await test.step("Then: Both endpoint dates appear in the inclusive range", async () => {
      await expect(page.getByRole("row")).toHaveCount(4);
      await expect(page.getByRole("row", { name: "Dec 31, 2020 0 0" })).toBeVisible();
      await expect(page.getByRole("row", { name: "Jan 2, 2021 0 0" })).toBeVisible();
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-START-04 starts a filtered session capped by the learning limit", async ({ page }) => {
    const fixture = createFixture("study-filter", false);

    const { deck, firstCard, secondCard, eligibleBeyondLimit, otherTagExcluded, tagOnlyExcluded } =
      await test.step("Given: A deck with eligible and excluded cards under saved study filters", async () => {
        const deck = fixture.deck();
        const firstCard = fixture.card("card-1");
        const secondCard = fixture.card("card-2");
        const eligibleBeyondLimit = fixture.card("card-3");
        const otherTagExcluded = fixture.card("card-4");
        const tagOnlyExcluded = fixture.card("card-5");
        await fixture.apply(page);
        await goto(page, "/settings");
        await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
        return { deck, firstCard, secondCard, eligibleBeyondLimit, otherTagExcluded, tagOnlyExcluded };
      });

    for (const maximum of [fixture.state.browser.preferences.study.maxNumberOfCardsToLearn, 0, 1]) {
      const { expectedIds } =
        await test.step("Given: Study uses the iteration learning limit and matching cards", async () => {
          if (maximum !== fixture.state.browser.preferences.study.maxNumberOfCardsToLearn) {
            await goto(page, "/settings");
            const slider = page.getByRole("slider", { name: "Maximum cards" });
            await slider.press("Home");
            if (maximum === 1) await slider.press("ArrowRight");
          }
          await expect
            .poll(() =>
              page.evaluate(
                () =>
                  JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study
                    ?.maxNumberOfCardsToLearn
              )
            )
            .toBe(maximum);
          const matchingIds = [firstCard.id, secondCard.id, eligibleBeyondLimit.id];
          const expectedIds = maximum === 0 ? matchingIds : matchingIds.slice(0, maximum);
          return { expectedIds };
        });
      const { countLabel } = await test.step("When: Open study settings for that learning limit", async () => {
        const countLabel = `${String(expectedIds.length)} ${expectedIds.length === 1 ? "card" : "cards"}`;
        await goto(page, `/deck/${deck.id}/start`);
        return { countLabel };
      });
      await test.step("Then: The eligible session count respects the limit", async () => {
        await expect(page.getByRole("heading", { level: 2, name: `${countLabel} in this session` })).toBeVisible();
      });
      await test.step("When: Start the filtered session", async () => {
        await page.getByRole("button", { name: `Start ${countLabel}` }).click();
      });
      await test.step("Then: Only matching cards within the limit enter the saved session", async () => {
        await expect(page.getByText(firstCard.frontText, { exact: true })).toBeVisible();
        await expect
          .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.cardOrderIds)
          .toEqual(expectedIds);
        const stored = await readSession(page, fixture.user().uid, deck.id);
        expect(stored?.cardOrderIds).not.toContain(otherTagExcluded.id);
        expect(stored?.cardOrderIds).not.toContain(tagOnlyExcluded.id);
      });
    }
  });

  test("PLAYWRIGHT-STUDY-SESSION-START-02 prevents an empty filtered session from starting", async ({ page }) => {
    const fixture = createFixture("study-filter-no-matches", false);

    const { deck } = await test.step("Given: A deck whose saved study filters match no cards", async () => {
      const deck = fixture.deck();
      await fixture.apply(page);
      return { deck };
    });
    await test.step("When: Open study settings", async () => {
      await goto(page, `/deck/${deck.id}/start`);
    });
    await test.step("Then: Starting an empty session is disabled and creates no session", async () => {
      await expect(page.getByText("No cards match your filters.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
      expect(await readSession(page, fixture.user().uid, deck.id)).toBeUndefined();
    });
  });
});

const recoveryWarning = (count: number) =>
  `Some saved cards could not be loaded (${count}). Their saved data is unchanged. Other saved data is still available.`;

async function expectWarningBelowHeader(page: Page, count: number) {
  const warning = page.getByText(recoveryWarning(count));
  await expect(warning).toBeVisible();
  const warningBounds = await warning.boundingBox();
  const headerBounds = await page
    .locator("header")
    .filter({ has: page.getByRole("button", { name: "tango", exact: true }) })
    .boundingBox();
  if (!warningBounds || !headerBounds) throw new Error("Expected warning and header bounds");
  expect(warningBounds.y).toBeGreaterThanOrEqual(headerBounds.y + headerBounds.height);
}

test("PLAYWRIGHT-STUDY-SESSION-37 keeps recovery guidance and every study control inside a mobile viewport", async ({
  page,
}) => {
  const fixture = createFixture("study-session-start", true);
  const viewport = { width: 390, height: 844 };
  await test.step("Given: an anonymous deck with one healthy card and one incoming invalid card", async () => {
    await fixture.apply(page, { invalidCardIds: [fixture.card("card-2").id] });
    await goto(page, `/deck/${fixture.deck().id}/start`);
  });
  await test.step("When: start the healthy card and use a mobile viewport", async () => {
    await page.getByRole("button", { name: "Start 1 card", exact: true }).click();
    await page.setViewportSize(viewport);
  });
  await test.step("Then: the warning, front, all ratings, playback and progress fit without page scrolling", async () => {
    await expect(page.locator("#frontText")).toHaveText(fixture.card("card-1").frontText);
    const controls = [
      page.getByText(recoveryWarning(1)),
      page.locator("#frontText"),
      ...["Swipe left: Again", "Swipe down: Hard", "Swipe right: Good", "Swipe up: Easy", "Play"].map((name) =>
        page.getByRole("button", { name, exact: true })
      ),
      page.getByRole("slider", { name: "Study progress" }),
    ];
    for (const control of controls) {
      await expect(control).toBeVisible();
      const bounds = await control.boundingBox();
      if (!bounds) throw new Error("Expected visible control bounds");
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
  await test.step("When: play then pause without answering", async () => {
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
  });
  await test.step("Then: the session remains incomplete", async () => {
    await expect(page.getByRole("region", { name: "Study complete", exact: true })).toHaveCount(0);
  });
  await test.step("When: rate the healthy card Good", async () => {
    await page.getByRole("button", { name: "Swipe right: Good", exact: true }).click();
  });
  await test.step("Then: the single-card session completes", async () => {
    const completion = page.getByRole("region", { name: "Study complete", exact: true });
    await expect(completion).toBeVisible();
    await expect(completion.getByText("Session: 1 card", { exact: true })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Study progress" })).toHaveCount(0);
  });
});

for (const [id, suffix] of [
  ["PLAYWRIGHT-CARD-VIEW-09", ""],
  ["PLAYWRIGHT-CARD-EDIT-19", "/edit"],
] as const) {
  test(`${id} retains recovery guidance on an unavailable card route ${suffix || "view"}`, async ({ page }) => {
    const fixture = createFixture("study-session-start", true);
    const warning = page.getByText(recoveryWarning(1));
    await test.step("Given: a healthy deck and an incoming quarantined card", async () => {
      await fixture.apply(page, { invalidCardIds: [fixture.card("card-2").id] });
      await goto(page, `/deck/${fixture.deck().id}`);
      await expect(page.getByRole("button", { name: `View ${fixture.card("card-1").frontText}` })).toBeVisible();
      await expectWarningBelowHeader(page, 1);
    });
    await test.step("When: open the quarantined card route", async () => {
      await goto(page, `/card/${fixture.card("card-2").id}${suffix}`);
    });
    await test.step("Then: missing-card guidance retains the recovery warning", async () => {
      await expect(page.getByRole("heading", { name: "Card not found", exact: true })).toBeVisible();
      await expect(warning).toBeVisible();
    });
    await test.step("When: reload the route", async () => {
      await reload(page);
    });
    await test.step("Then: the prepared invalid state is still explained", async () => {
      await expect(page.getByRole("heading", { name: "Card not found", exact: true })).toBeVisible();
      await expect(warning).toBeVisible();
    });
    await test.step("When: choose Go home", async () => {
      await page.getByRole("button", { name: "Go home", exact: true }).click();
    });
    await test.step("Then: the healthy deck remains available with the warning", async () => {
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("button", { name: `Open cards in ${fixture.deck().name}` })).toBeVisible();
      await expect(warning).toBeVisible();
    });
  });
}

test("PLAYWRIGHT-DECK-VIEW-08 retains recovery guidance when every card is quarantined", async ({ page }) => {
  const fixture = createFixture("study-session-start", true);
  await test.step("Given: a deck whose two incoming card records are invalid", async () => {
    await fixture.apply(page, { invalidCardIds: [fixture.card("card-1").id, fixture.card("card-2").id] });
    await goto(page, `/deck/${fixture.deck().id}`);
    await expectWarningBelowHeader(page, 2);
  });
  await test.step("When: open the deck view", async () => {
    await goto(page, `/deck/${fixture.deck().id}/view`);
  });
  await test.step("Then: the empty view retains the warning and offers no next card", async () => {
    await expect(page.getByRole("heading", { name: "No cards yet", exact: true })).toBeVisible();
    await expect(page.getByText(recoveryWarning(2))).toBeVisible();
    await expect(page.getByRole("button", { name: "Next card", exact: true })).toHaveCount(0);
  });
  await test.step("When: reload then return to the deck list", async () => {
    await reload(page);
    await expect(page.getByRole("heading", { name: "No cards yet", exact: true })).toBeVisible();
    await expect(page.getByText(recoveryWarning(2))).toBeVisible();
    await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  });
  await test.step("Then: the deck remains available with its warning", async () => {
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: `Open cards in ${fixture.deck().name}` })).toBeVisible();
    await expect(page.getByText(recoveryWarning(2))).toBeVisible();
  });
});

const readPreferences = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences);

test.describe("settings study conditions", () => {
  test("PLAYWRIGHT-STUDY-SESSION-START-06 applies review scheduling to the next study session", async ({ page }) => {
    const fixture = createFixture("study-review-schedule");
    const { deck, dueCard, futureCard, unscheduledCard, respectReviewSchedule } =
      await test.step("Given: Review scheduling is disabled for a deck with due, future and new cards", async () => {
        const deck = fixture.deck();
        const dueCard = fixture.card("card-due");
        const futureCard = fixture.card("card-future");
        const unscheduledCard = fixture.card("card-unscheduled");
        await fixture.apply(page);
        await goto(page, "/settings");

        const respectReviewSchedule = page.getByRole("checkbox", { name: "Respect review schedule" });
        await expect(respectReviewSchedule).not.toBeChecked();
        return { deck, dueCard, futureCard, unscheduledCard, respectReviewSchedule };
      });
    await test.step("When: Enable respect for the review schedule", async () => {
      await respectReviewSchedule.locator("xpath=parent::label").click();
    });
    await test.step("Then: The enabled preference saves automatically", async () => {
      await expect(respectReviewSchedule).toBeChecked();
      await expect
        .poll(() =>
          page.evaluate(
            () => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study?.useCardInterval
          )
        )
        .toBe(true);
    });
    await test.step("When: Reload settings", async () => {
      await reload(page);
    });
    await test.step("Then: Review scheduling remains enabled", async () => {
      await expect(respectReviewSchedule).toBeChecked();
    });
    await test.step("When: Start the next study session", async () => {
      await goto(page, `/deck/${deck.id}/start`);
      await page.getByRole("button", { name: "Start 2 cards" }).click();
    });
    await test.step("Then: Only due and unscheduled cards enter the session", async () => {
      await expect
        .poll(async () => (await readSession(page, fixture.user().uid, deck.id))?.cardOrderIds)
        .toHaveLength(2);
      const session = await readSession(page, fixture.user().uid, deck.id);
      expect(session?.cardOrderIds).toHaveLength(2);
      expect(session?.cardOrderIds).toEqual(expect.arrayContaining([dueCard.id, unscheduledCard.id]));
      expect(session?.cardOrderIds).not.toContain(futureCard.id);
    });
  });

  test("PLAYWRIGHT-STUDY-SESSION-36 Restoring a positive interval preserves the active study session and playback preferences", async ({
    page,
  }) => {
    const fixture = createFixture("remote-deck-with-cards");
    const { deck } = await test.step("Given: A deck configured with zero interval and autoplay enabled", async () => {
      const deck = fixture.deck();
      await page.clock.install();
      await fixture.apply(page, {
        preferences: {
          study: { cardInterval: 0, defaultAutoPlay: true, shuffled: false },
          controls: { showPlaybackControls: true },
        },
      });
      await goto(page, `/deck/${deck.id}/start`);
      return { deck };
    });
    await test.step("When: Start a study session with zero interval", async () => {
      await page.getByRole("button", { name: `Start ${String(fixture.state.remote.cards.length)} cards` }).click();
    });
    const { session, firstCard, secondCard, preferences } =
      await test.step("Then: The session starts without playback controls or a progress slider", async () => {
        await expect.poll(() => readSession(page, fixture.user().uid, deck.id)).toMatchObject({ currentIndex: 0 });
        const session = await readSession(page, fixture.user().uid, deck.id);
        if (session === undefined) throw new Error("Expected a newly started study session");
        const firstCard = fixture.state.remote.cards.find((card) => card.id === session.cardOrderIds[0]);
        const secondCard = fixture.state.remote.cards.find((card) => card.id === session.cardOrderIds[1]);
        if (firstCard === undefined || secondCard === undefined) throw new Error("Expected at least two study Cards");
        const preferences = await readPreferences(page);

        await expect(page.getByRole("button", { name: firstCard.frontText, exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: /^(Play|Pause)$/ })).toHaveCount(0);
        await expect(page.getByRole("slider", { name: "Study progress" })).toHaveCount(0);
        return { session, firstCard, secondCard, preferences };
      });
    await test.step("When: Let time pass without a manual answer", async () => {
      await page.clock.runFor(1250);
    });
    await test.step("Then: The session identity and position remain unchanged", async () => {
      // Cloud metadata may arrive after Start; the existing session values must stay unchanged.
      expect(await readSession(page, fixture.user().uid, deck.id)).toMatchObject({
        sessionId: session.sessionId,
        cardOrderIds: session.cardOrderIds,
        currentIndex: 0,
      });
    });
    await test.step("When: Open Study Help", async () => {
      await page.getByRole("button", { name: "Open study help" }).click();
    });
    await test.step("Then: Help explains why autoplay and playback controls are unavailable", async () => {
      const help = page.getByRole("dialog", { name: "Study controls" });
      await expect(
        help.getByText("Autoplay is unavailable while the card interval is 0", { exact: true })
      ).toBeVisible();
      await expect(
        help.getByText("Playback controls are unavailable while the card interval is 0", { exact: true })
      ).toBeVisible();
    });
    await test.step("When: Close help and try Space after clearing control focus", async () => {
      await page.getByRole("button", { name: "Close help", exact: true }).click();
      // Exercise the page shortcut instead of activating the help button restored by focus management.
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });
      await page.keyboard.press("Space");
      await page.clock.runFor(1250);
    });
    await test.step("Then: Neither playback nor the current session changes", async () => {
      expect(await readSession(page, fixture.user().uid, deck.id)).toMatchObject({
        sessionId: session.sessionId,
        cardOrderIds: session.cardOrderIds,
        currentIndex: 0,
      });
      expect(await readPreferences(page)).toEqual(preferences);
      await expect(page.getByRole("button", { name: firstCard.frontText, exact: true })).toBeVisible();
    });
    await test.step("When: Rate the current card Good manually", async () => {
      await page.getByRole("button", { name: "Swipe right: Good", exact: true }).click();
    });
    const { continuedPosition, deckBeforeSettings, cardsBeforeSettings } =
      await test.step("Then: Manual rating advances and saves the next position", async () => {
        await expect(page.getByRole("button", { name: secondCard.frontText, exact: true })).toBeVisible();
        const continuedPosition = { sessionId: session.sessionId, cardOrderIds: session.cardOrderIds, currentIndex: 1 };
        await expect.poll(() => readSession(page, fixture.user().uid, deck.id)).toMatchObject(continuedPosition);

        const deckBeforeSettings = (await snapshot(page)).decks.find((value) => value.id === deck.id);
        const cardsBeforeSettings = (await snapshot(page)).cards;
        return { continuedPosition, deckBeforeSettings, cardsBeforeSettings };
      });
    await test.step("When: Leave study and open autoplay settings", async () => {
      await page.getByRole("button", { name: "Open card actions", exact: true }).click();
      await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
      await page.getByRole("button", { name: "Open settings", exact: true }).click();
    });
    const { interval } = await test.step("Then: The saved interval is still zero", async () => {
      const interval = page.getByRole("slider", { name: "Autoplay interval" });
      await expect(interval).toHaveValue("0");
      return { interval };
    });
    const { restoredPreferences } = await test.step("When: Restore a positive autoplay interval", async () => {
      await interval.focus();
      await page.keyboard.press("End");
      const restoredPreferences = { ...preferences, study: { ...preferences.study, cardInterval: 60 } };
      return { restoredPreferences };
    });
    await test.step("Then: Only the interval changes while the session position is preserved", async () => {
      await expect.poll(() => readPreferences(page)).toEqual(restoredPreferences);
      expect(await readSession(page, fixture.user().uid, deck.id)).toMatchObject(continuedPosition);
    });
    await test.step("When: Continue the active deck", async () => {
      await page.getByRole("button", { name: "tango", exact: true }).click();
      await page.getByRole("button", { name: `Continue ${deck.name}`, exact: true }).click();
    });
    await test.step("Then: Playback resumes with controls at the saved card", async () => {
      await expect(page.getByRole("button", { name: secondCard.frontText, exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
      await expect(page.getByRole("slider", { name: "Study progress" })).toBeVisible();
      expect(await readSession(page, fixture.user().uid, deck.id)).toMatchObject(continuedPosition);
    });
    await test.step("When: Pause playback", async () => {
      await page.getByRole("button", { name: "Pause", exact: true }).click();
    });
    await test.step("Then: Playback pauses without changing preferences, deck or cards", async () => {
      await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
      expect(await readPreferences(page)).toEqual(restoredPreferences);
      expect((await snapshot(page)).decks.find((value) => value.id === deck.id)).toEqual(deckBeforeSettings);
      expect((await snapshot(page)).cards).toEqual(cardsBeforeSettings);
    });
  });
});

test.describe("Native global error handling", () => {
  test.use({ fixedTime: false });

  for (const failure of ["timer", "promise", "string", "null", "undefined"] as const) {
    test(`PLAYWRIGHT-APPLICATION-02 handles native unhandled ${failure} without deleting held data`, async ({
      page,
      browserErrors,
    }) => {
      const fixture = createFixture("remote-deck-with-cards");
      const before =
        await test.step("Given: real application data and Settings inside the production error boundary", async () => {
          await fixture.apply(page, { recovery: true });
          await goto(page, "/settings");
          await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
          return readHeldData(page, fixture);
        });
      await test.step("When: the browser receives the source failure", async () => {
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
            void Promise.reject(reasons[kind]);
          }
        }, failure);
      });
      await test.step("Then: recovery retains data and exactly the deliberate browser diagnostic", async () => {
        await expect(page.getByRole("alert")).toBeVisible();
        await expect(page.getByRole("button", { name: "Clear local data and reload", exact: true })).toHaveCount(0);
        expect(await readHeldData(page, fixture)).toEqual(before);
        const expected =
          failure === "null"
            ? /^null$/u
            : failure === "undefined"
              ? /^undefined$/u
              : /^(?:Error: )?E2E_UNHANDLED_FAILURE(?:\n\s+at [^\n]+)*$/u;
        await expect.poll(() => [...browserErrors]).toEqual([expect.stringMatching(expected)]);
        browserErrors.splice(0, 1);
      });
      await test.step("When: Reload is chosen", async () => {
        await Promise.all([
          page.waitForEvent("load"),
          page.getByRole("button", { name: "Reload", exact: true }).click(),
        ]);
        await page.locator("#root > *").first().waitFor();
      });
      await test.step("Then: the prepared application becomes usable again with its preferences", async () => {
        await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
        expect(await readHeldData(page, fixture)).toEqual(before);
      });
    });
  }

  test("PLAYWRIGHT-APPLICATION-06 ignores a resource-style error event and a handled promise rejection", async ({
    page,
  }) => {
    const fixture = createFixture("remote-deck-with-cards");
    const before = await test.step("Given: Settings inside the real application error boundary", async () => {
      await fixture.apply(page, { recovery: true });
      await goto(page, "/settings");
      await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
      return readHeldData(page, fixture);
    });
    await test.step("When: the source resource-style event and handled rejection are delivered", async () => {
      await page.evaluate(async () => {
        window.dispatchEvent(new Event("error"));
        await Promise.reject(new Error("handled")).catch(() => undefined);
      });
    });
    await test.step("Then: Settings remains usable and held data remains unchanged", async () => {
      await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toHaveCount(0);
      expect(await readHeldData(page, fixture)).toEqual(before);
    });
  });
});
