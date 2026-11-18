import { expect, requireDocument, test } from "./utils/fixtures";
import { createAnonymousDeck, startAnonymousStudy } from "./utils/ui-helpers";
import type { Page } from "@playwright/test";

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

test("NAVIGATION-03 Generic recovery offers only reload and preserves anonymous data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { deck, first, uid } =
    await test.step("Given: An anonymous account with saved cards and recovery URL context", async () => {
      await fixture.apply(page, { auth: false, preferences: false });
      const { deck, first } = await createAnonymousDeck(page);
      await page.goto("/account");
      const uid = await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").innerText();
      await page.goto("/settings?recovery=reload#preserved");
      return { deck, first, uid };
    });
  await test.step("When: Trigger a render failure after selecting Japanese", async () => {
    await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
    await page.evaluate(() => {
      localStorage.setItem("recovery-marker", "keep");
      sessionStorage.setItem("recovery-marker", "keep");
    });
    browserErrors.allow(/E2E_RENDER_FAILURE/);
    await failNextThemeUpdate(page);
    await page.getByRole("checkbox", { name: "ダークモード" }).locator("xpath=parent::label").click();
  });
  const { preferences } =
    await test.step("Then: Localized recovery offers reload and explains anonymous-data risk", async () => {
      await expect(page.getByRole("heading", { name: "問題が発生しました" })).toBeVisible();
      await expect(page.getByText(/再読み込みしてお試しください/)).toBeVisible();
      await expect(page.getByText(/匿名データは復元できません/)).toBeVisible();
      await expect(page.getByRole("button", { name: /ローカルデータを削除|Clear local data/ })).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
      const preferences = await page.evaluate(() => localStorage.getItem("tango-config"));
      return { preferences };
    });
  await test.step("When: Choose Reload on the recovery screen", async () => {
    await page.getByRole("button", { name: "再読み込み", exact: true }).click();
  });
  await test.step("Then: Settings and both storage markers survive with the same URL", async () => {
    await expect(page).toHaveURL(/\/settings\?recovery=reload#preserved$/);
    await expect(page.getByRole("heading", { name: "設定", exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    expect(await page.evaluate(() => localStorage.getItem("recovery-marker"))).toBe("keep");
    expect(await page.evaluate(() => sessionStorage.getItem("recovery-marker"))).toBe("keep");
  });
  await test.step("When: Open the account screen", async () => {
    await page.goto("/account");
  });
  await test.step("Then: The same anonymous identity remains", async () => {
    await expect(page.getByText(uid, { exact: true })).toBeVisible();
  });
  await test.step("When: Open the anonymous deck", async () => {
    await page.goto(`/deck/${deck.id}`);
  });
  await test.step("Then: Its saved card remains available", async () => {
    await expect(page.getByText(first.frontText, { exact: true })).toBeVisible();
  });
});

test("NAVIGATION-04 recovers after an unhandled browser error without clearing saved preferences", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const preferences = await test.step("Given: the full application is running with saved preferences", async () => {
    await fixture.apply(page);
    browserErrors.allow(/E2E_UNHANDLED_FAILURE/u);
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    return page.evaluate(() => localStorage.getItem("tango-config"));
  });
  await test.step("When: an unhandled browser error interrupts the application", async () => {
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error("E2E_UNHANDLED_FAILURE");
      }, 0);
    });
  });
  await test.step("Then: recovery offers Reload and preserves the saved preferences", async () => {
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear local data and reload" })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
  });
  await test.step("When: choose Reload", async () => {
    await page.getByRole("button", { name: "Reload", exact: true }).click();
  });
  await test.step("Then: Settings becomes usable again", async () => {
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  });
});

test("NAVIGATION-05 Corrupt PWA cache shows manual recovery guidance without deleting data", async ({
  fixture,
  page,
  browserErrors,
}) => {
  const { deck, card, deckBefore, cardBefore, preferences, assetPath, cachedResponse } =
    await test.step("Given: A remote deck with saved data and a corrupted cached startup asset", async () => {
      const deck = fixture.deck();
      const card = fixture.card();
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
        for (const request of await cache.keys()) {
          if (!new URL(request.url).pathname.endsWith(".js")) continue;
          const response = await cache.match(request);
          if (!response) continue;
          const source = await response.text();
          // Keep React and recovery usable while corrupting a startup effect in the actual cached application.
          const corrupted = source.replace(
            /\.classList\.toggle\((["'`])dark\1\s*,/,
            '.classList.toggle("E2E INVALID CACHE TOKEN",'
          );
          if (corrupted === source) continue;
          await cache.put(request, new Response(corrupted, { headers: response.headers }));
          return new URL(request.url).pathname;
        }
        throw new Error("Could not find the cached startup class token");
      });
      browserErrors.allow(/E2E INVALID CACHE TOKEN/);

      const cachedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === assetPath);
      return { deck, card, deckBefore, cardBefore, preferences, assetPath, cachedResponse };
    });
  await test.step("When: Reload the corrupted application from its service worker", async () => {
    await page.reload();
  });
  await test.step("Then: Startup recovery replaces the deck list", async () => {
    expect((await cachedResponse).fromServiceWorker()).toBe(true);
    await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toHaveCount(0);
  });
  await test.step("When: Choose Reload while the corrupt cached asset remains", async () => {
    await Promise.all([page.waitForEvent("load"), page.getByRole("button", { name: "Reload", exact: true }).click()]);
  });
  await test.step("Then: Manual recovery guidance preserves cached assets and saved user data", async () => {
    await expect(page.getByRole("heading", { name: "Something went wrong", exact: true })).toBeVisible();
    await expect(page.getByText(/delete Tango's site data in your browser's site settings/)).toBeVisible();
    await expect(page.getByText(/Anonymous data cannot be recovered/)).toBeVisible();
    await expect(page.getByRole("button", { name: /ローカルデータを削除|Clear local data/ })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("tango-config"))).toBe(preferences);
    expect(
      await page.evaluate(async (path) => {
        const response = await caches.match(path, { ignoreSearch: true });
        return (await response?.text())?.includes("E2E INVALID CACHE TOKEN") ?? false;
      }, assetPath)
    ).toBe(true);
    expect(await requireDocument("deck", deck.id)).toEqual(deckBefore);
    expect(await requireDocument("card", card.id)).toEqual(cardBefore);
  });
});

