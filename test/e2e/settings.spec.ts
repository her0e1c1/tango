import { collectBrowserErrors, expect, listDocuments, requireDocument, test } from "./utils/fixtures";
import { readSession } from "./utils/study-helpers";
import type { Page } from "@playwright/test";

test("SETTINGS-03 applies review scheduling to the next study session", async ({ fixture, page }) => {
  const { deck, dueCard, futureCard, unscheduledCard, respectReviewSchedule } =
    await test.step("Given: Review scheduling is disabled for a deck with due, future and new cards", async () => {
      const deck = fixture.deck();
      const dueCard = fixture.card("card-due");
      const futureCard = fixture.card("card-future");
      const unscheduledCard = fixture.card("card-unscheduled");
      await fixture.apply(page);
      await page.goto("/settings");

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
    await page.reload();
  });
  await test.step("Then: Review scheduling remains enabled", async () => {
    await expect(respectReviewSchedule).toBeChecked();
  });
  await test.step("When: Start the next study session", async () => {
    await page.goto(`/deck/${deck.id}/start`);
    await page.getByRole("button", { name: "Start 2 cards" }).click();
  });
  await test.step("Then: Only due and unscheduled cards enter the session", async () => {
    await expect.poll(async () => (await readSession(fixture.user().uid, deck.id))?.cardOrderIds).toHaveLength(2);
    const session = await readSession(fixture.user().uid, deck.id);
    expect(session?.cardOrderIds).toHaveLength(2);
    expect(session?.cardOrderIds).toEqual(expect.arrayContaining([dueCard.id, unscheduledCard.id]));
    expect(session?.cardOrderIds).not.toContain(futureCard.id);
  });
});

const readPreferences = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences);

const intervalDescription =
  "Seconds between cards. At 0, cards do not advance automatically, and the play/pause button and progress slider are hidden.";

const savedDocuments = async (uid: string) =>
  Promise.all(
    (["deck", "card", "studySession", "studyAnswer"] as const).map(async (collection) =>
      (await listDocuments(collection)).filter(({ fields }) => fields.uid?.stringValue === uid)
    )
  );

test("SETTINGS-10 SETTINGS-16 Zero autoplay interval is explained and saved without resetting other preferences", async ({
  fixture,
  page,
}) => {
  const { interval, preferences, savedData } =
    await test.step("Given: Autoplay interval is sixty seconds with playback preferences enabled", async () => {
      await fixture.apply(page, {
        preferences: { study: { defaultAutoPlay: true }, controls: { showPlaybackControls: true } },
      });
      await page.goto("/settings");
      const interval = page.getByRole("slider", { name: "Autoplay interval" });
      await expect(interval).toHaveValue("60");
      await expect(interval).toHaveAttribute("min", "0");
      await expect(interval).toHaveAttribute("max", "60");
      const preferences = await readPreferences(page);
      const savedData = await savedDocuments(fixture.user().uid);

      await interval.focus();
      return { interval, preferences, savedData };
    });
  await test.step("When: Set the interval to zero with Home", async () => {
    await page.keyboard.press("Home");
  });
  await test.step("Then: Zero interval is explained and saved without resetting preferences", async () => {
    await expect(interval).toHaveValue("0");
    await expect(interval).toHaveAttribute("aria-valuetext", "No automatic advance (0 seconds)");
    await expect(interval).toHaveAccessibleDescription(intervalDescription);
    await expect(page.getByText(intervalDescription, { exact: true })).toBeVisible();
    await expect(page.getByText("No automatic advance (0s)", { exact: true })).toBeVisible();
    await expect
      .poll(() => readPreferences(page))
      .toEqual({ ...preferences, study: { ...preferences.study, cardInterval: 0 } });
  });
  await test.step("When: Reload settings", async () => {
    await page.reload();
  });
  await test.step("Then: Zero interval and enabled playback preferences are restored", async () => {
    await expect(interval).toHaveValue("0");
    await expect(interval).toHaveAttribute("aria-valuetext", "No automatic advance (0 seconds)");
    await expect(interval).toHaveAccessibleDescription(intervalDescription);
    await expect(page.getByText("No automatic advance (0s)", { exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Start autoplay" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Show playback controls" })).toBeChecked();
  });
  await test.step("When: Restore the positive interval with End", async () => {
    await interval.focus();
    await page.keyboard.press("End");
  });
  await test.step("Then: The original preferences return without saved-data changes", async () => {
    await expect(interval).toHaveValue("60");
    await expect(interval).toHaveAttribute("aria-valuetext", "60 seconds");
    await expect(page.getByText("60s", { exact: true })).toBeVisible();
    await expect.poll(() => readPreferences(page)).toEqual(preferences);
    expect(await savedDocuments(fixture.user().uid)).toEqual(savedData);
  });
});

