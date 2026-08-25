import type { Page } from "@playwright/test";
import { expect, readLocalData, test } from "./fixtures";

const readSampleState = async (page: Page, sampleDeckId: string) => {
  const { decks, cards } = await readLocalData(page);
  const sampleDecks = decks.filter((candidate: { id?: string }) => candidate.id === sampleDeckId);
  return {
    deckIds: sampleDecks.map(({ id }: { id: string }) => id),
    cardIds: cards
      .filter(({ deckId }: { deckId?: string }) => deckId === sampleDeckId)
      .map(({ id }: { id: string }) => id)
      .sort(),
  };
};

test("APP-01 Sample Deck is initialized once", async ({ fixture, page }) => {
  const sampleDeckId = fixture.id("sample-v1");
  expect(fixture.state.browser.preferences.loadSample).toBe(true);
  await fixture.apply(page);

  await page.goto("/");
  await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
  const initialSample = await readSampleState(page, sampleDeckId);
  expect(initialSample.deckIds).toHaveLength(1);
  expect(initialSample.cardIds.length).toBeGreaterThan(0);

  await page.reload();
  await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
  const reloadedSample = await readSampleState(page, sampleDeckId);
  expect(reloadedSample).toEqual(initialSample);
});

test("APP-02 An unknown route recovers to the Deck list", async ({ fixture, page, namespace }) => {
  await fixture.apply(page);

  await page.goto(`/${namespace.id("not-a-route")}`);
  const notFound = page.getByRole("heading", { level: 1, name: "Page not found" });
  await expect(notFound).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(notFound).toHaveCount(0);
});

test("APP-03 Authentication initialization recovers after Reload", async ({ browserErrors, fixture, page }) => {
  browserErrors.allow(/console error: .*E2E_AUTH_BOOTSTRAP_FAILURE/u);
  browserErrors.allow(
    /console error: Failed to load resource: .*\[http:\/\/auth\.app\.test:9099\/identitytoolkit\.googleapis\.com\/v1\/accounts:signUp/iu
  );
  await fixture.apply(page, { auth: { failSignUpOnce: true } });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Unable to start Tango" })).toBeVisible();
  await expect(page.getByText("Authentication could not be initialized.")).toBeVisible();
  await page.getByRole("button", { name: "Reload" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
});
