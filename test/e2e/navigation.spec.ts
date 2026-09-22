import type { Page } from "@playwright/test";
import { expect, requireDocument, test } from "./fixtures";

async function failNextThemeUpdate(page: Page): Promise<void> {
  await page.evaluate(() => {
    const toggle = DOMTokenList.prototype.toggle;
    DOMTokenList.prototype.toggle = function (token, force) {
      if (this === document.documentElement.classList && token === "dark") {
        DOMTokenList.prototype.toggle = toggle;
        throw new Error("E2E_RENDER_FAILURE");
      }
      return force === undefined ? toggle.call(this, token) : toggle.call(this, token, force);
    };
  });
}

test("NAVIGATION-01 An unknown route recovers to the Deck list", async ({ fixture, page, namespace }) => {
  await fixture.apply(page);

  await page.goto(`/${namespace.id("not-a-route")}`);
  const notFound = page.getByRole("heading", { level: 1, name: "Page not found" });
  await expect(notFound).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(notFound).toHaveCount(0);
});

test("NAVIGATION-02 Screen shortcuts navigate to their configured routes", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  const deckBefore = await requireDocument("deck", deck.id);
  const cardBefore = await requireDocument("card", card.id);

  await page.goto("/");
  await expect(page.getByRole("button", { name: `View ${deck.name}` })).toBeVisible();
  await page.keyboard.press("s");
  await expect(page).toHaveURL(/\/settings$/);

  await page.goto("/");
  await expect(page.getByRole("button", { name: `View ${deck.name}` })).toBeVisible();
  await page.keyboard.press("i");
  await expect(page).toHaveURL(/\/import$/);

  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  await page.keyboard.press("t");
  await expect(page).toHaveURL(/\/$/);

  await page.goto(`/deck/${deck.id}`);
  await expect(page.getByRole("button", { name: `View ${card.frontText}` })).toBeVisible();
  await page.keyboard.press("s");
  await expect(page).toHaveURL(/\/settings$/);

  expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
  expect(await requireDocument("card", card.id)).toEqual(cardBefore);
});