test("SETTINGS-11 SETTINGS-17 Restoring a positive interval preserves the active study session and playback preferences", async ({
  fixture,
  page,
}) => {
  const { deck } = await test.step("Given: A deck configured with zero interval and autoplay enabled", async () => {
    const deck = fixture.deck();
    await page.clock.install();
    await fixture.apply(page, {
      preferences: {
        study: { cardInterval: 0, defaultAutoPlay: true, shuffled: false },
        controls: { showPlaybackControls: true },
      },
    });
    await page.goto(`/deck/${deck.id}/start`);
    return { deck };
  });
  await test.step("When: Start a study session with zero interval", async () => {
    await page.getByRole("button", { name: `Start ${String(fixture.state.remote.cards.length)} cards` }).click();
  });
  const { session, firstCard, secondCard, preferences } =
    await test.step("Then: The session starts without playback controls or a progress slider", async () => {
      await expect.poll(() => readSession(fixture.user().uid, deck.id)).toMatchObject({ currentIndex: 0 });
      const session = await readSession(fixture.user().uid, deck.id);
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
    expect(await readSession(fixture.user().uid, deck.id)).toMatchObject({
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
    await expect(help.getByText("Autoplay is unavailable while the card interval is 0", { exact: true })).toBeVisible();
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
    expect(await readSession(fixture.user().uid, deck.id)).toMatchObject({
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
      await expect.poll(() => readSession(fixture.user().uid, deck.id)).toMatchObject(continuedPosition);

      const deckBeforeSettings = await requireDocument("deck", deck.id);
      const cardsBeforeSettings = await Promise.all(
        fixture.state.remote.cards.map((card) => requireDocument("card", card.id))
      );
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
    expect(await readSession(fixture.user().uid, deck.id)).toMatchObject(continuedPosition);
  });
  await test.step("When: Continue the active deck", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: `Continue ${deck.name}`, exact: true }).click();
  });
  await test.step("Then: Playback resumes with controls at the saved card", async () => {
    await expect(page.getByRole("button", { name: secondCard.frontText, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
    await expect(page.getByRole("slider", { name: "Study progress" })).toBeVisible();
    expect(await readSession(fixture.user().uid, deck.id)).toMatchObject(continuedPosition);
  });
  await test.step("When: Pause playback", async () => {
    await page.getByRole("button", { name: "Pause", exact: true }).click();
  });
  await test.step("Then: Playback pauses without changing preferences, deck or cards", async () => {
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    expect(await readPreferences(page)).toEqual(restoredPreferences);
    expect(await requireDocument("deck", deck.id)).toEqual(deckBeforeSettings);
    expect(await Promise.all(fixture.state.remote.cards.map((card) => requireDocument("card", card.id)))).toEqual(
      cardsBeforeSettings
    );
  });
});

test("SETTINGS-06 recovers current defaults from invalid persisted preferences", async ({ fixture, page }) => {
  await test.step("Given: Settings contain an invalid persisted preferences value", async () => {
    await fixture.apply(page);
    await page.goto("/settings");
    await page.evaluate(() => {
      localStorage.setItem("tango-config", JSON.stringify({ state: { preferences: "invalid" }, version: 1 }));
    });
  });
  await test.step("When: Reload settings", async () => {
    await page.reload();
  });
  await test.step("Then: Current defaults recover the preferences screen", async () => {
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Dark mode" })).not.toBeChecked();
    await expect(page.getByRole("slider", { name: "Maximum cards" })).toHaveValue("10");
    await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("system");
  });
});

test("SETTINGS-01 Dark mode is auto-saved across reload", async ({ fixture, page }) => {
  const { expectedDarkMode, darkMode } =
    await test.step("Given: Dark mode matches the saved appearance preference", async () => {
      const initialDarkMode = fixture.state.browser.preferences.appearance.darkMode;
      const expectedDarkMode = !initialDarkMode;
      await fixture.apply(page);
      await page.goto("/settings");

      const darkMode = page.getByRole("checkbox", { name: "Dark mode" });
      await expect(darkMode).toBeChecked({ checked: initialDarkMode });
      return { expectedDarkMode, darkMode };
    });
  await test.step("When: Toggle dark mode", async () => {
    await darkMode.locator("xpath=parent::label").click();
  });
  await test.step("Then: The changed appearance preference saves automatically", async () => {
    await expect(darkMode).toBeChecked({ checked: expectedDarkMode });
    await expect
      .poll(() =>
        page.evaluate(
          () => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.appearance?.darkMode
        )
      )
      .toBe(expectedDarkMode);
  });
  await test.step("When: Reload settings", async () => {
    await page.reload();
  });
  await test.step("Then: The checkbox and page theme restore the saved mode", async () => {
    await expect(darkMode).toBeChecked({ checked: expectedDarkMode });
    await expect(page.locator("html")).toHaveClass(expectedDarkMode ? /dark/ : /^(?!.*\bdark\b).*$/);
  });
});

const verifyUnlimitedCardLocale = async (page: Page) => {
  await expect(page.getByText("All matching cards", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
  const japaneseSlider = page.getByRole("slider", { name: "最大カード数" });
  await expect(japaneseSlider).toHaveAttribute("aria-valuetext", "条件に一致するすべてのカード");
  await expect(page.getByText("条件に一致するすべてのカード", { exact: true })).toBeVisible();
  await page.reload();
  await expect(japaneseSlider).toHaveValue("0");
  await expect(japaneseSlider).toHaveAttribute("aria-valuetext", "条件に一致するすべてのカード");
  await page.getByRole("combobox", { name: "言語" }).selectOption("en");
  await expect(page.getByRole("slider", { name: "Maximum cards" })).toBeVisible();
};

const cardCountLabel = (count: number) => `${String(count)} ${count === 1 ? "card" : "cards"}`;

test("SETTINGS-02 SETTINGS-12 Maximum cards limits the next study session", async ({ fixture, page }) => {
  const { deck, numberOfCards, expectedMaximum } =
    await test.step("Given: A deck with enough cards to exercise the learning limit", async () => {
      const deck = fixture.deck();
      const numberOfCards = fixture.state.remote.cards.length;
      const expectedMaximum = numberOfCards - 1;
      if (expectedMaximum < 1) throw new Error("SETTINGS-02 fixture requires at least two Cards");
      if (expectedMaximum === fixture.state.browser.preferences.study.maxNumberOfCardsToLearn) {
        throw new Error("SETTINGS-02 fixture requires the changed maximum to differ from its initial preference");
      }
      await fixture.apply(page);
      return { deck, numberOfCards, expectedMaximum };
    });

  for (const maximum of [expectedMaximum, 0, 1]) {
    const count = maximum === 0 ? numberOfCards : maximum;
    await test.step(`Maximum cards ${String(maximum)}`, async () => {
      const { maximumCards } = await test.step("Given: The Maximum cards control is focused", async () => {
        await page.goto("/settings");
        const maximumCards = page.getByRole("slider", { name: "Maximum cards" });
        await maximumCards.focus();
        return { maximumCards };
      });
      await test.step("When: Set the iteration maximum with the keyboard", async () => {
        await maximumCards.press("Home");
        for (let index = 0; index < maximum; index += 1) await maximumCards.press("ArrowRight");
      });
      const { accessibleValue } =
        await test.step("Then: The accessible maximum and saved preference match the limit", async () => {
          await expect(maximumCards).toHaveValue(String(maximum));
          const accessibleValue = maximum === 0 ? "All matching cards" : cardCountLabel(maximum);
          await expect(maximumCards).toHaveAttribute("aria-valuetext", accessibleValue);
          await expect
            .poll(() =>
              page.evaluate(
                () =>
                  JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study
                    ?.maxNumberOfCardsToLearn
              )
            )
            .toBe(maximum);
          return { accessibleValue };
        });
      await test.step("When: Reload settings", async () => {
        await page.reload();
      });
      await test.step("Then: The saved maximum and accessible value are restored", async () => {
        await expect(maximumCards).toHaveValue(String(maximum));
        await expect(maximumCards).toHaveAttribute("aria-valuetext", accessibleValue);
      });
      const { countLabel } = await test.step("When: Check unlimited localization and open study settings", async () => {
        if (maximum === 0) await verifyUnlimitedCardLocale(page);

        const countLabel = cardCountLabel(count);
        await page.goto(`/deck/${deck.id}/start`);
        return { countLabel };
      });
      await test.step("Then: The next session preview uses the selected maximum", async () => {
        await expect(page.getByRole("heading", { level: 2, name: `${countLabel} in this session` })).toBeVisible();
      });
      await test.step("When: Start the limited study session", async () => {
        await page.getByRole("button", { name: `Start ${countLabel}` }).click();
      });
      const { session } = await test.step("Then: The saved card order respects the learning limit", async () => {
        await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/study$`));
        await expect
          .poll(async () => (await readSession(fixture.user().uid, deck.id))?.cardOrderIds.length)
          .toBe(count);
        const session = await readSession(fixture.user().uid, deck.id);
        expect(session?.cardOrderIds).toEqual(
          [fixture.card("card-1").id, fixture.card("card-2").id, fixture.card("card-3").id].slice(0, count)
        );
        return { session };
      });
      await test.step("When: Change the maximum after the session has started", async () => {
        await page.goto("/settings");
        await maximumCards.press("Home");
        if (maximum === 0) await maximumCards.press("ArrowRight");
      });
      await test.step("Then: The new maximum preference is saved", async () => {
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study
                  ?.maxNumberOfCardsToLearn
            )
          )
          .toBe(maximum === 0 ? 1 : 0);
      });
      await test.step("When: Continue the existing study session", async () => {
        await page.goto("/");
        await page.getByRole("button", { name: `Continue ${deck.name}` }).click();
      });
      await test.step("Then: Its identity and card order remain unchanged", async () => {
        await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/study$`));
        expect((await readSession(fixture.user().uid, deck.id))?.sessionId).toBe(session?.sessionId);
        expect((await readSession(fixture.user().uid, deck.id))?.cardOrderIds).toEqual(session?.cardOrderIds);
      });
    });
  }
});

test("SETTINGS-04 Explicit Japanese language is auto-saved across reload", async ({ fixture, page }) => {
  const { language } = await test.step("Given: Settings initially use English", async () => {
    await fixture.apply(page);
    await page.goto("/settings");

    const language = page.getByRole("combobox", { name: "Language" });
    await expect(language).toHaveValue("en");
    return { language };
  });
  await test.step("When: Choose explicit Japanese", async () => {
    await language.selectOption("ja");
  });
  const { japaneseLanguage } =
    await test.step("Then: The interface and saved language switch to Japanese", async () => {
      const japaneseLanguage = page.getByRole("combobox", { name: "言語" });
      await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
      await expect(japaneseLanguage).toHaveValue("ja");
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
      await expect
        .poll(() =>
          page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.language)
        )
        .toBe("ja");
      return { japaneseLanguage };
    });
  await test.step("When: Reload settings", async () => {
    await page.reload();
  });
  await test.step("Then: Japanese remains the saved interface language", async () => {
    await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
    await expect(japaneseLanguage).toHaveValue("ja");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });
  await test.step("When: Return to the deck list", async () => {
    await page.goto("/");
  });
  await test.step("Then: The deck list is translated", async () => {
    await expect(page.getByRole("heading", { level: 1, name: "デッキ" })).toBeVisible();
  });
  await test.step("When: Open the Add menu", async () => {
    await page.getByRole("button", { name: "追加", exact: true }).click();
  });
  await test.step("Then: Deck creation is translated", async () => {
    await expect(page.getByRole("menuitem", { name: "デッキを作成" })).toBeVisible();
  });
});

test.describe("ja-JP browser locale", () => {
  test.use({ locale: "ja-JP" });

  test("SETTINGS-05 System language resolves the browser locale across reload", async ({ fixture, page }) => {
    const { language } = await test.step("Given: A Japanese browser with explicit English settings", async () => {
      await fixture.apply(page);
      await page.goto("/settings");

      const language = page.getByRole("combobox", { name: "Language" });
      await expect(language).toHaveValue("en");
      return { language };
    });
    await test.step("When: Choose the system language", async () => {
      await language.selectOption("system");
    });
    const { systemLanguage } =
      await test.step("Then: The interface resolves Japanese while saving system selection", async () => {
        const systemLanguage = page.getByRole("combobox", { name: "言語" });
        await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
        await expect(systemLanguage).toHaveValue("system");
        await expect(page.locator("html")).toHaveAttribute("lang", "ja");
        await expect
          .poll(() =>
            page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.language)
          )
          .toBe("system");
        return { systemLanguage };
      });
    await test.step("When: Reload settings", async () => {
      await page.reload();
    });
    await test.step("Then: System selection still resolves the Japanese browser locale", async () => {
      await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
      await expect(systemLanguage).toHaveValue("system");
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    });
  });
});

const verifyCommitLink = async (page: Page) => {
  const details = page.locator("details");
  const summary = page.locator("summary");
  const commit = details.getByRole("link");
  const hasCommit = (await commit.count()) > 0;
  await expect(hasCommit ? commit : details.getByText("unknown", { exact: true })).toBeVisible();
  await expect
    .poll(() => commit.evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
    .toEqual(hasCommit ? [expect.stringMatching(/\/commit\/[a-f0-9]+$/)] : []);
  if (hasCommit) await page.keyboard.press("Tab");
  await expect(hasCommit ? commit : summary).toBeFocused();
  await expect.poll(() => summary.evaluate((element) => element === document.activeElement)).toBe(!hasCommit);
  if (hasCommit) await page.keyboard.press("Shift+Tab");
  await expect(summary).toBeFocused();
};

test("SETTINGS-07 Advanced disclosure keeps keyboard focus visible without changing saved data", async ({
  browser,
  baseURL,
  fixture,
}, testInfo) => {
  for (const viewport of [
    { width: 1100, height: 900 },
    { width: 360, height: 640 },
  ]) {
    for (const darkMode of [false, true]) {
      const { page, errors } =
        await test.step("Given: A fresh browser page at the current viewport and theme", async () => {
          const page = await browser.newPage({ viewport, ...(baseURL === undefined ? {} : { baseURL }) });
          const errors = collectBrowserErrors(page.context(), baseURL);
          return { page, errors };
        });
      try {
        const { summary, details, interval, readSavedData, saved } =
          await test.step("Given: The Advanced disclosure is closed and saved data is recorded", async () => {
            await fixture.apply(page, { preferences: { appearance: { darkMode } } });
            await page.goto("/");
            await page.getByRole("heading", { level: 1, name: "Decks" }).waitFor();
            if (viewport.width < 640) {
              await page.getByRole("button", { name: "Menu", exact: true }).click();
              await page.getByRole("menuitem", { name: "Open settings", exact: true }).click();
            } else {
              await page.getByRole("button", { name: "Open settings", exact: true }).click();
            }
            const summary = page.locator("summary");
            const details = page.locator("details");
            const interval = page.getByRole("slider", { name: "Autoplay interval" });
            const readSavedData = () =>
              page.evaluate(() =>
                Object.fromEntries(
                  ["tango-config", "tango-local-decks", "tango-local-cards", "tango-study"].map((key) => [
                    key,
                    localStorage.getItem(key),
                  ])
                )
              );
            const saved = await readSavedData();
            await expect(summary).toContainText("Advanced");
            await expect(details).not.toHaveAttribute("open");
            return { summary, details, interval, readSavedData, saved };
          });
        await test.step("When: Tab from the interval control to Advanced", async () => {
          await interval.focus();
          await page.keyboard.press("Tab");
        });
        const { captureFocus } =
          await test.step("Then: The closed disclosure has a visible focus outline", async () => {
            await expect(summary).toBeFocused();
            const captureFocus = async (state: string) => {
              await expect(summary).toBeInViewport();
              const ring = await summary.evaluate((element) => {
                const style = getComputedStyle(element);
                return {
                  visible: element.matches(":focus-visible"),
                  width: Number.parseFloat(style.outlineWidth),
                  offset: Number.parseFloat(style.outlineOffset),
                };
              });
              expect(ring.visible).toBe(true);
              expect(ring.width).toBeGreaterThan(0);
              // An inset ring must fit inside the clipping disclosure in both open states.
              expect(ring.offset + ring.width).toBeLessThanOrEqual(0);

              await testInfo.attach(`${viewport.width}-${darkMode ? "dark" : "light"}-${state}`, {
                body: await details.screenshot(),
                contentType: "image/png",
              });
            };
            await captureFocus("closed");
            return { captureFocus };
          });
        await test.step("When: Shift-Tab back to the interval control", async () => {
          await page.keyboard.press("Shift+Tab");
        });
        await test.step("Then: The interval control receives focus", async () => {
          await expect(interval).toBeFocused();
        });
        await test.step("When: Tab to Advanced again", async () => {
          await page.keyboard.press("Tab");
        });
        await test.step("Then: The disclosure receives focus", async () => {
          await expect(summary).toBeFocused();
        });
        await test.step("When: Expand Advanced with Enter", async () => {
          await page.keyboard.press("Enter");
        });
        await test.step("Then: Version details and the open disclosure focus outline are visible", async () => {
          await expect(details).toHaveAttribute("open");
          await captureFocus("open");
          await expect(details.getByText("Version", { exact: true })).toBeVisible();
        });
        await test.step("When: Traverse the commit link and collapse Advanced with Enter", async () => {
          await verifyCommitLink(page);
          await page.keyboard.press("Enter");
        });
        await test.step("Then: The disclosure closes", async () => {
          await expect(details).not.toHaveAttribute("open");
        });
        await test.step("When: Expand Advanced with Space", async () => {
          await page.keyboard.press("Space");
        });
        await test.step("Then: The disclosure opens", async () => {
          await expect(details).toHaveAttribute("open");
        });
        await test.step("When: Collapse Advanced with Space", async () => {
          await page.keyboard.press("Space");
        });
        await test.step("Then: The disclosure closes", async () => {
          await expect(details).not.toHaveAttribute("open");
        });
        await test.step("When: Expand Advanced once more", async () => {
          await page.keyboard.press("Space");
        });
        await test.step("Then: Disclosure interaction leaves saved data unchanged", async () => {
          await expect(details).toHaveAttribute("open");
          expect(await readSavedData()).toEqual(saved);
        });
        await test.step("When: Reload settings", async () => {
          await page.reload();
        });
        await test.step("Then: Advanced resets closed while saved data stays unchanged", async () => {
          await expect(summary).toBeVisible();
          await expect(details).not.toHaveAttribute("open");
          expect(await readSavedData()).toEqual(saved);
          errors.assert();
        });
      } finally {
        await page.close();
      }
    }
  }
});

test("SETTINGS-08 Existing Card errors follow language changes without losing drafts", async ({ fixture, page }) => {
  const { deck, card, before, deckBefore, url, session } =
    await test.step("Given: A card draft with English validation errors under system language", async () => {
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "language", { configurable: true, get: () => "en-US" })
      );
      await fixture.apply(page);
      await page.goto("/settings");
      await page.getByRole("combobox", { name: "Language" }).selectOption("system");
      const deck = fixture.deck();
      const card = fixture.card();
      const before = await requireDocument("card", card.id);
      const deckBefore = await requireDocument("deck", deck.id);
      await page.goto(`/deck/${deck.id}`);
      await page.getByRole("button", { name: `Open actions for ${card.frontText}` }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      await page.getByRole("tab", { name: "Back", exact: true }).click();
      await page.getByRole("textbox", { name: "Back text" }).fill("未保存の回答");
      await page.getByRole("tab", { name: "Front", exact: true }).click();
      await page.getByRole("textbox", { name: "Front text" }).fill("");
      await page.getByRole("button", { name: "Save changes" }).click();
      await expect(page.getByRole("textbox", { name: "Front text" })).toHaveAccessibleDescription(
        "Front text is required."
      );
      const url = page.url();
      const session = await page.evaluate(() => localStorage.getItem("tango-study"));
      return { deck, card, before, deckBefore, url, session };
    });
  await test.step("When: Change the browser language to Japanese", async () => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, "language", { configurable: true, get: () => "ja-JP" });
      window.dispatchEvent(new Event("languagechange"));
    });
  });
  await test.step("Then: Existing validation errors update to Japanese without clearing the draft", async () => {
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.getByRole("textbox", { name: "表面のテキスト" })).toHaveAccessibleDescription(
      "表面のテキストは必須です。"
    );
    await expect(page.getByRole("textbox", { name: "表面のテキスト" })).toHaveValue("");
  });
  await test.step("When: Open the translated back-text editor", async () => {
    await page.getByRole("tab", { name: "裏面", exact: true }).click();
  });
  await test.step("Then: The answer draft, route, session and saved records are unchanged", async () => {
    await expect(page.getByRole("textbox", { name: "裏面のテキスト" })).toHaveValue("未保存の回答");
    await expect(page).toHaveURL(url);
    expect(await requireDocument("card", card.id)).toEqual(before);
    expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
    expect(await page.evaluate(() => localStorage.getItem("tango-study"))).toBe(session);
  });
  await test.step("When: Try leaving the unsaved editor", async () => {
    // Dirty state must still guard navigation after changing the language.
    await page.getByRole("button", { name: "設定を開く" }).click();
  });
  await test.step("Then: The translated unsaved-changes dialog still protects the draft", async () => {
    await expect(page.getByRole("alertdialog", { name: "未保存の変更を破棄しますか？" })).toBeVisible();
  });
});

