import { expect, test } from "./fixtures";
import { open, readEvents } from "./fixtures";

for (const [variant, role, name, expected] of [
  ["tag", "button", "Remove TypeScript filter", { name: "remove", args: ["TypeScript"] }],
  ["style", "text", "Click this styled content", { name: "click", args: [] }],
  ["switch", "checkbox", "Interactive switch", { name: "switch", args: [] }],
] as const) {
  const id =
    variant === "tag" ? "PLAYWRIGHT-SHARED-02" : variant === "style" ? "PLAYWRIGHT-SHARED-03" : "PLAYWRIGHT-SHARED-05";
  test(`${id} ${variant} reports one user intent`, async ({ page }) => {
    await test.step("Given: the real component and its public callback", () => open(page, "shared", variant));
    await test.step("When: the control is activated", async () => {
      if (role === "text") await page.getByText(name).click();
      else if (role === "checkbox") await page.getByRole(role, { name }).locator("xpath=parent::label").click();
      else await page.getByRole(role, { name }).click();
    });
    await test.step("Then: the callback receives the exact intent once", async () => {
      if (variant === "switch") await expect(page.getByRole("checkbox", { name })).toBeChecked();
      await expect.poll(() => readEvents(page)).toEqual([expected]);
    });
  });
}

test("PLAYWRIGHT-SHARED-01 choosing a menu item closes it and reports once", async ({ page }) => {
  await test.step("Given: the closed document actions menu", () => open(page, "shared", "menu"));
  await test.step("When: the menu is opened", () =>
    page.getByRole("button", { name: "Open document actions" }).click());
  await test.step("Then: document actions are visible", async () => {
    await expect(page.getByRole("menu", { name: "Document actions" })).toBeVisible();
  });
  await test.step("When: Download is chosen", () => page.getByRole("menuitem", { name: "Download" }).click());
  await test.step("Then: Download is called once and the menu closes", async () => {
    await expect.poll(() => readEvents(page)).toEqual([{ name: "download", args: [] }]);
    await expect(page.getByRole("menu", { name: "Document actions" })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-SHARED-04 the range displays its new value and reports once", async ({ page }) => {
  await test.step("Given: the controlled range at 40", () => open(page, "shared", "slider"));
  const slider = page.getByRole("slider", { name: "Interactive slider" });
  await test.step("When: one keyboard increment is made", async () => {
    await slider.focus();
    await slider.press("ArrowRight");
  });
  await test.step("Then: 41 is displayed and reported once", async () => {
    await expect(slider).toHaveValue("41");
    await expect.poll(() => readEvents(page)).toEqual([{ name: "slider", args: ["41"] }]);
  });
});

for (const variant of ["layout", "app-layout"] as const) {
  const id = variant === "layout" ? "PLAYWRIGHT-SHARED-06" : "PLAYWRIGHT-SHARED-20";
  test(`${id} fixed header remains clear of scrolling content`, async ({ page }) => {
    await test.step("Given: eight sections below a fixed header", async () => {
      await page.setViewportSize({ width: 800, height: 300 });
      await open(page, "shared", variant);
    });
    const shell = page.getByRole("region", { name: "Application shell" });
    const header = page.locator("header");
    const first = page
      .getByRole("heading", { name: variant === "layout" ? "Section 1" : "Application section 1", exact: true })
      .locator("..");
    let top: number;
    await test.step("Then: the first section starts below the header", async () => {
      const [sectionBox, headerBox] = await Promise.all([first.boundingBox(), header.boundingBox()]);
      expect(sectionBox).not.toBeNull();
      expect(headerBox).not.toBeNull();
      expect(sectionBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
      top = headerBox!.y;
      if (variant === "app-layout") await expect(header).toHaveCSS("position", "fixed");
    });
    await test.step("When: the shell scrolls to its bottom", () =>
      shell.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      }));
    await test.step("Then: content scrolls but the header retains its viewport position", async () => {
      await expect.poll(() => shell.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      expect((await header.boundingBox())!.y).toBe(top!);
    });
  });
}

test("PLAYWRIGHT-SHARED-21 disabling the fixed header keeps normal flow", async ({ page }) => {
  await test.step("Given: the app layout with fixed header disabled", () =>
    open(page, "shared", "app-layout", { fixed: "false" }));
  await test.step("Then: the static header precedes content", async () => {
    const header = page.locator("header");
    await expect(header).toHaveCSS("position", "static");
    const [h, c] = await Promise.all([
      header.boundingBox(),
      page.getByRole("heading", { name: "Non-fixed application content" }).boundingBox(),
    ]);
    expect(c!.y).toBeGreaterThanOrEqual(h!.y + h!.height);
  });
});

test("PLAYWRIGHT-SHARED-07 setting row changes its switch and reports once", async ({ page }) => {
  await test.step("Given: a checked setting and an independent unchecked setting", () =>
    open(page, "shared", "settings-section"));
  await test.step("When: the first switch is toggled", () =>
    page.getByRole("checkbox", { name: "Show swipe controls" }).locator("xpath=parent::label").click());
  await test.step("Then: the switch is unchecked and reports once", async () => {
    await expect(page.getByRole("checkbox", { name: "Show swipe controls" })).not.toBeChecked();
    await expect.poll(() => readEvents(page)).toEqual([{ name: "swipe", args: [false] }]);
  });
});

test.describe("Repeated settings forms", () => {
  test.use({ disabledAccessibilityRules: ["landmark-unique"] });
  test("PLAYWRIGHT-SHARED-08 repeated settings forms retain independent accessible IDs", async ({ page }) => {
    await test.step("Given: two real settings forms", () => open(page, "shared", "multiple-settings"));
    await test.step("Then: every section owns its heading and explanations", async () => {
      for (const name of ["Language", "Appearance", "Study"]) {
        const regions = page.getByRole("region", { name, exact: true });
        await expect(regions).toHaveCount(2);
        for (const region of await regions.all()) {
          await expect(region).toHaveAttribute(
            "aria-labelledby",
            (await region.getByRole("heading", { name, exact: true }).getAttribute("id"))!
          );
        }
      }
      for (const region of await page.getByRole("region", { name: "Appearance", exact: true }).all()) {
        await expect(region.getByRole("checkbox", { name: "Dark mode" })).toHaveAccessibleDescription(
          "Use the darker Calm Focus palette"
        );
        expect(
          await region
            .locator("svg")
            .evaluateAll((icons) => icons.every((icon) => icon.closest('[aria-hidden="true"]') !== null))
        ).toBe(true);
      }
      const languages = page.getByRole("combobox", { name: "Language" });
      await expect(languages.nth(0)).not.toHaveAttribute("id", (await languages.nth(1).getAttribute("id"))!);
    });
  });
});

for (const linked of [false, true]) {
  test(`PLAYWRIGHT-SHARED-09 Account presentation reports ${linked ? "sign-out" : "sign-in"}`, async ({ page }) => {
    await test.step("Given: prepared Account props", () => open(page, "shared", "account", { linked: String(linked) }));
    await test.step("Then: the identity is visible", async () => {
      await expect(
        page.getByText(linked ? "Signed in with Google" : "Anonymous account", { exact: true })
      ).toBeVisible();
      await expect(page.getByText(linked ? "Maya Tanaka" : "Not available", { exact: true })).toBeVisible();
    });
    await test.step("When: the account operation is selected", () =>
      page.getByRole("button", { name: linked ? "Sign out" : "Sign in with Google" }).click());
    await test.step("Then: its public callback is called", async () => {
      await expect.poll(() => readEvents(page)).toEqual([{ name: linked ? "sign-out" : "sign-in", args: [] }]);
    });
  });
  test(`PLAYWRIGHT-SHARED-10 pending Account ${linked ? "sign-out" : "sign-in"} is busy`, async ({ page }) => {
    await test.step("Given: a pending Account operation", () =>
      open(page, "shared", "account", { linked: String(linked), pending: "true" }));
    await test.step("Then: the operation is disabled and announced busy", async () => {
      const button = page.getByRole("button", { name: linked ? "Sign out" : "Sign in with Google" });
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute("aria-busy", "true");
    });
  });
}

test("PLAYWRIGHT-SHARED-11 Japanese Account preserves its profile", async ({ page }) => {
  await test.step("Given: Japanese and a linked profile", () =>
    open(page, "shared", "account", { linked: "true", locale: "ja" }));
  await test.step("Then: fixed copy is translated and profile is unchanged", async () => {
    await expect(page.getByRole("heading", { level: 1, name: "アカウント" })).toBeVisible();
    await expect(page.getByText("Maya Tanaka", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "ログアウト" })).toBeEnabled();
  });
});

test("PLAYWRIGHT-SHARED-12 period picker emits a numeric preset and exposes custom dates", async ({ page }) => {
  await test.step("Given: the 30-day period picker", () => open(page, "shared", "period-picker"));
  await test.step("Then: 30 days is selected", async () => {
    await expect(page.getByRole("button", { name: "30 days", exact: true })).toHaveAttribute("aria-pressed", "true");
  });
  await test.step("When: 7 days is selected", () => page.getByRole("button", { name: "7 days", exact: true }).click());
  await test.step("Then: the numeric preset is reported", async () => {
    await expect.poll(() => readEvents(page)).toEqual([{ name: "period", args: [7] }]);
  });
  await test.step("When: custom dates are requested", () => page.getByRole("button", { name: "Custom range" }).click());
  await test.step("Then: Start date is visible", async () => {
    await expect(page.getByLabel("Start date", { exact: true })).toBeVisible();
  });
});

for (const locale of ["en", "ja"]) {
  test(`PLAYWRIGHT-SHARED-13 recent session statuses ${locale}`, async ({ page }) => {
    await test.step("Given: completed, abandoned and unfinished sessions", () =>
      open(page, "shared", "recent", { locale }));
    await test.step("Then: each result and missing ending time are visible", async () => {
      await expect(page.getByRole("listitem")).toHaveCount(3);
      for (const name of locale === "ja" ? ["未完了", "完了", "中止"] : ["Unfinished", "Completed", "Abandoned"])
        await expect(page.getByText(name, { exact: true })).toBeVisible();
      if (locale === "en") await expect(page.getByText("—", { exact: true })).toBeVisible();
      else await expect(page.getByRole("heading", { name: "最近のセッション" })).toBeVisible();
    });
  });
}

test("PLAYWRIGHT-SHARED-14 expanding recent sessions relates the button to its full list", async ({ page }) => {
  await test.step("Given: ten sessions with three initially displayed", async () => {
    await open(page, "shared", "recent", { more: "true" });
    await expect(page.getByRole("listitem")).toHaveCount(3);
  });
  await test.step("When: all sessions are requested", () =>
    page.getByRole("button", { name: "Show all 10 sessions", expanded: false }).click());
  await test.step("Then: all ten are in the controlled expanded list", async () => {
    await expect(page.getByRole("button", { name: "Show fewer sessions", expanded: true })).toHaveAttribute(
      "aria-controls",
      (await page.getByRole("list").getAttribute("id"))!
    );
    await expect(page.getByRole("listitem")).toHaveCount(10);
  });
});

for (const days of ["30", "90"]) {
  test(`PLAYWRIGHT-SHARED-15 summary component ${days}-day aggregate`, async ({ page }) => {
    await test.step("Given: the prepared chart data", () => open(page, "shared", "history-summary", { days }));
    await test.step("Then: the chart and aggregation unit are visible", async () => {
      await expect(page.getByRole("img")).toBeVisible();
      if (days === "90") await expect(page.getByText("Study counts per 7 days", { exact: true })).toBeVisible();
    });
  });
}
test("PLAYWRIGHT-SHARED-16 daily table expands and pages its prepared rows", async ({ page }) => {
  await test.step("Given: ninety prepared days with a collapsed table", async () => {
    await open(page, "shared", "history-table");
    await expect(page.getByRole("table", { includeHidden: true })).not.toBeVisible();
  });
  await test.step("When: daily counts are expanded", () =>
    page.getByText("Show daily counts · 90 days", { exact: true }).click());
  await test.step("Then: thirty rows and the header are visible", async () => {
    await expect(page.getByRole("row")).toHaveCount(31);
  });
  await test.step("When: older dates are selected", () => page.getByRole("button", { name: "Older dates" }).click());
  await test.step("Then: the second page is shown", async () => {
    await expect(page.getByText("31–60 of 90 days", { exact: true })).toBeVisible();
  });
});

test("PLAYWRIGHT-SHARED-17 SettingsForm reflects local values and supplied build metadata", async ({ page }) => {
  await test.step("Given: SettingsForm with fixed build metadata and prepared preferences", () =>
    open(page, "shared", "settings-form"));
  await test.step("Then: the form describes automatic saving and excludes account operations", async () => {
    await expect(page.getByText("Changes are saved automatically", { exact: true })).toBeVisible();
    for (const name of ["Language", "Appearance", "Study"])
      await expect(page.getByRole("region", { name, exact: true })).toBeVisible();
    await expect(page.getByRole("form")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Account" })).toHaveCount(0);
    await expect(page.getByText("User ID", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /log in|log out|sign in|sign out/i })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "Respect review schedule" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Respect review schedule" })).toHaveAccessibleDescription(
      "Hide cards until their next review time"
    );
    await expect(page.getByRole("slider", { name: "Autoplay interval" })).toHaveAttribute(
      "aria-valuetext",
      "7 seconds"
    );
  });
  await test.step("When: Advanced is opened", () => page.getByText("Advanced", { exact: true }).click());
  await test.step("Then: supplied version and commit are displayed", async () => {
    await expect(page.getByText("1.2.3", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "0123456", exact: true })).toHaveAttribute(
      "href",
      "https://github.com/her0e1c1/tango/commit/0123456789abcdef0123456789abcdef01234567"
    );
    await expect(page.getByText("Main branch", { exact: true })).toHaveCount(0);
  });
  await test.step("When: local Language is set to Japanese", () =>
    page.getByRole("combobox", { name: "Language", exact: true }).selectOption("ja"));
  await test.step("Then: the selected form value is Japanese", async () => {
    const language = page.getByRole("combobox", { name: "Language", exact: true });
    await expect(language).toHaveValue("ja");
    await expect(language.locator("option:checked")).toHaveText("日本語");
  });
  for (const [name, checked] of [
    ["Show playback controls", false],
    ["Show card details", false],
    ["Show skip control", false],
    ["Show back text swipe overlays", true],
  ] as const) {
    await test.step(`When: ${name} is toggled`, () =>
      page.getByRole("checkbox", { name, exact: true }).locator("xpath=parent::label").click());
    await test.step("Then: its local value changes", async () => {
      await expect(page.getByRole("checkbox", { name, exact: true })).toBeChecked({ checked });
    });
  }
  await test.step("When: maximum cards is changed to 31", async () => {
    const slider = page.getByRole("slider", { name: "Maximum cards" });
    await slider.focus();
    await slider.press("Home");
    for (let i = 0; i < 31; i++) await slider.press("ArrowRight");
  });
  await test.step("Then: the English local form displays 31 cards and the overlay explanation", async () => {
    await expect(page.getByRole("slider", { name: "Maximum cards" })).toHaveValue("31");
    await expect(page.getByRole("slider", { name: "Maximum cards" })).toHaveAttribute("aria-valuetext", "31 cards");
    await expect(page.getByText("31", { exact: true })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Show back text swipe overlays" })).toHaveAccessibleDescription(
      "Display left and right study actions while viewing an answer"
    );
  });
});

for (const locale of ["en", "ja"]) {
  test(`PLAYWRIGHT-SHARED-18 maximum card boundaries ${locale}`, async ({ page }) => {
    await test.step("Given: all matching cards in Settings", () =>
      open(page, "shared", "settings-boundaries", { locale, boundary: "maximum" }));
    const slider = page.getByRole("slider", { name: locale === "ja" ? "最大カード数" : "Maximum cards" });
    const all = locale === "ja" ? "条件に一致するすべてのカード" : "All matching cards";
    await test.step("Then: bounds and all-card guidance are exposed", async () => {
      await expect(slider).toHaveAttribute("min", "0");
      await expect(slider).toHaveAttribute("max", "100");
      await expect(slider).toHaveAccessibleDescription(
        locale === "ja" ? /0 は.*すべてのカード/ : /0 includes all cards matching tags and any active review schedule/
      );
    });
    for (const value of [0, 1, 2, 0]) {
      await test.step(`When: maximum becomes ${value}`, async () => {
        await slider.focus();
        await slider.press("Home");
        for (let i = 0; i < value; i++) await slider.press("ArrowRight");
      });
      await test.step("Then: visible and spoken counts agree", async () => {
        await expect(slider).toHaveAttribute(
          "aria-valuetext",
          value === 0 ? all : locale === "ja" ? `${value}枚` : `${value} card${value === 1 ? "" : "s"}`
        );
        await expect(page.getByText(value === 0 ? all : String(value), { exact: true })).toBeVisible();
      });
    }
  });
  for (const autoplay of [false, true])
    for (const playback of [false, true]) {
      test(`PLAYWRIGHT-SHARED-19 interval boundaries ${locale} autoplay=${autoplay} playback=${playback}`, async ({
        page,
      }) => {
        await test.step("Given: independent autoplay and playback settings", () =>
          open(page, "shared", "settings-boundaries", {
            locale,
            autoplay: String(autoplay),
            playback: String(playback),
          }));
        const slider = page.getByRole("slider", { name: locale === "ja" ? "自動再生の間隔" : "Autoplay interval" });
        await test.step("Then: interval bounds are exposed", async () => {
          await expect(slider).toHaveAttribute("min", "0");
          await expect(slider).toHaveAttribute("max", "60");
        });
        for (const value of [0, 1, 60]) {
          await test.step(`When: interval becomes ${value}`, async () => {
            await slider.focus();
            if (value === 60) await slider.press("End");
            else {
              await slider.press("Home");
              if (value === 1) await slider.press("ArrowRight");
            }
          });
          await test.step("Then: the interval is described without changing the other preferences", async () => {
            const spoken =
              locale === "ja"
                ? value === 0
                  ? "自動送りなし（0秒）"
                  : `${value}秒`
                : value === 0
                  ? "No automatic advance (0 seconds)"
                  : `${value} second${value === 1 ? "" : "s"}`;
            const visible = locale === "ja" ? spoken : value === 0 ? "No automatic advance (0s)" : `${value}s`;
            await expect(slider).toHaveAttribute("aria-valuetext", spoken);
            await expect(page.getByText(visible, { exact: true })).toBeVisible();
            await expect(
              page.getByRole("checkbox", { name: locale === "ja" ? "自動再生で開始" : "Start autoplay" })
            ).toBeChecked({ checked: autoplay });
            await expect(
              page.getByRole("checkbox", {
                name: locale === "ja" ? "再生コントロールを表示" : "Show playback controls",
              })
            ).toBeChecked({ checked: playback });
          });
        }
        await test.step("Then: zero interval explains both hidden controls", async () => {
          await expect(slider).toHaveAccessibleDescription(
            locale === "ja"
              ? /0秒では自動送りを行わず、再生／一時停止ボタンと進捗スライダーを表示しません/
              : /At 0, cards do not advance automatically, and the play\/pause button and progress slider are hidden/
          );
        });
      });
    }
}