test("NAVIGATION-22 Clears anonymous local data after storage initialization fails", async ({ fixture, page }) => {
  const { deck, uid } =
    await test.step("Given: An anonymous account with saved study data and recovery URL context", async () => {
      await fixture.apply(page, { auth: false, preferences: false });
      await page.clock.setFixedTime(new Date("2026-01-02T03:04:05Z"));
      const { deck } = await createAnonymousDeck(page);
      await startAnonymousStudy(page, deck.id);
      await page.goto("/account");
      const uid = await page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd").innerText();
      await page.goto("/settings?recovery=local#preserved");
      return { deck, uid };
    });
  const { originalUrl, worker } =
    await test.step("When: Select Japanese, prepare storage markers and trigger a storage initialization failure", async () => {
      await page.getByRole("combobox", { name: "Language" }).selectOption("ja");
      await page.evaluate(async () => {
        localStorage.setItem("recovery-marker", "keep");
        sessionStorage.setItem("recovery-marker", "keep");
        for (const name of ["tango-card-replica", "recovery-other-database"]) {
          await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(name);
            request.onupgradeneeded = () => request.result.createObjectStore("recovery-marker");
            request.onsuccess = () => {
              request.result.close();
              resolve();
            };
            request.onerror = () => reject(request.error);
          });
        }
        sessionStorage.setItem("fail-storage-read", "true");
        await navigator.serviceWorker.ready;
        await (await caches.open("recovery-marker")).put("/recovery-marker", new Response("keep"));
      });
      await page.addInitScript(() => {
        // Fail conversion of the dates created through the UI, without accessing SDK storage or records.
        const getTime = Date.prototype.getTime;
        Date.prototype.getTime = function () {
          const value = getTime.call(this);
          if (sessionStorage.getItem("fail-storage-read") && value === Date.parse("2026-01-02T03:04:05Z")) {
            throw new Error("E2E_SAVED_DATE_FAILURE");
          }
          return value;
        };
      });
      const originalUrl = page.url();
      const worker = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL);
      await page.reload();
      return { originalUrl, worker };
    });
  await test.step("Then: Localized recovery offers local-data clearing", async () => {
    await expect(page.getByRole("button", { name: "ローカルデータを削除して再読み込み" })).toBeVisible();
  });
  await test.step("When: Remove the injected storage fault", async () => {
    await page.evaluate(() => sessionStorage.removeItem("fail-storage-read"));
  });
  await test.step("Then: Anonymous-data loss guidance remains visible", async () => {
    await expect(page.getByText(/匿名データは復元できません/)).toBeVisible();
  });
  await test.step("When: Choose Clear local data and reload", async () => {
    await page.getByRole("button", { name: "ローカルデータを削除して再読み込み" }).click();
  });
  await test.step("Then: Storage and preferences reset while URL, service worker and cached assets remain", async () => {
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page).toHaveURL(originalUrl);
    await expect(page.getByRole("combobox", { name: "Language" })).not.toHaveValue("ja");
    expect(await page.evaluate(async () => (await indexedDB.databases()).map(({ name }) => name))).not.toContain(
      "tango-card-replica"
    );
    expect(await page.evaluate(async () => (await indexedDB.databases()).map(({ name }) => name))).not.toContain(
      "recovery-other-database"
    );
    expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL)).toBe(worker);
    expect(await page.evaluate(() => localStorage.getItem("recovery-marker"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
    expect(await page.evaluate(async () => (await caches.match("/recovery-marker"))?.text())).toBe("keep");
  });
  await test.step("When: Open the account screen after recovery", async () => {
    await page.goto("/account");
  });
  await test.step("Then: A new anonymous identity replaces the previous account", async () => {
    await expect(page.getByText(uid, { exact: true })).toHaveCount(0);
    const newUid = page.getByText("User ID", { exact: true }).locator("xpath=parent::*").locator("dd");
    await expect(newUid).toHaveText(/\S+/);
    await expect(newUid).not.toHaveText(uid);
  });
  await test.step("When: Return to the deck list", async () => {
    await page.goto("/");
  });
  await test.step("Then: The previous local deck is absent", async () => {
    await expect(page.getByRole("article", { name: deck.name, exact: true })).toHaveCount(0);
  });
  await test.step("When: Reload the recovered deck list", async () => {
    await page.reload();
  });
  await test.step("Then: The fresh deck list remains usable without the old data", async () => {
    await expect(page.getByRole("heading", { name: "Decks", exact: true })).toBeVisible();
    await expect(page.getByRole("article", { name: deck.name, exact: true })).toHaveCount(0);
  });
});