test("SETTINGS-09 Cached CSV diagnostics follow the current language", async ({ fixture, page }) => {
  const { context } =
    await test.step("Given: A CSV preview with cached English diagnostics and error context", async () => {
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "language", { configurable: true, get: () => "en-US" })
      );
      await fixture.apply(page);
      await page.goto("/settings");
      await page.getByRole("combobox", { name: "Language" }).selectOption("system");
      await page.goto("/import");
      await page.getByLabel("Upload a csv file").setInputFiles({
        name: "日本語.csv",
        mimeType: "text/csv",
        buffer: Buffer.from('問題,回答,個人タグ,key-1\n,,,key-2\n"unterminated'),
      });
      await expect(page.getByRole("alert")).toContainText("Front text is required.");
      const context = await page.getByRole("alert").locator("code").allTextContents();
      return { context };
    });
  await test.step("When: Change the browser locale while rejecting any accidental file reread", async () => {
    // Any accidental file read during the locale update now fails the preview.
    await page.evaluate(() => {
      File.prototype.text = () => Promise.reject(new Error("Unexpected file reread"));
      Object.defineProperty(navigator, "language", { configurable: true, get: () => "ja-JP" });
      window.dispatchEvent(new Event("languagechange"));
    });
  });
  await test.step("Then: Cached diagnostics translate while their context and preview remain intact", async () => {
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    const alert = page.getByRole("alert");
    await expect(alert).toContainText("表面のテキストは必須です。");
    await expect(alert).toContainText("裏面のテキストは必須です。");
    await expect(alert).toContainText("引用符で囲まれたフィールドが閉じられていません。");
    await expect(alert.getByRole("listitem")).toHaveCount(3);
    await expect(alert.locator("code")).toHaveText(context);
    await expect(page.getByText("有効: 1件")).toBeVisible();
    await expect(page.getByText("無効: 2件")).toBeVisible();
    await expect(page.getByText("問題", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "1枚のカードを追加", exact: true })).toBeDisabled();
    await expect(page).toHaveURL(/\/import$/);
  });
});
