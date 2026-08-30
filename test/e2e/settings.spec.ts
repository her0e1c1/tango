import { expect, test } from "./fixtures";

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
