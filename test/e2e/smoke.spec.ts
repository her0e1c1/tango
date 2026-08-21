import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { routeAnonymousAuth, seedConfig } from "./fixtures";

const smokeAuthUid = (testId: string) => {
  const digest = createHash("sha256").update(testId).digest("hex").slice(0, 16);
  return `smoke-e2e-${digest}`;
};

test.beforeEach(async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await routeAnonymousAuth(page, smokeAuthUid(testInfo.testId));
  await seedConfig(page);
  await page.exposeFunction("assertNoBrowserErrors", () => expect(errors).toEqual([]));
});

test("shows the deck list smoke screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("tango")).toBeVisible();
  await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
  const sampleState = await page.evaluate(() => {
    const preferences = JSON.parse(window.localStorage.getItem("tango-config") ?? "{}").state?.preferences;
    const decks = JSON.parse(window.localStorage.getItem("tango-local-decks") ?? "{}").state?.localDecks ?? [];
    const cards = JSON.parse(window.localStorage.getItem("tango-local-cards") ?? "{}").state?.localCards ?? [];
    const sampleDeck = decks.find((deck: { name?: string }) => deck.name === "Sample Deck");
    return {
      loadSample: preferences?.loadSample,
      localMode: sampleDeck?.localMode,
      createdAt: sampleDeck?.createdAt,
      cardCount: cards.filter((card: { deckId?: string }) => card.deckId === sampleDeck?.id).length,
    };
  });
  expect(sampleState).toMatchObject({ loadSample: false, localMode: true });
  expect(sampleState.cardCount).toBeGreaterThan(0);

  await page.reload();

  await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
  const reloadedCreatedAt = await page.evaluate(() => {
    const decks = JSON.parse(window.localStorage.getItem("tango-local-decks") ?? "{}").state?.localDecks ?? [];
    return decks.find((deck: { name?: string }) => deck.name === "Sample Deck")?.createdAt;
  });
  expect(reloadedCreatedAt).toBe(sampleState.createdAt);
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("shows settings and persists a device setting", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByText("Settings")).toBeVisible();
  const darkMode = page.locator('input[name="appearance.darkMode"]');
  await expect(darkMode).not.toBeChecked();
  await page.locator('input[name="appearance.darkMode"] + span').click();
  await expect(darkMode).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(window.localStorage.getItem("tango-config") ?? "{}").state?.preferences?.appearance?.darkMode
      )
    )
    .toBe(true);
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("shows the import screen", async ({ page }) => {
  await page.goto("/import");

  await expect(page.getByRole("heading", { level: 1, name: "Import decks", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Choose a CSV file", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "CSV format", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Sample", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add sample deck" })).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("read: recovers from an unknown route", async ({ page }) => {
  await page.goto("/unknown-route");

  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("read: recovers from a missing Deck", async ({ page }) => {
  await page.goto("/deck/missing-deck");

  await expect(page.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});

test("read: recovers from a missing Card", async ({ page }) => {
  await page.goto("/card/missing-card");

  await expect(page.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await page.evaluate(() => window.assertNoBrowserErrors());
});
