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
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  await page.keyboard.press("s");
  await expect(page).toHaveURL(/\/settings$/);

  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
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

test("NAVIGATION-03 The outer error boundary keeps the locale and supports reload and cache recovery", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { uid } = fixture.user();
  await fixture.apply(page);
  await page.goto("/settings");
  await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  browserErrors.allow(/E2E_RENDER_FAILURE/);
  await failNextThemeUpdate(page);
  await page.getByRole("checkbox", { name: "ダークモード" }).locator("xpath=parent::label").click();
  await expect(page.getByRole("heading", { name: "問題が発生しました" })).toBeVisible();
  await expect(page.getByText(/再読み込みするか、アプリのキャッシュを削除して再読み込みしてください。/)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.getByRole("button", { name: "再読み込み", exact: true }).click();
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
  const reset = page.getByRole("button", { name: "キャッシュを削除して再読み込み" });
  await expect(reset).toBeVisible();
  const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
  await reset.click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { level: 1, name: "設定", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
  expect(await page.evaluate(() => localStorage.getItem("unrelated-reset-marker"))).toBe("keep");
  expect(await page.evaluate(async () => (await caches.match("/__reset-marker__")) !== undefined)).toBe(false);
  expect(await page.evaluate(async () => (await caches.match("/__unrelated-reset-marker__"))?.text())).toBe("keep");
  await page.goto("/account");
  await expect(page.getByText(uid, { exact: true })).toBeVisible();
});

test("NAVIGATION-04 Unhandled browser errors share recovery without clearing data", async ({
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
        const reasons = {
          promise: new Error("E2E_UNHANDLED_FAILURE"),
          string: "E2E_UNHANDLED_FAILURE",
          null: null,
          undefined,
        };
        const reason = reasons[kind];
        void Promise.reject(reason);
      }
    }, failure);
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    await page.getByRole("button", { name: "Reload", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  }
  await page.evaluate(async () => {
    window.dispatchEvent(new Event("error"));
    await Promise.reject(new Error("handled")).catch(() => undefined);
  });
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
});

test("NAVIGATION-05 Corrupt PWA cache fails startup until cache recovery reloads the healthy application", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  const { uid } = fixture.user();
  await fixture.apply(page);
  const deckBefore = await requireDocument("deck", deck.id);
  const cardBefore = await requireDocument("card", card.id);
  await page.goto("/");
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));

  const assetPath = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const scope = `${window.location.origin}/`;
    const name = (await caches.keys()).find((key) => key.startsWith("workbox-precache-") && key.endsWith(scope));
    if (!name) throw new Error("Expected Tango's precache");
    const cache = await caches.open(name);
    const script = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
    if (!script) throw new Error("Expected the production application module");
    const pathname = new URL(script.src).pathname;
    const request = (await cache.keys()).find((key) => new URL(key.url).pathname === pathname);
    if (!request) throw new Error("Expected the cached application module");
    const response = await cache.match(request);
    if (!response) throw new Error("Expected the cached module response");
    const source = await response.text();
    // Keep React and the recovery UI usable, but corrupt a startup effect's class token in the real cached bundle.
    const corrupted = source.replace(
      /\.classList\.toggle\((["'`])dark\1\s*,/,
      '.classList.toggle("E2E INVALID CACHE TOKEN",'
    );
    if (corrupted === source) throw new Error("Could not corrupt the cached startup class token");
    await cache.put(request, new Response(corrupted, { headers: response.headers }));
    return pathname;
  });
  browserErrors.allow(/E2E INVALID CACHE TOKEN/);

  const cachedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === assetPath);
  await page.reload();
  expect((await cachedResponse).fromServiceWorker()).toBe(true);
  await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toHaveCount(0);

  await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: "Reload", exact: true }).click()]);
  await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear cache and reload", exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open cards in ${deck.name}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
  expect(
    await page.evaluate(async (path) => {
      const response = await caches.match(path, { ignoreSearch: true });
      return (await response?.text())?.includes("E2E INVALID CACHE TOKEN") ?? false;
    }, assetPath)
  ).toBe(false);
  await page.goto("/account");
  await expect(page.getByText(uid, { exact: true })).toBeVisible();
  expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
  expect(await requireDocument("card", card.id)).toEqual(cardBefore);
});
