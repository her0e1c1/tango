import { expect, test } from "@playwright/test";
import { getDocument, routeAnonymousAuth, seedConfig } from "./fixtures";

test("imports a local-only Deck without Firestore and restores it for list and study flows", async ({ page }) => {
  await routeAnonymousAuth(page, "local-import-user");
  await seedConfig(page);
  await page.goto("/import");

  await page.getByRole("radio", { name: /Local only/ }).check();
  await page.getByLabel("Upload a csv file").setInputFiles({
    name: "local-import.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('"local front","local back","tag","local-key"'),
  });
  await expect(page.getByText("1 create")).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "View local-import.csv" })).toBeVisible();
  const persisted = await page.evaluate(() => {
    const deckState = JSON.parse(window.localStorage.getItem("tango-local-decks") ?? "{}");
    const cardState = JSON.parse(window.localStorage.getItem("tango-local-cards") ?? "{}");
    return {
      deck: deckState.state?.localDecks?.[0],
      card: cardState.state?.localCards?.[0],
    };
  });
  expect(persisted.deck).toMatchObject({ name: "local-import.csv", localMode: true });
  expect(persisted.deck).not.toHaveProperty("uid");
  expect(persisted.card).toMatchObject({ deckId: persisted.deck.id, frontText: "local front" });
  expect(persisted.card).not.toHaveProperty("uid");
  await expect(getDocument("deck", persisted.deck.id)).rejects.toThrow("Firestore read failed: 404");
  await expect(getDocument("card", persisted.card.id)).rejects.toThrow("Firestore read failed: 404");

  await page.reload();
  await expect(page.getByRole("button", { name: "View local-import.csv" })).toBeVisible();
  await page.getByRole("button", { name: "Study local-import.csv" }).click();
  await page.getByRole("button", { name: "Start 1 card" }).click();
  await expect(page.getByText("local front")).toBeVisible();
});
