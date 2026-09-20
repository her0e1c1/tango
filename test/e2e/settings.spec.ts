import { collectBrowserErrors, expect, test } from "./fixtures";

test("SETTINGS-01 Dark mode is auto-saved across reload", async ({ fixture, page }) => {
  const initialDarkMode = fixture.state.browser.preferences.appearance.darkMode;
  const expectedDarkMode = !initialDarkMode;
  await fixture.apply(page);
  await page.goto("/settings");

  const darkMode = page.getByRole("checkbox", { name: "Dark mode" });
  if (initialDarkMode) await expect(darkMode).toBeChecked();
  else await expect(darkMode).not.toBeChecked();
  await darkMode.locator("xpath=parent::label").click();
  if (expectedDarkMode) await expect(darkMode).toBeChecked();
  else await expect(darkMode).not.toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.appearance?.darkMode
      )
    )
    .toBe(expectedDarkMode);

  await page.reload();
  if (expectedDarkMode) {
    await expect(darkMode).toBeChecked();
    await expect(page.locator("html")).toHaveClass(/dark/);
  } else {
    await expect(darkMode).not.toBeChecked();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  }
});

test("SETTINGS-02 Maximum cards limits the next study session", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const numberOfCards = fixture.state.remote.cards.length;
  const expectedMaximum = numberOfCards - 1;
  if (expectedMaximum < 1) throw new Error("SETTINGS-02 fixture requires at least two Cards");
  if (expectedMaximum === fixture.state.browser.preferences.study.maxNumberOfCardsToLearn) {
    throw new Error("SETTINGS-02 fixture requires the changed maximum to differ from its initial preference");
  }
  const cardLabel = expectedMaximum === 1 ? "card" : "cards";
  await fixture.apply(page);
  await page.goto("/settings");

  const maximumCards = page.getByRole("slider", { name: "Maximum cards" });
  await maximumCards.fill(String(expectedMaximum));
  await expect(maximumCards).toHaveValue(String(expectedMaximum));
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study?.maxNumberOfCardsToLearn
      )
    )
    .toBe(expectedMaximum);

  await page.reload();
  await expect(maximumCards).toHaveValue(String(expectedMaximum));
  await page.goto(`/deck/${deck.id}/start`);
  await expect(
    page.getByRole("heading", { level: 2, name: `${String(expectedMaximum)} ${cardLabel} in this session` })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: `Start ${String(expectedMaximum)} ${cardLabel}` })).toBeVisible();
});

test("SETTINGS-04 Explicit Japanese language is auto-saved across reload", async ({ fixture, page }) => {
  await fixture.apply(page);
  await page.goto("/settings");

  const language = page.getByRole("combobox", { name: "Language" });
  await expect(language).toHaveValue("en");
  await language.selectOption("ja");

  const japaneseLanguage = page.getByRole("combobox", { name: "言語" });
  await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
  await expect(japaneseLanguage).toHaveValue("ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.language)
    )
    .toBe("ja");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
  await expect(japaneseLanguage).toHaveValue("ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "デッキ" })).toBeVisible();
  await page.getByRole("button", { name: "アクション", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "デッキを作成" })).toBeVisible();
});

test.describe("ja-JP browser locale", () => {
  test.use({ locale: "ja-JP" });

  test("SETTINGS-05 System language resolves the browser locale across reload", async ({ fixture, page }) => {
    await fixture.apply(page);
    await page.goto("/settings");

    const language = page.getByRole("combobox", { name: "Language" });
    await expect(language).toHaveValue("en");
    await language.selectOption("system");

    const systemLanguage = page.getByRole("combobox", { name: "言語" });
    await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
    await expect(systemLanguage).toHaveValue("system");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect
      .poll(() =>
        page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.language)
      )
      .toBe("system");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
    await expect(systemLanguage).toHaveValue("system");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });
});

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
      const page = await browser.newPage({ viewport, ...(baseURL === undefined ? {} : { baseURL }) });
      const errors = collectBrowserErrors(page.context(), baseURL);
      try {
        await fixture.apply(page, { preferences: { appearance: { darkMode } } });
        await page.goto("/");
        await page.getByRole("heading", { level: 1, name: "Decks" }).waitFor();
        await page.getByRole("button", { name: "Open settings", exact: true }).click();
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
        await interval.focus();
        await page.keyboard.press("Tab");
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
        await page.keyboard.press("Shift+Tab");
        await expect(interval).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(summary).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(details).toHaveAttribute("open");
        await captureFocus("open");
        await expect(details.getByText("Version", { exact: true })).toBeVisible();
        const commit = details.getByRole("link");
        if ((await commit.count()) > 0) {
          await expect(commit).toHaveAttribute("href", /\/commit\/[a-f0-9]+$/);
          await page.keyboard.press("Tab");
          await expect(commit).toBeFocused();
          await expect(summary).not.toBeFocused();
          await page.keyboard.press("Shift+Tab");
          await expect(summary).toBeFocused();
        } else {
          // Source archives can render the supported unknown-commit fallback without a link.
          await expect(details.getByText("unknown", { exact: true })).toBeVisible();
        }
        await page.keyboard.press("Enter");
        await expect(details).not.toHaveAttribute("open");
        await page.keyboard.press("Space");
        await expect(details).toHaveAttribute("open");
        await page.keyboard.press("Space");
        await expect(details).not.toHaveAttribute("open");
        await page.keyboard.press("Space");
        await expect(details).toHaveAttribute("open");
        expect(await readSavedData()).toEqual(saved);
        await page.reload();
        await expect(summary).toBeVisible();
        await expect(details).not.toHaveAttribute("open");
        expect(await readSavedData()).toEqual(saved);
        errors.assert();
      } finally {
        await page.close();
      }
    }
  }
});
