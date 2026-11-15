import type { Page } from "@playwright/test";
import type { Preferences } from "@/entities/preference";
import { expect, test } from "./fixtures";
import { open, callScenario } from "./fixtures";

const account = (page: Page, params: Record<string, string> = {}) => open(page, "app", "account", params);
const operation = (linked: boolean) => (linked ? "Sign out" : "Sign in with Google");
const success = (linked: boolean) => (linked ? "Signed out." : "Signed in.");
const failure = (linked: boolean) => (linked ? "Unable to sign out." : "Unable to sign in.");
const finish = (page: Page, linked: boolean, failed = false) =>
  callScenario(page, "app", "finishAuth", { operation: linked ? "out" : "in", failure: failed });
const notify = (page: Page) => page.getByRole("status", { name: "Toast notifications" });

for (const linked of [false, true]) {
  const successId = linked ? "PLAYWRIGHT-ACCOUNT-02" : "PLAYWRIGHT-ACCOUNT-01";
  const pendingId = linked ? "PLAYWRIGHT-ACCOUNT-04" : "PLAYWRIGHT-ACCOUNT-03";
  test(`${successId} authentication success and received identity`, async ({ page }) => {
    await test.step("Given: the account and a successful external operation", () =>
      account(page, { linked: String(linked) }));
    await test.step("When: authentication is selected", () =>
      page.getByRole("button", { name: operation(linked), exact: true }).click());
    await test.step("Then: success is announced", async () => {
      await expect(notify(page)).toContainText(success(linked));
    });
    await test.step("When: the new identity arrives", () => callScenario(page, "app", "setAccount", !linked));
    await test.step("Then: its opposite operation is available", async () => {
      await expect(
        page.getByText(linked ? "Anonymous account" : "Signed in with Google", { exact: true })
      ).toBeVisible();
      await expect(page.getByRole("button", { name: operation(!linked), exact: true })).toBeEnabled();
    });
  });
  test(`${pendingId} pending authentication is busy and releases on completion`, async ({ page }) => {
    await test.step("Given: a deferred authentication response", () =>
      account(page, { linked: String(linked), mode: "pending" }));
    const button = page.getByRole("button", { name: operation(linked), exact: true });
    await test.step("When: authentication starts", () => button.click());
    await test.step("Then: the action is disabled and busy", async () => {
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute("aria-busy", "true");
    });
    await test.step("When: the response arrives", () => finish(page, linked));
    await test.step("Then: the action is available again", async () => {
      await expect(button).toBeEnabled();
    });
  });
  test(`PLAYWRIGHT-ACCOUNT-06 ${linked ? "linked" : "anonymous"} identity`, async ({ page }) => {
    await test.step("Given: the prepared identity", () => account(page, { linked: String(linked) }));
    await test.step("Then: identity fields and only the relevant operation are displayed", async () => {
      for (const text of linked
        ? ["Signed in with Google", "Test User", "linked-user"]
        : ["Anonymous account", "Not available", "anonymous-user"])
        await expect(page.getByText(text, { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: operation(linked), exact: true })).toBeEnabled();
      await expect(page.getByRole("button", { name: operation(!linked), exact: true })).toHaveCount(0);
    });
  });
  test(`PLAYWRIGHT-ACCOUNT-10 failed ${linked ? "sign-out" : "sign-in"} can be retried`, async ({ page }) => {
    await test.step("Given: failure followed by external success", () =>
      account(page, { linked: String(linked), mode: "retry" }));
    await test.step("When: authentication fails", () =>
      page.getByRole("button", { name: operation(linked), exact: true }).click());
    await test.step("Then: its failure is visible", async () => {
      await expect(page.getByRole("alert")).toContainText(failure(linked));
    });
    await test.step("When: the operation is retried", () =>
      page.getByRole("button", { name: operation(linked), exact: true }).click());
    await test.step("Then: the error is removed and success announced", async () => {
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(notify(page)).toContainText(success(linked));
    });
  });
  test(`PLAYWRIGHT-ACCOUNT-12 late ${linked ? "sign-out" : "sign-in"} failure stays on Home`, async ({ page }) => {
    await test.step("Given: authentication awaits a response", () =>
      account(page, { linked: String(linked), mode: "pending" }));
    await test.step("When: authentication starts and the user leaves", async () => {
      await page.getByRole("button", { name: operation(linked), exact: true }).click();
      await page.keyboard.press("t");
    });
    await test.step("Then: Home is displayed", async () => {
      await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    });
    await test.step("When: the response fails", () => finish(page, linked, true));
    await test.step("Then: the original failure is announced without navigation", async () => {
      await expect(page.getByRole("alert")).toContainText(failure(linked));
      await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    });
  });
  for (const failed of [false, true]) {
    test(`PLAYWRIGHT-ACCOUNT-14 ${linked ? "sign-out" : "sign-in"} ${failed ? "failure" : "success"} survives reentry`, async ({
      page,
    }) => {
      await test.step("Given: a deferred authentication operation", () =>
        account(page, { linked: String(linked), mode: "pending" }));
      await test.step("When: authentication starts, then Account is left and reopened", async () => {
        await page.getByRole("button", { name: operation(linked), exact: true }).click();
        await page.keyboard.press("t");
        await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Open account" }).click();
      });
      await test.step("Then: the original operation is still pending", async () => {
        await expect(page.getByRole("button", { name: operation(linked), exact: true })).toBeDisabled();
      });
      await test.step("When: the original response finishes", () => finish(page, linked, failed));
      await test.step("Then: its result is visible and the button releases", async () => {
        if (failed) await expect(page.getByRole("alert")).toContainText(failure(linked));
        else await expect(notify(page)).toContainText(success(linked));
        await expect(page.getByRole("button", { name: operation(linked), exact: true })).toBeEnabled();
      });
      await test.step("When: authentication is retried", async () => {
        await callScenario(page, "app", "prepareRetry");
        await page.getByRole("button", { name: operation(linked), exact: true }).click();
      });
      await test.step("Then: the new operation succeeds", async () => {
        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(notify(page)).toContainText(success(linked));
      });
    });
  }
}

