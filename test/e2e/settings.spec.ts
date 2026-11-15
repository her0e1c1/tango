import { expect, test } from "./utils/fixtures";
import type { Page } from "@playwright/test";

const readPreferences = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences);

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
  const { expectedDarkMode, darkMode, expectedPreferences } =
    await test.step("Given: Dark mode matches the saved appearance preference", async () => {
      const initialDarkMode = fixture.state.browser.preferences.appearance.darkMode;
      const expectedDarkMode = !initialDarkMode;
      await fixture.apply(page, { preferences: { study: { maxNumberOfCardsToLearn: 0, cardInterval: 3 } } });
      await page.goto("/settings");

      const darkMode = page.getByRole("checkbox", { name: "Dark mode" });
      await expect(darkMode).toBeChecked({ checked: initialDarkMode });
      await expect(page.getByRole("slider", { name: "Maximum cards" })).toHaveValue("0");
      await expect(page.getByRole("slider", { name: "Autoplay interval" })).toHaveValue("3");
      const preferences = await readPreferences(page);
      const expectedPreferences = {
        ...preferences,
        appearance: { ...preferences.appearance, darkMode: expectedDarkMode },
      };
      return { expectedDarkMode, darkMode, expectedPreferences };
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
    await expect.poll(() => readPreferences(page)).toEqual(expectedPreferences);
  });
  await test.step("When: Reload settings", async () => {
    await page.reload();
  });
  await test.step("Then: The checkbox and page theme restore the saved mode", async () => {
    await expect(darkMode).toBeChecked({ checked: expectedDarkMode });
    await expect(page.locator("html")).toHaveClass(expectedDarkMode ? /dark/ : /^(?!.*\bdark\b).*$/);
    await expect(page.getByRole("slider", { name: "Maximum cards" })).toHaveValue("0");
    await expect(page.getByRole("slider", { name: "Autoplay interval" })).toHaveValue("3");
    expect(await readPreferences(page)).toEqual(expectedPreferences);
  });
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
