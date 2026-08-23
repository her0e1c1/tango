import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import { routeAnonymousAuth, seedConfig } from "../e2e/fixtures";

interface ProductionIsolation {
  firestoreRequests: number;
}

const isExpectedIsolationError = (message: ConsoleMessage, isolation: ProductionIsolation) => {
  if (isolation.firestoreRequests === 0) return false;
  if (message.text().includes("status of 418")) {
    return message.location().url.startsWith("https://firestore.googleapis.com/");
  }
  const text = message.text();
  return (
    text.includes("@firebase/firestore: Firestore") &&
    text.includes("Could not reach Cloud Firestore backend.") &&
    text.includes("FirebaseError: [code=unavailable]") &&
    text.includes("The client will operate in offline mode")
  );
};

const isolateProductionData = async (page: Page, isolation: ProductionIsolation) => {
  await routeAnonymousAuth(page, "production-smoke");
  await seedConfig(page);

  // Hosting smoke must exercise production assets without reading or mutating production user data.
  await page.route("https://firestore.googleapis.com/**", async (route) => {
    isolation.firestoreRequests += 1;
    await route.fulfill({
      status: 418,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: 418, message: "Production data is isolated from smoke tests." } }),
    });
  });
};

test.beforeEach(async ({ page }) => {
  const unexpectedErrors: string[] = [];
  const isolation = { firestoreRequests: 0 };
  page.on("console", (message) => {
    if (message.type() === "error" && !isExpectedIsolationError(message, isolation)) {
      unexpectedErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => unexpectedErrors.push(error.message));

  await isolateProductionData(page, isolation);
  await page.exposeFunction("assertNoBrowserErrors", () => expect(unexpectedErrors).toEqual([]));
});

test("serves the application shell and hashed assets", async ({ page, request }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  const assetPaths = await page
    .locator('script[src^="/assets/"], link[href^="/assets/"]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("src") ?? element.getAttribute("href")));
  expect(assetPaths.length).toBeGreaterThan(0);
  const responses = await Promise.all(
    assetPaths.map((assetPath) => {
      expect(assetPath).not.toBeNull();
      return request.get(assetPath ?? "");
    })
  );
  for (const response of responses) {
    expect(response.ok()).toBe(true);
  }
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("renders a representative read-only route", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("serves the SPA fallback and recovers from an unknown route", async ({ page }) => {
  const response = await page.goto("/production-smoke-unknown-route");

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});
