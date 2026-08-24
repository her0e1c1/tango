import { expect, routeAnonymousAuth, seedConfig, test } from "./fixtures";

test("APP-01 Sample Deck is initialized once", async ({ page, namespace }) => {
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page, { loadSample: true });

  await page.goto("/");
  await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
  const initialSample = await page.evaluate(() => {
    const decks = JSON.parse(localStorage.getItem("tango-local-decks") ?? "{}").state?.localDecks ?? [];
    const cards = JSON.parse(localStorage.getItem("tango-local-cards") ?? "{}").state?.localCards ?? [];
    const sampleDecks = decks.filter((candidate: { name?: string }) => candidate.name === "Sample Deck");
    const [sampleDeck] = sampleDecks;
    return {
      deckIds: sampleDecks.map(({ id }: { id: string }) => id),
      cardIds: cards
        .filter(({ deckId }: { deckId?: string }) => deckId === sampleDeck?.id)
        .map(({ id }: { id: string }) => id)
        .sort(),
    };
  });
  expect(initialSample.deckIds).toHaveLength(1);
  expect(initialSample.cardIds.length).toBeGreaterThan(0);

  await page.reload();
  await expect(page.getByText("Sample Deck", { exact: true })).toBeVisible();
  const reloadedSample = await page.evaluate(() => {
    const decks = JSON.parse(localStorage.getItem("tango-local-decks") ?? "{}").state?.localDecks ?? [];
    const cards = JSON.parse(localStorage.getItem("tango-local-cards") ?? "{}").state?.localCards ?? [];
    const sampleDecks = decks.filter((candidate: { name?: string }) => candidate.name === "Sample Deck");
    const [sampleDeck] = sampleDecks;
    return {
      deckIds: sampleDecks.map(({ id }: { id: string }) => id),
      cardIds: cards
        .filter(({ deckId }: { deckId?: string }) => deckId === sampleDeck?.id)
        .map(({ id }: { id: string }) => id)
        .sort(),
    };
  });
  expect(reloadedSample).toEqual(initialSample);
});

test("APP-02 An unknown route recovers to the Deck list", async ({ page, namespace }) => {
  await routeAnonymousAuth(page, namespace.uid);
  await seedConfig(page);

  await page.goto(`/${namespace.id("not-a-route")}`);
  const notFound = page.getByRole("heading", { level: 1, name: "Page not found" });
  await expect(notFound).toBeVisible();
  await page.getByRole("button", { name: "Go home" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
  await expect(notFound).toHaveCount(0);
});

test("APP-03 Authentication initialization recovers after Reload", async ({ page, namespace, browserErrors }) => {
  browserErrors.allow(/console error: .*E2E_AUTH_BOOTSTRAP_FAILURE/u);
  browserErrors.allow(
    /console error: Failed to load resource: .*\[http:\/\/auth\.app\.test:9099\/identitytoolkit\.googleapis\.com\/v1\/accounts:signUp/iu
  );
  await routeAnonymousAuth(page, namespace.uid, { failSignUpOnce: true });
  await seedConfig(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Unable to start Tango" })).toBeVisible();
  await expect(page.getByText("Authentication could not be initialized.")).toBeVisible();
  await page.getByRole("button", { name: "Reload" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
});