test("PLAYWRIGHT-ACCOUNT-05 Japanese Account retains its profile", async ({ page }) => {
  await test.step("Given: Japanese and a linked identity", () => account(page, { linked: "true", locale: "ja" }));
  await test.step("Then: the heading and operation are translated", async () => {
    await expect(page.getByRole("heading", { name: "アカウント" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ログアウト" })).toBeEnabled();
    await expect(page.getByText("Test User", { exact: true })).toBeVisible();
  });
});
test("PLAYWRIGHT-ACCOUNT-08 changing language preserves profile fields", async ({ page }) => {
  await test.step("Given: the linked English Account", () => account(page, { linked: "true" }));
  await test.step("When: Japanese is selected", () => callScenario(page, "app", "language", "ja"));
  await test.step("Then: only fixed copy is translated", async () => {
    for (const text of ["Test User", "linked-user", "表示名", "Googleでログイン済み"])
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "アカウント" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ログアウト" })).toBeEnabled();
  });
});
test("PLAYWRIGHT-ACCOUNT-07 concurrent authentication has independent pending state", async ({ page }) => {
  await test.step("Given: both responses are deferred", () => account(page, { mode: "pending" }));
  await test.step("When: sign-in starts, linked identity arrives, then sign-out starts", async () => {
    await page.getByRole("button", { name: "Sign in with Google" }).click();
    await callScenario(page, "app", "setAccount", true);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await finish(page, false);
  });
  await test.step("Then: sign-in completion leaves sign-out pending", async () => {
    await expect(notify(page)).toContainText("Signed in.");
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeDisabled();
  });
  await test.step("When: sign-out completes and a new anonymous identity arrives", async () => {
    await finish(page, true);
    await callScenario(page, "app", "receiveIdentity", { uid: "next-anonymous-user", linked: false });
  });
  await test.step("Then: the new identity can sign in", async () => {
    await expect(notify(page)).toContainText("Signed out.");
    await expect(page.getByText("next-anonymous-user", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });
});
test("PLAYWRIGHT-ACCOUNT-11 a visible sign-in failure survives leaving Account", async ({ page }) => {
  await test.step("Given: failed sign-in", async () => {
    await account(page, { mode: "failure" });
    await page.getByRole("button", { name: "Sign in with Google" }).click();
    await expect(page.getByRole("alert")).toContainText("Unable to sign in.");
  });
  await test.step("When: Home is opened", () => page.keyboard.press("t"));
  await test.step("Then: Home and the failure remain visible", async () => {
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Unable to sign in.");
  });
});
test("PLAYWRIGHT-ACCOUNT-13 Japanese authentication result", async ({ page }) => {
  await test.step("Given: Japanese Account", () => account(page, { locale: "ja" }));
  await test.step("When: sign-in succeeds", () => page.getByRole("button", { name: "Googleでログイン" }).click());
  await test.step("Then: the result is announced in Japanese", async () => {
    await expect(page.getByRole("status", { name: "トースト通知" })).toContainText("ログインしました。");
  });
});
for (const leave of [false, true])
  for (const failSave of [false, true]) {
    test(`PLAYWRIGHT-ACCOUNT-15 card ${failSave ? "failure" : "success"} and sign-out refusal ${leave ? "on Home" : "inline"}`, async ({
      page,
    }) => {
      const cardMessage = failSave ? "Unable to save changes. Try again." : "Updated card “Saved content”.";
      const logoutMessage =
        "Unable to sign out. If changes are pending, reconnect and let them sync before trying again.";
      await test.step("Given: the real Card save action waits for external I/O", async () => {
        await account(page, { mode: "concurrent", save: failSave ? "failure" : "success" });
        await callScenario(page, "app", "beginCardSave");
      });
      await test.step("When: sign-out starts, then Card result precedes sign-out refusal", async () => {
        await page.getByRole("button", { name: "Sign out", exact: true }).click();
        if (leave) await page.keyboard.press("t");
        await callScenario(page, "app", "finishCardAndSignOut");
      });
      await test.step("Then: both independent results remain on the user's current page", async () => {
        await expect(
          page.getByRole("heading", { level: 1, name: leave ? "Decks" : "Account", exact: true })
        ).toBeVisible();
        await expect(page.getByText(logoutMessage, { exact: true })).toBeVisible();
        await expect(page.getByText(cardMessage, { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Dismiss notification" })).toHaveCount(leave ? 2 : 1);
        await expect(
          page.getByRole("button", { name: "Dismiss notification", description: cardMessage })
        ).toBeVisible();
        if (leave)
          await expect(
            page.getByRole("button", { name: "Dismiss notification", description: logoutMessage })
          ).toBeVisible();
        await expect(notify(page)).toHaveAttribute("aria-atomic", "false");
      });
    });
  }
for (const boundary of ["visit", "identity"]) {
  test(`PLAYWRIGHT-ACCOUNT-15 inline refusal is limited to its ${boundary}`, async ({ page }) => {
    await test.step("Given: inline sign-out refusal", async () => {
      await account(page, { linked: "true", mode: "failure" });
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(page.getByRole("alert")).toContainText("Unable to sign out.");
    });
    await test.step("When: the original boundary ends and Account returns", async () => {
      if (boundary === "visit") {
        await page.keyboard.press("t");
        await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Open account" }).click();
      } else {
        await callScenario(page, "app", "setAccount", false);
        await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
        await callScenario(page, "app", "setAccount", true);
      }
    });
    await test.step("Then: the old inline refusal is absent", async () => {
      await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
    });
  });
}

for (const variant of ["account", "settings"]) {
  const id = variant === "account" ? "PLAYWRIGHT-ACCOUNT-09" : "PLAYWRIGHT-SETTINGS-11";
  test(`${id} home shortcut`, async ({ page }) => {
    await test.step("Given: the real page", () => open(page, "app", variant));
    await test.step("When: t is pressed", () => page.keyboard.press("t"));
    await test.step("Then: Decks is shown", async () => {
      await expect(page.getByRole("heading", { level: 1, name: "Decks", exact: true })).toBeVisible();
    });
  });
}
test("PLAYWRIGHT-CARD-LIST-10 real AuthProvider hides unconfirmed data", async ({ page }) => {
  await test.step("Given: a real app authentication gate with a ready Card fixture behind it", () =>
    open(page, "app", "gate"));
  await test.step("Then: startup is shown without either empty-card message", async () => {
    await expect(page.getByRole("heading", { name: "Starting Tango…" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No cards yet" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "No cards match the active filters" })).toHaveCount(0);
  });
  await test.step("When: authentication is confirmed", () => callScenario(page, "app", "authenticate"));
  await test.step("Then: the stored Card becomes usable", async () => {
    await expect(page.getByRole("button", { name: "View Hello", exact: true })).toBeVisible();
  });
});
test("PLAYWRIGHT-NOT-FOUND-01 unknown route is explained", async ({ page }) => {
  await test.step("Given: an unknown application route", () => open(page, "app", "not-found"));
  await test.step("Then: recovery is available", async () => {
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Go home" })).toBeEnabled();
  });
});
test("PLAYWRIGHT-NOT-FOUND-02 unknown route can return to a usable Deck list", async ({ page }) => {
  await test.step("Given: an unknown application route", () => open(page, "app", "not-found"));
  await test.step("When: Go home is selected", () => page.getByRole("button", { name: "Go home" }).click());
  await test.step("Then: Deck list and study action are usable", async () => {
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Study Japanese verbs" })).toBeEnabled();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Page not found" })).toHaveCount(0);
  });
});

test("PLAYWRIGHT-SETTINGS-01 system language follows the Japanese browser", async ({ page }) => {
  await test.step("Given: system language and Japanese browser locale", () =>
    open(page, "app", "settings", { locale: "ja", system: "true" }));
  await test.step("Then: Japanese copy keeps System selected", async () => {
    await expect(page.getByRole("heading", { level: 1, name: "設定", exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "言語" })).toHaveValue("system");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  });
});
test("PLAYWRIGHT-SETTINGS-02 playback can toggle in both directions", async ({ page }) => {
  await test.step("Given: playback controls are enabled", async () => {
    await open(page, "app", "settings");
    await expect(page.getByRole("checkbox", { name: "Show playback controls" })).toBeChecked();
  });
  const checkbox = page.getByRole("checkbox", { name: "Show playback controls" });
  await test.step("When: playback is disabled", () => checkbox.locator("xpath=parent::label").click());
  await test.step("Then: playback is unchecked", async () => {
    await expect(checkbox).not.toBeChecked();
  });
  await test.step("When: playback is enabled again", () => checkbox.locator("xpath=parent::label").click());
  await test.step("Then: playback is checked", async () => {
    await expect(checkbox).toBeChecked();
  });
});
test("PLAYWRIGHT-SETTINGS-03 swipe visibility changes independently", async ({ page }) => {
  await test.step("Given: swipe, playback and details are enabled", async () => {
    await open(page, "app", "settings");
    await expect(page.getByRole("checkbox", { name: "Show swipe controls" })).toBeChecked();
  });
  await test.step("When: swipe visibility is disabled", () =>
    page.getByRole("checkbox", { name: "Show swipe controls" }).locator("xpath=parent::label").click());
  await test.step("Then: playback and details remain enabled", async () => {
    await expect(page.getByRole("checkbox", { name: "Show swipe controls" })).not.toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Show playback controls" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Show card details" })).toBeChecked();
  });
});
test("PLAYWRIGHT-SETTINGS-04 settings owns preferences rather than account operations", async ({ page }) => {
  await test.step("Given: Settings", () => open(page, "app", "settings"));
  await test.step("Then: sections and automatic-save guidance are visible without account fields", async () => {
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    for (const name of ["Language", "Appearance", "Study"])
      await expect(page.getByRole("region", { name, exact: true })).toBeVisible();
    await expect(page.getByText("Advanced", { exact: true })).toBeVisible();
    await expect(page.getByText("Changes are saved automatically")).toBeVisible();
    await expect(page.getByRole("form")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Account" })).toHaveCount(0);
    await expect(page.getByText("User ID", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /log in|log out|sign in|sign out/i })).toHaveCount(0);
  });
});
test("PLAYWRIGHT-SETTINGS-05 edited values update the actual Page", async ({ page }) => {
  await test.step("Given: the settings fixture", () => open(page, "app", "settings"));
  await test.step("When: Japanese is selected", () =>
    page.getByRole("combobox", { name: "Language", exact: true }).selectOption("ja"));
  await test.step("Then: language is applied", async () => {
    await expect(page.getByRole("heading", { level: 1, name: "設定", exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "言語" })).toHaveValue("ja");
    await expect(page.getByRole("combobox", { name: "言語" })).toContainText("日本語");
  });
  for (const name of ["再生コントロールを表示", "カードの詳細を表示", "スキップ操作を表示"]) {
    await test.step(`When: ${name} is disabled`, () =>
      page.getByRole("checkbox", { name, exact: true }).locator("xpath=parent::label").click());
    await test.step("Then: its current input reflects the change", async () => {
      await expect(page.getByRole("checkbox", { name, exact: true })).not.toBeChecked();
    });
  }
  await test.step("When: back-text swipe overlays are enabled and maximum cards becomes 31", async () => {
    await page.getByRole("checkbox", { name: "裏面のスワイプ操作を表示" }).locator("xpath=parent::label").click();
    const slider = page.getByRole("slider", { name: "最大カード数" });
    await slider.focus();
    await slider.press("Home");
    for (let i = 0; i < 31; i++) await slider.press("ArrowRight");
  });
  await test.step("Then: overlay explanation and localized value are available", async () => {
    await expect(page.getByRole("checkbox", { name: "裏面のスワイプ操作を表示" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "裏面のスワイプ操作を表示" })).toHaveAccessibleDescription(
      "回答の表示中に左右の学習操作を表示します"
    );
    await expect(page.getByRole("slider", { name: "最大カード数" })).toHaveValue("31");
    await expect(page.getByRole("slider", { name: "最大カード数" })).toHaveAttribute("aria-valuetext", "31枚");
    await expect(page.getByText("31", { exact: true })).toBeVisible();
  });
});
test("PLAYWRIGHT-SETTINGS-06 review guidance and version metadata", async ({ page }) => {
  await test.step("Given: Settings with review scheduling enabled", () => open(page, "app", "settings"));
  await test.step("Then: review and interval are explained", async () => {
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
  await test.step("Then: build version and commit are available", async () => {
    await expect(page.getByText("1.2.3", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "0123456" })).toHaveAttribute(
      "href",
      "https://github.com/her0e1c1/tango/commit/0123456789abcdef0123456789abcdef01234567"
    );
    await expect(page.getByText("Main branch", { exact: true })).toHaveCount(0);
  });
});
test("PLAYWRIGHT-SETTINGS-07 headings, labels and explanations remain associated", async ({ page }) => {
  await test.step("Given: Settings", () => open(page, "app", "settings"));
  await test.step("Then: each section owns its heading and hidden icons", async () => {
    for (const name of ["Language", "Appearance", "Study"]) {
      const region = page.getByRole("region", { name, exact: true });
      await expect(region).toHaveAttribute(
        "aria-labelledby",
        (await region.getByRole("heading", { name, exact: true }).getAttribute("id"))!
      );
      expect(
        await region
          .locator("svg")
          .evaluateAll((icons) => icons.every((icon) => icon.closest('[aria-hidden="true"]') !== null))
      ).toBe(true);
    }
    await expect(page.getByRole("checkbox", { name: "Dark mode" })).toHaveAccessibleDescription(
      "Use the darker Calm Focus palette"
    );
  });
});
test("PLAYWRIGHT-SETTINGS-08 Japanese labels and spoken values", async ({ page }) => {
  await test.step("Given: Japanese Settings", () => open(page, "app", "settings", { locale: "ja" }));
  await test.step("Then: controls have Japanese names and units", async () => {
    await expect(page.getByRole("checkbox", { name: "裏面のスワイプ操作を表示" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "ダークモード" })).toBeVisible();
    await expect(page.getByRole("slider", { name: "最大カード数" })).toHaveAttribute("aria-valuetext", "24枚");
    await expect(page.getByRole("slider", { name: "自動再生の間隔" })).toHaveAttribute("aria-valuetext", "7秒");
  });
});
for (const locale of ["en", "ja"]) {
  test(`PLAYWRIGHT-SETTINGS-09 maximum card boundaries ${locale}`, async ({ page }) => {
    await test.step("Given: all matching cards in Settings", () => open(page, "app", "settings-maximum", { locale }));
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
      test(`PLAYWRIGHT-SETTINGS-10 PLAYWRIGHT-SETTINGS-16 interval boundaries ${locale} autoplay=${autoplay} playback=${playback}`, async ({
        page,
      }) => {
        const { initialPreferences, initialData } =
          await test.step("Given: independent autoplay and playback settings", async () => {
            await open(page, "app", "settings-interval", {
              locale,
              autoplay: String(autoplay),
              playback: String(playback),
            });
            return {
              initialPreferences: await callScenario<Preferences>(page, "app", "preferencesSnapshot"),
              initialData: await callScenario<string>(page, "app", "dataSnapshot"),
            };
          });
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
            expect(await callScenario<Preferences>(page, "app", "preferencesSnapshot")).toEqual({
              ...initialPreferences,
              study: { ...initialPreferences.study, cardInterval: value },
            });
            expect(await callScenario<string>(page, "app", "dataSnapshot")).toBe(initialData);
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

test("PLAYWRIGHT-STUDY-HISTORY-08 30-day graph describes its period, scale and aggregate", async ({ page }) => {
  await test.step("Given: records inside and outside the 30-day period", () => open(page, "app", "history"));
  await test.step("Then: graph, period, scale and ten starts are displayed", async () => {
    await expect(page.getByText("Daily study counts", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "30 days", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("img", { name: /Starts and completions in the selected period/ })).toBeVisible();
    await expect(page.getByText(/Jun 2, 2026 – Jul 1, 2026/)).toBeVisible();
    await expect(page.getByText(/Scale: 0–/)).toBeAttached();
    await expect(page.getByText("Sessions started", { exact: true }).locator("..").getByRole("definition")).toHaveText(
      "10"
    );
  });
});
test("PLAYWRIGHT-STUDY-HISTORY-01 a preset updates its period and aggregate", async ({ page }) => {
  await test.step("Given: the 30-day history", () => open(page, "app", "history"));
  await test.step("When: 7 days is selected", () => page.getByRole("button", { name: "7 days", exact: true }).click());
  await test.step("Then: dates and both aggregates follow the preset", async () => {
    await expect(page.getByRole("button", { name: "7 days", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/Jun 25, 2026 – Jul 1, 2026/)).toBeVisible();
    await expect(page.getByText("Sessions started", { exact: true }).locator("..").getByRole("definition")).toHaveText(
      "7"
    );
    await expect(
      page.getByText("Sessions completed", { exact: true }).locator("..").getByRole("definition")
    ).toHaveText("3");
  });
});
test("PLAYWRIGHT-STUDY-HISTORY-02 explicit inclusive dates update history", async ({ page }) => {
  await test.step("Given: history period presets", () => open(page, "app", "history"));
  await test.step("When: June 29–30 is applied", async () => {
    await page.getByRole("button", { name: "Custom range" }).click();
    await page.getByLabel("Start date", { exact: true }).fill("2026-06-29");
    await page.getByLabel("End date", { exact: true }).fill("2026-06-30");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
  });
  await test.step("Then: the custom selection contains both dates' records", async () => {
    await expect(page.getByText("Jun 29, 2026 – Jun 30, 2026", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Custom range" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Sessions started", { exact: true }).locator("..").getByRole("definition")).toHaveText(
      "2"
    );
  });
});
test("PLAYWRIGHT-STUDY-HISTORY-09 a 90-day chart explains grouped counts", async ({ page }) => {
  await test.step("Given: history across 90 days", () => open(page, "app", "history", { days: "90" }));
  await test.step("Then: seven-day grouping and eleven starts are shown", async () => {
    await expect(page.getByText("Study counts per 7 days", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "90 days", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Sessions started", { exact: true }).locator("..").getByRole("definition")).toHaveText(
      "11"
    );
  });
});
test("PLAYWRIGHT-STUDY-HISTORY-03 expand the first thirty daily rows", async ({ page }) => {
  await test.step("Given: collapsed 90-day history", async () => {
    await open(page, "app", "history", { days: "90" });
    await expect(page.getByRole("table", { name: "Daily counts", includeHidden: true })).not.toBeVisible();
  });
  await test.step("When: daily counts are opened", () =>
    page.getByText("Show daily counts · 90 days", { exact: true }).click());
  await test.step("Then: thirty dates, counts and older navigation are shown", async () => {
    const table = page.getByRole("table", { name: "Daily counts" });
    await expect(table.getByRole("row")).toHaveCount(31);
    await expect(page.getByText("1–30 of 90 days", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Older dates" })).toBeEnabled();
    await expect(table.getByRole("row", { name: "Jul 1, 2026 1 1", exact: true })).toBeVisible();
  });
});
test("PLAYWRIGHT-STUDY-HISTORY-04 daily paging retains each older date's counts", async ({ page }) => {
  await test.step("Given: the first thirty days are expanded", async () => {
    await open(page, "app", "history", { days: "90" });
    await page.getByText("Show daily counts · 90 days", { exact: true }).click();
  });
  await test.step("When: older dates are selected", () => page.getByRole("button", { name: "Older dates" }).click());
  await test.step("Then: the second page replaces the first and newer navigation is available", async () => {
    const table = page.getByRole("table", { name: "Daily counts" });
    await expect(page.getByText("31–60 of 90 days", { exact: true })).toBeVisible();
    await expect(table.getByRole("row", { name: /Jul 1, 2026/ })).toHaveCount(0);
    await expect(table.getByRole("row", { name: "Jun 1, 2026 0 0", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Newer dates" })).toBeEnabled();
  });
});
for (const locale of ["en", "ja"]) {
  const id = locale === "ja" ? "PLAYWRIGHT-STUDY-HISTORY-06" : "PLAYWRIGHT-STUDY-HISTORY-05";
  test(`${id} session outcomes ${locale}`, async ({ page }) => {
    await test.step("Given: completed, abandoned and unfinished history", () =>
      open(page, "app", "history", { locale }));
    await test.step("Then: outcomes are distinct and deck names are preserved", async () => {
      for (const text of locale === "ja" ? ["完了", "中止", "未完了"] : ["Completed", "Abandoned", "Unfinished"])
        await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
      await expect(page.getByRole("listitem")).toHaveCount(3);
      if (locale === "ja")
        await expect(page.getByRole("heading", { name: "Japanese verbs", exact: true })).toHaveCount(3);
    });
  });
}
test("PLAYWRIGHT-STUDY-HISTORY-07 every recent session can be expanded", async ({ page }) => {
  await test.step("Given: ten recent sessions", () => open(page, "app", "history"));
  await test.step("When: all ten are requested", () =>
    page.getByRole("button", { name: "Show all 10 sessions" }).click());
  await test.step("Then: all sessions expose their deck and target-card count", async () => {
    await expect(page.getByRole("listitem")).toHaveCount(10);
    const list = page.getByRole("list", { name: "Recent study sessions" });
    await expect(page.getByRole("button", { name: "Show fewer sessions" })).toHaveAttribute("aria-expanded", "true");
    for (const item of await page.getByRole("listitem").all()) {
      await expect(item.getByRole("heading", { name: "Japanese verbs", exact: true })).toBeVisible();
      await expect(item.getByText("Target cards", { exact: true })).toBeVisible();
    }
    if (await list.count())
      await expect(page.getByRole("button", { name: "Show fewer sessions" })).toHaveAttribute(
        "aria-controls",
        (await list.getAttribute("id"))!
      );
  });
});

test("PLAYWRIGHT-ACCOUNT-18 pending sign-in uses the language at completion", async ({ page }) => {
  await test.step("Given: pending sign-in in English", async () => {
    await account(page, { mode: "pending" });
    await page.getByRole("button", { name: "Sign in with Google", exact: true }).click();
  });
  await test.step("When: Japanese is selected on Settings before the response", async () => {
    await page.getByRole("button", { name: "Open settings", exact: true }).click();
    await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("ja");
    await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
    await finish(page, false);
  });
  await test.step("Then: success uses the current language", async () => {
    await expect(page.getByRole("status", { name: "トースト通知" })).toHaveText("成功: ログインしました。");
    await expect(page.getByText("ログインしました。", { exact: true })).toBeVisible();
  });
});
test("PLAYWRIGHT-ACCOUNT-22 visible notification retains focus and its original deadline across a language change", async ({
  page,
}) => {
  await test.step("Given: a Japanese success notification with a focused dismiss control", async () => {
    await page.clock.install();
    await account(page, { mode: "pending" });
    await page.getByRole("button", { name: "Sign in with Google", exact: true }).click();
    await page.getByRole("button", { name: "Open settings", exact: true }).click();
    await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("ja");
    await finish(page, false);
    await expect(page.getByRole("status", { name: "トースト通知" })).toHaveText("成功: ログインしました。");
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    await page.clock.runFor(2000);
    await page.getByRole("button", { name: "通知を閉じる", exact: true }).focus();
  });
  await test.step("When: the visible notification language changes to English", () =>
    page.getByRole("combobox", { name: "言語", exact: true }).selectOption("en"));
  await test.step("Then: its text changes without duplicate, focus loss or renewed lifetime", async () => {
    const status = notify(page);
    await expect(status).toHaveText("Success: Signed in.");
    await expect(page.getByText("Signed in.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dismiss notification", exact: true })).toBeFocused();
    await page.clock.runFor(2000);
    await expect(status).toBeEmpty();
    await expect(page.getByRole("button", { name: "Dismiss notification", exact: true })).toHaveCount(0);
    await page.clock.resume();
  });
});
for (const viewport of [
  { width: 1100, height: 900 },
  { width: 360, height: 640 },
])
  for (const dark of [false, true]) {
    test(`PLAYWRIGHT-SETTINGS-12 Advanced keyboard focus ${viewport.width}px dark=${dark}`, async ({ page }) => {
      const saved = await test.step("Given: closed Advanced at the chosen viewport and palette", async () => {
        await page.setViewportSize(viewport);
        await open(page, "app", "settings", { dark: String(dark) });
        await expect(page.locator("details")).not.toHaveAttribute("open");
        return page.evaluate(() =>
          Object.fromEntries(
            ["tango-config", "tango-local-decks", "tango-local-cards", "tango-study"].map((key) => [
              key,
              localStorage.getItem(key),
            ])
          )
        );
      });
      const summary = page.locator("summary");
      const interval = page.getByRole("slider", { name: "Autoplay interval", exact: true });
      const ring = async () => {
        await expect(summary).toBeFocused();
        await expect(summary).toBeInViewport();
        const style = await summary.evaluate((element) => {
          const value = getComputedStyle(element);
          return {
            visible: element.matches(":focus-visible"),
            width: Number.parseFloat(value.outlineWidth),
            offset: Number.parseFloat(value.outlineOffset),
          };
        });
        expect(style.visible).toBe(true);
        expect(style.width).toBeGreaterThan(0);
        expect(style.offset + style.width).toBeLessThanOrEqual(0);
      };
      await test.step("When: Tab reaches Advanced from the interval", async () => {
        await interval.focus();
        await page.keyboard.press("Tab");
      });
      await test.step("Then: its closed focus outline is visible", ring);
      await test.step("When: Shift-Tab returns to the interval", () => page.keyboard.press("Shift+Tab"));
      await test.step("Then: the interval is focused", async () => {
        await expect(interval).toBeFocused();
      });
      await test.step("When: Tab and Enter expand Advanced", async () => {
        await page.keyboard.press("Tab");
        await expect(summary).toBeFocused();
        await page.keyboard.press("Enter");
      });
      await test.step("Then: its open focus outline and version are visible", async () => {
        await expect(page.locator("details")).toHaveAttribute("open");
        await ring();
        await expect(page.locator("details").getByText("Version", { exact: true })).toBeVisible();
      });
      await test.step("When: Tab traverses the commit link and Shift-Tab returns", async () => {
        const link = page.locator("details").getByRole("link");
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", /\/commit\/[a-f0-9]+$/);
        await page.keyboard.press("Tab");
        await expect(link).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(summary).toBeFocused();
      });
      for (const [key, expands] of [
        ["Enter", false],
        ["Space", true],
        ["Space", false],
        ["Space", true],
      ] as const) {
        await test.step(`When: ${key} toggles the disclosure`, () => page.keyboard.press(key));
        await test.step("Then: focus remains on the disclosure", async () => {
          await expect(summary).toBeFocused();
          if (expands) await expect(page.locator("details")).toHaveAttribute("open");
          else await expect(page.locator("details")).not.toHaveAttribute("open");
        });
      }
      await test.step("Then: the final disclosure is open without preference or data changes", async () => {
        await expect(page.locator("details")).toHaveAttribute("open");
        await expect(page.getByRole("slider", { name: "Autoplay interval" })).toHaveValue("7");
        await expect(page.getByRole("slider", { name: "Maximum cards" })).toHaveValue("24");
        await expect(page.getByRole("checkbox", { name: "Dark mode" })).toBeChecked({ checked: dark });
        expect(
          await page.evaluate(() =>
            Object.fromEntries(
              ["tango-config", "tango-local-decks", "tango-local-cards", "tango-study"].map((key) => [
                key,
                localStorage.getItem(key),
              ])
            )
          )
        ).toEqual(saved);
      });
    });
  }

test.describe("Japanese browser language", () => {
  test.use({ locale: "ja-JP" });
  for (const selected of ["ja", "system"]) {
    test(`PLAYWRIGHT-SETTINGS-14 ${selected} resolves Japanese and survives a real preference rehydration`, async ({
      page,
    }) => {
      await test.step("Given: explicit English Settings in a Japanese browser", async () => {
        await open(page, "app", "settings-system");
        await expect(page.getByRole("combobox", { name: "Language", exact: true })).toHaveValue("en");
      });
      await test.step("When: the language selection changes", () =>
        page.getByRole("combobox", { name: "Language", exact: true }).selectOption(selected));
      await test.step("Then: Japanese copy retains the selected preference", async () => {
        await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
        await expect(page.getByRole("combobox", { name: "言語", exact: true })).toHaveValue(selected);
        await expect(page.locator("html")).toHaveAttribute("lang", "ja");
        await expect
          .poll(() => callScenario<Preferences>(page, "app", "preferencesSnapshot"))
          .toMatchObject({ language: selected });
      });
      await test.step("When: the browser reloads the real persisted preference store", () => page.reload());
      await test.step("Then: Japanese and the selection are restored", async () => {
        await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
        await expect(page.getByRole("combobox", { name: "言語", exact: true })).toHaveValue(selected);
        await expect(page.locator("html")).toHaveAttribute("lang", "ja");
      });
      await test.step("When: the Deck list and Add menu are opened", async () => {
        await page.keyboard.press("t");
        await expect(page.getByRole("heading", { level: 1, name: "デッキ", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "追加", exact: true }).click();
      });
      await test.step("Then: deck creation is translated", async () => {
        await expect(page.getByRole("menuitem", { name: "デッキを作成", exact: true })).toBeVisible();
      });
    });
  }
});