test("NAVIGATION-03 The outer error boundary keeps the locale and supports reload and explicit reset", async ({
  fixture,
  page,
  browserErrors,
}) => {
  await fixture.apply(page);
  await page.goto("/settings");
  await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  browserErrors.allow(/E2E_RENDER_FAILURE/);
  await failNextThemeUpdate(page);
  await page.getByRole("checkbox", { name: "ダークモード" }).locator("xpath=parent::label").click();
  await expect(page.getByRole("heading", { name: "問題が発生しました" })).toBeVisible();
  await expect(page.getByText(/再読み込みするか、キャッシュを削除して初期化してください。/)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.getByRole("button", { name: "再読み込み" }).click();
  await expect(page.getByRole("heading", { name: "設定", exact: true })).toBeVisible();

  await page.evaluate(async () => {
    localStorage.setItem("unrelated-reset-marker", "keep");
    const scope = `${window.location.origin}/`;
    await navigator.serviceWorker.ready;
    const name = (await caches.keys()).find((key) => key.startsWith("workbox-precache-") && key.endsWith(scope));
    if (!name) throw new Error("Expected Tango's precache");
    const cache = await caches.open(name);
    await cache.put("/__reset-marker__", new Response("stale"));
    const unrelated = await caches.open("unrelated-reset-cache");
    await unrelated.put("/__unrelated-reset-marker__", new Response("keep"));
  });
  await failNextThemeUpdate(page);
  await page.getByRole("checkbox", { name: "ダークモード" }).locator("xpath=parent::label").click();
  const reset = page.getByRole("button", { name: "キャッシュを削除して初期化" });
  await expect(reset).toBeVisible();
  const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
  page.once("dialog", (dialog) => dialog.dismiss());
  await reset.click();
  await expect(reset).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);

  page.once("dialog", (dialog) => dialog.accept());
  await reset.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(await page.evaluate(() => localStorage.getItem("unrelated-reset-marker"))).toBe("keep");
  expect(await page.evaluate(async () => (await caches.match("/__reset-marker__")) !== undefined)).toBe(false);
  expect(await page.evaluate(async () => (await caches.match("/__unrelated-reset-marker__"))?.text())).toBe("keep");
  await page.goto("/account");
  await expect(page.getByText("Anonymous account", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
});

test("NAVIGATION-04 Unavailable reset request storage does not prevent ordinary startup", async ({ fixture, page }) => {
  const { uid } = fixture.user();
  await fixture.apply(page, { preferences: { language: "ja" }, auth: { nextUid: `${uid}-reset` } });
  await page.goto("/account");
  await expect(page.getByText(uid, { exact: true })).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByRole("heading", { level: 1, name: "設定", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (this === sessionStorage && key === "tango-startup-reset") {
        throw new DOMException("Storage blocked", "SecurityError");
      }
      return getItem.call(this, key);
    };
  });

  await page.reload();

  await expect(page.getByRole("heading", { level: 1, name: "設定", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
  await expect(page.getByRole("heading", { name: "Tangoを起動できません" })).toHaveCount(0);
  await page.goto("/account");
  await expect(page.getByText(uid, { exact: true })).toBeVisible();
});

test("NAVIGATION-05 Unhandled browser errors share recovery without clearing data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  await fixture.apply(page);
  browserErrors.allow(/E2E_UNHANDLED_FAILURE|(?:page error: )?(?:null|undefined)/);
  for (const failure of ["timer", "promise", "string", "null", "undefined"] as const) {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
    await page.evaluate((kind) => {
      if (kind === "timer") {
        setTimeout(() => {
          throw new Error("E2E_UNHANDLED_FAILURE");
        }, 0);
      } else {
        const reason =
          kind === "promise"
            ? new Error("E2E_UNHANDLED_FAILURE")
            : kind === "string"
              ? "E2E_UNHANDLED_FAILURE"
              : kind === "null"
                ? null
                : undefined;
        void Promise.reject(reason);
      }
    }, failure);
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    await page.getByRole("button", { name: "Reload" }).click();
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  }
  await page.evaluate(async () => {
    window.dispatchEvent(new Event("error"));
    await Promise.reject(new Error("handled")).catch(() => undefined);
  });
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
});

test("NAVIGATION-06 Lazy application module failures show React recovery", async ({ fixture, page, browserErrors }) => {
  await fixture.apply(page);
  browserErrors.allow(/E2E_BOOTSTRAP_FAILURE/);
  // Replace only the lazy module, preserving the real entry, React root, and Boundary in both Vite modes.
  await page.route(/\/(?:src\/app\/bootstrap\.tsx|assets\/bootstrap-[^/]+\.js)(?:\?.*)?$/, (route) =>
    route.fulfill({ contentType: "application/javascript", body: 'throw new Error("E2E_BOOTSTRAP_FAILURE");' })
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reload" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear cache and reset" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(await page.evaluate(() => localStorage.getItem("tango-config"))).not.toBeNull();
});

test("NAVIGATION-07 Reset failure shows recovery without loading the normal application", async ({
  fixture,
  page,
  browserErrors,
}) => {
  await fixture.apply(page);
  browserErrors.allow(/E2E_RESET_FAILURE/);
  const bootstrapRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/(?:src\/app\/bootstrap\.tsx|assets\/bootstrap-[^/]+\.js)(?:\?.*)?$/.test(request.url()))
      bootstrapRequests.push(request.url());
  });
  await page.addInitScript(() => {
    sessionStorage.setItem("tango-startup-reset", "1");
    const removeItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key) {
      if (this === sessionStorage && key === "tango-startup-reset") throw new Error("E2E_RESET_FAILURE");
      removeItem.call(this, key);
    };
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear cache and reset" })).toBeVisible();
  expect(bootstrapRequests).toEqual([]);
  expect(
    await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((registrations) => registrations.length))
  ).toBe(0);
});
