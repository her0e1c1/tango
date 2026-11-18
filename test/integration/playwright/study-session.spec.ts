import { test, expect, open, readEvents, callScenario } from "./fixtures";

test("PLAYWRIGHT-STUDY-CONTROLS-01 PLAYWRIGHT-STUDY-CONTROLS-03 plays the fourth card and supports Enter playback", async ({
  page,
}) => {
  await test.step("Given: fourth of twenty-four cards and paused playback", async () => {
    await open(page, "study", "playback");
    await expect(page.getByText("4 / 24", { exact: true })).toBeVisible();
  });
  await test.step("When: select Play", async () => {
    await page.getByRole("button", { name: "Play", exact: true }).click();
  });
  await test.step("Then: playback can be paused and restarted with Enter", async () => {
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page.getByRole("button", { name: "Play", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Pause", exact: true })).toHaveAttribute("aria-pressed", "true");
  });
});

test("PLAYWRIGHT-STUDY-CONTROLS-02 skips without a recall grade", async ({ page }) => {
  await test.step("Given: a ready session and Skip control", async () => {
    await open(page, "study", "skip");
  });
  await test.step("When: Skip the first card", async () => {
    await page.getByRole("button", { name: "Skip", exact: true }).click();
  });
  await test.step("Then: the second card is aligned with progress and no rating exists", async () => {
    await expect(page.getByRole("button", { name: "Second", exact: true })).toBeVisible();
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", "2 of 5");
    await expect(page.getByText(/FSRS D:/)).toHaveCount(0);
    expect((await readEvents(page)).filter((event) => event.name === "writeStudyAnswer")).toHaveLength(0);
  });
});

test("PLAYWRIGHT-STUDY-CONTROLS-04 keeps slider, progress and card aligned", async ({ page }) => {
  await test.step("Given: the first of five cards", async () => {
    await open(page, "study", "session");
  });
  await test.step("When: select position two", async () => {
    await page.getByRole("slider", { name: "Study progress" }).fill("2");
  });
  await test.step("Then: the third card and all progress displays agree", async () => {
    await expect(page.getByRole("button", { name: "Third", exact: true })).toBeVisible();
    await expect(page.getByRole("slider")).toHaveValue("2");
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", "3 of 5");
    await expect(page.getByText("3 / 5", { exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-STUDY-CONTROLS-05 omits disabled directions from Tab navigation", async ({ page }) => {
  await test.step("Given: disabled left action", async () => {
    await open(page, "study", "disabled");
    await expect(page.getByRole("button", { name: "Swipe left: No action", exact: true })).toBeDisabled();
  });
  await test.step("When: attempt left then Tab from the card", async () => {
    await page.getByRole("button", { name: "Swipe left: No action", exact: true }).dispatchEvent("click");
    await expect(page.getByRole("button", { name: "Hello", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Hello", exact: true }).focus();
    await page.keyboard.press("Tab");
  });
  await test.step("Then: the next enabled direction receives focus", async () => {
    await expect(page.getByRole("button", { name: "Swipe up: Easy", exact: true })).toBeFocused();
  });
});

test("PLAYWRIGHT-STUDY-CONTROLS-06 runs the configured direction once with Enter", async ({ page }) => {
  await test.step("Given: left is Skip and focused", async () => {
    await open(page, "study", "direction");
    const left = page.getByRole("button", { name: "Swipe left: Skip", exact: true });
    await expect(left).toHaveAttribute("aria-description", "Skip");
    await left.focus();
  });
  await test.step("When: press Enter", async () => {
    await page.keyboard.press("Enter");
  });
  await test.step("Then: one card is skipped", async () => {
    await expect(page.getByRole("button", { name: "Second", exact: true })).toBeVisible();
    await expect(page.getByRole("slider")).toHaveValue("1");
  });
});

for (const [variant, modalId, notificationId] of [
  [
    "help",
    "PLAYWRIGHT-STUDY-CONTROLS-07 PLAYWRIGHT-STUDY-CONTROLS-08",
    "PLAYWRIGHT-STUDY-CONTROLS-09 PLAYWRIGHT-STUDY-CONTROLS-10",
  ],
  ["widget-default", "PLAYWRIGHT-CARD-PLAYER-49", "PLAYWRIGHT-CARD-PLAYER-50"],
] as const) {
  test(`${modalId} contains help focus and returns it on Escape ${variant}`, async ({ page }) => {
    await test.step("Given: help is closed and a Good action is configured", async () => {
      await open(page, "study", variant);
    });
    await test.step("When: open help", async () => {
      await page.getByRole("button", { name: "Open study help" }).click();
    });
    await test.step("Then: named and described modal traps focus and restores its trigger", async () => {
      const dialog = page.getByRole("dialog", { name: "Study controls", exact: true });
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      await expect(dialog).toHaveAccessibleDescription(
        "Review the controls available for this study session and their current actions."
      );
      await expect(dialog.getByText("Arrow Up / Swipe Up", { exact: true })).toBeVisible();
      await expect(dialog.getByText("Good — answer and continue", { exact: true }).first()).toBeVisible();
      await expect(dialog.getByText("Flip or reveal the current card", { exact: true })).toBeVisible();
      const close = page.getByRole("button", { name: "Close help", exact: true });
      await expect(close).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(close).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Open study help" })).toBeFocused();
    });
  });
  test(`${notificationId} preserves modal focus through background notification changes ${variant}`, async ({
    page,
  }) => {
    await test.step("Given: a persistent dismissible notification", async () => {
      await open(page, "study", variant === "widget-default" ? "widget-help-notification" : variant);
      await callScenario(page, "study", "notify");
      await expect(page.getByRole("button", { name: "Dismiss notification" })).toBeEnabled();
    });
    await test.step("When: open help and dismiss notification from the external boundary", async () => {
      await page.getByRole("button", { name: "Open study help" }).click();
      await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(0);
      await callScenario(page, "study", "dismissNotification");
    });
    await test.step("Then: focus stays inside help and notification interaction returns after close", async () => {
      await expect(page.getByRole("button", { name: "Close help", exact: true })).toBeFocused();
      if (variant === "widget-default") await page.keyboard.press("Escape");
      await callScenario(page, "study", "notify");
      if (variant === "widget-default") await page.getByRole("button", { name: "Open study help" }).click();
      await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(0);
      await page.getByRole("button", { name: "Close help", exact: true }).click();
      await expect(page.getByRole("button", { name: "Dismiss notification" })).toBeEnabled();
      await page.getByRole("button", { name: "Dismiss notification" }).click();
      await expect(page.getByText("Persistent warning", { exact: true })).toHaveCount(0);
    });
  });
}

test("PLAYWRIGHT-STUDY-SESSION-01 PLAYWRIGHT-STUDY-SESSION-02 reveals and rates the first card, then completes the last", async ({
  page,
}) => {
  await test.step("Given: a two-card session with successful saving", async () => {
    await open(page, "study", "answer");
  });
  await test.step("When: reveal the first answer and rate Good", async () => {
    await page.getByRole("button", { name: "Hello", exact: true }).click();
    await expect(page.getByText("Hola", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Swipe right", exact: true }).click();
  });
  await test.step("Then: the second card and progress are aligned", async () => {
    await expect(page.getByRole("button", { name: "Second", exact: true })).toBeVisible();
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", "2 of 2");
  });
  await test.step("When: reveal and rate the last card", async () => {
    await page.getByRole("button", { name: "Second", exact: true }).click();
    await page.getByRole("button", { name: "Swipe right", exact: true }).click();
  });
  await test.step("Then: completion receives focus and no phantom next card exists", async () => {
    const heading = page.getByRole("heading", { name: "Study complete", exact: true });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.getByText("Session: 2 cards", { exact: true })).toBeVisible();
    await expect(page.getByRole("slider")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Swipe up: Easy", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Back to deck list", exact: true })).toBeEnabled();
  });
});

test("PLAYWRIGHT-STUDY-SESSION-03 reports an unsuccessful answer without completing", async ({ page }) => {
  await test.step("Given: answer saving fails", async () => {
    await open(page, "study", "failure");
  });
  await test.step("When: reveal and rate the first card", async () => {
    await page.getByRole("button", { name: "Hello", exact: true }).click();
    await page.getByRole("button", { name: "Swipe right", exact: true }).click();
  });
  await test.step("Then: failure is visible and completion is absent", async () => {
    await expect(page.getByRole("alert")).toContainText("Unable to save progress. Check your connection and retry.");
    await expect(page.getByRole("heading", { name: "Study complete", exact: true })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-STUDY-SESSION-04 updates direction names without moving focus or answering", async ({ page }) => {
  await test.step("Given: four default rating controls", async () => {
    await open(page, "study", "session");
    await page.getByRole("button", { name: "Swipe left: Again", exact: true }).focus();
  });
  await test.step("When: switch to Japanese and update direction mappings", async () => {
    await callScenario(page, "study", "changeLanguage", "ja");
    for (const [direction, rating] of [
      ["左", "Again"],
      ["上", "Easy"],
      ["下", "Hard"],
      ["右", "Good"],
    ]) {
      const button = page.getByRole("button", { name: `${direction}へスワイプ: ${rating}`, exact: true });
      await expect(button).toBeVisible();
      await expect(button).toHaveText(rating!);
    }
    await callScenario(page, "study", "remapDirections");
  });
  await test.step("Then: names and captions follow mappings without a save", async () => {
    for (const [direction, action] of [
      ["左", "スキップ"],
      ["上", "学習を終了"],
      ["下", "何もしない"],
      ["右", "Hard"],
    ]) {
      const button = page.getByRole("button", { name: `${direction}へスワイプ: ${action}`, exact: true });
      await expect(button).toBeVisible();
      await expect(button).toHaveText(action!);
    }
    await expect(page.getByRole("button", { name: "左へスワイプ: スキップ", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "下へスワイプ: 何もしない", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Hello", exact: true })).toBeVisible();
    await expect(page.getByRole("slider")).toHaveValue("0");
    expect((await readEvents(page)).filter((event) => event.name === "writeStudyAnswer")).toHaveLength(0);
  });
});

for (const [id, variant] of [
  ["PLAYWRIGHT-STUDY-SESSION-START-01", "start"],
  ["PLAYWRIGHT-STUDY-SESSION-START-03", "start-retry"],
  ["PLAYWRIGHT-STUDY-SESSION-START-02", "no-matches"],
] as const) {
  test(`${id} handles ${variant}`, async ({ page }) => {
    await test.step("Given: selected deck and configured start result", async () => {
      await open(page, "study", variant);
    });
    await test.step("When: start the selected deck if cards match", async () => {
      if (variant !== "no-matches") await page.getByRole("button", { name: "Start 5 cards", exact: true }).click();
    });
    await test.step("Then: start uses the selected deck or explains the result", async () => {
      if (variant === "no-matches") {
        await expect(page.getByText("No cards match your filters.", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Start 0 cards", exact: true })).toBeDisabled();
        await expect(page.getByRole("slider", { name: "Study progress" })).toHaveCount(0);
        return;
      }
      if (variant === "start-retry") {
        await expect(page.getByRole("alert")).toHaveText(/Unable to save/);
        await expect(page.getByRole("button", { name: "Start 5 cards", exact: true })).toBeEnabled();
        await expect(page.getByRole("slider")).toHaveCount(0);
        await page.getByRole("button", { name: "Start 5 cards", exact: true }).click();
      }
      await expect(page.getByRole("button", { name: "Hello", exact: true })).toBeVisible();
      await expect(page.getByRole("slider", { name: "Study progress" })).toHaveAttribute("aria-valuetext", "1 of 5");
      await expect(page.getByText("Other prompt", { exact: true })).toHaveCount(0);
    });
  });
}

for (const controls of ["off", "on"]) {
  test(`PLAYWRIGHT-STUDY-SESSION-40 ignores modified ArrowRight then rates normally with controls ${controls}`, async ({
    page,
  }) => {
    let original: unknown;
    await test.step("Given: first of three fixed cards with controls configured", async () => {
      await open(page, "study", "pilot", { controls });
      await expect(page.getByRole("button", { name: "Hello", exact: true })).toBeVisible();
      await expect(page.getByText("1 / 3", { exact: true })).toBeVisible();
      await expect(page.getByRole("slider")).toHaveValue("0");
      await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Swipe right: Good", exact: true })).toHaveCount(
        Number(controls === "on")
      );
      original = await callScenario(page, "study", "snapshot");
    });
    await test.step("When: deliver Ctrl, Meta and Alt ArrowRight", async () => {
      for (const modifier of ["ctrlKey", "metaKey", "altKey"]) {
        const result = await page.evaluate((key) => {
          let delivered = false;
          const received = () => {
            delivered = true;
          };
          addEventListener("keydown", received, { once: true });
          const event = new KeyboardEvent("keydown", {
            key: "ArrowRight",
            [key]: true,
            bubbles: true,
            cancelable: true,
          });
          document.body.dispatchEvent(event);
          removeEventListener("keydown", received);
          return { delivered, prevented: event.defaultPrevented };
        }, modifier);
        expect(result).toEqual({ delivered: true, prevented: false });
        await expect(page.getByRole("button", { name: "Hello", exact: true })).toBeVisible();
        await expect(page.getByText("1 / 3", { exact: true })).toBeVisible();
        expect(await callScenario(page, "study", "snapshot")).toEqual(original);
      }
    });
    await test.step("Then: one unmodified direction rates once and updates the real card", async () => {
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("button", { name: "Second", exact: true })).toBeVisible();
      await expect(page.getByText("2 / 3", { exact: true })).toBeVisible();
      await expect(page.getByRole("slider")).toHaveValue("1");
      const snapshot = (await callScenario(page, "study", "snapshot")) as {
        cards: { fsrs: unknown }[];
        session: { currentIndex: number };
      };
      expect(snapshot.session.currentIndex).toBe(1);
      expect(snapshot.cards[0]?.fsrs).not.toBeNull();
      const answers = (await readEvents(page)).filter((event) => event.name === "writeStudyAnswer");
      expect(answers).toHaveLength(1);
      expect(answers[0]?.args[0]).toMatchObject({ cardId: "contract-card-0", rating: "good" });
    });
  });
}

test("PLAYWRIGHT-STUDY-SESSION-42 shows right-direction feedback and expires it within two seconds", async ({
  page,
}) => {
  await test.step("Given: visible feedback is enabled for a ready real study session", async () => {
    const now = Date.UTC(2026, 6, 1, 12);
    await page.clock.install({ time: new Date(now) });
    await page.clock.pauseAt(new Date(now + 1_000));
    await open(page, "study", "feedback");
    await expect(page.getByRole("button", { name: "Hello", exact: true })).toBeVisible();
  });
  await test.step("When: rate the first card Good using the right direction", async () => {
    await page.getByRole("button", { name: "Swipe right: Good", exact: true }).click();
  });
  await test.step("Then: the nondismissible feedback shows the mapped icon and the real rating advances", async () => {
    await expect(page.getByRole("status").filter({ hasText: "Swiped right" })).toBeVisible();
    const icon = page.getByTestId("swipe-feedback-direction");
    await expect(icon).toHaveAttribute("data-swipe-feedback-direction", "cardSwipeRight");
    await expect(icon).toBeVisible();
    await expect(page.getByRole("button", { name: "Dismiss notification", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Second", exact: true })).toBeVisible();
    const saved = await callScenario<{ cards: { fsrs: { reps: number } | null }[] }>(page, "study", "snapshot");
    expect(saved.cards[0]?.fsrs?.reps).toBe(1);
    const answers = (await readEvents(page)).filter((event) => event.name === "writeStudyAnswer");
    expect(answers).toHaveLength(1);
    expect(answers[0]?.args[0]).toMatchObject({ cardId: "contract-card-0", rating: "good" });
  });
  await test.step("When: two seconds elapse", async () => {
    await page.clock.runFor(2_000);
  });
  await test.step("Then: feedback and its direction icon have disappeared", async () => {
    await expect(page.getByRole("status").filter({ hasText: "Swiped right" })).toHaveCount(0);
    await expect(page.getByTestId("swipe-feedback-direction")).toHaveCount(0);
  });
});

test("PLAYWRIGHT-STUDY-SESSION-START-16 updates the open start screen across the public review minute", async ({
  page,
}) => {
  let dueMinute = 0;
  await test.step("Given: an anonymous deck has one Easy-rated card and one unstudied card", async () => {
    await open(page, "study", "review-deadline");
    const nextReview = await page
      .getByRole("term")
      .filter({ hasText: /^Next review$/ })
      .locator("..")
      .locator("dd")
      .textContent();
    dueMinute = Date.parse(nextReview ?? "");
    expect(Number.isFinite(dueMinute)).toBe(true);
    await page.getByRole("button", { name: "tango", exact: true }).click();
    await page.getByRole("button", { name: "Study new cards in Japanese verbs", exact: true }).click();
    await expect(page.getByRole("button", { name: "Start 1 card", exact: true })).toBeEnabled();
  });
  await test.step("When: the clock is one minute before the public review minute and the screen receives focus", async () => {
    await page.clock.install({ time: new Date(dueMinute - 60_000) });
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  });
  await test.step("Then: the reviewed card remains excluded", async () => {
    await expect(page.getByRole("button", { name: "Start 1 card", exact: true })).toBeEnabled();
  });
  await test.step("When: two minutes pass while the start screen remains open", async () => {
    await page.clock.runFor(120_000);
  });
  await test.step("Then: both cards can start and the due card is first", async () => {
    await expect(page.getByRole("button", { name: "Start 2 cards", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Start 2 cards", exact: true }).click();
    await expect(page.getByRole("button", { name: "Hello", exact: true })).toBeVisible();
  });
});
