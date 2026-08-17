import { expect, test } from "@playwright/test";
import { getDocument, routeAnonymousAuth, seedConfig, seedDeckAndCards } from "./fixtures";

const offlineDeck = {
  id: "offline-persistence-deck",
  name: "Offline Deck",
  category: "English",
  uid: "offline-persistence-user",
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  scoreMax: null,
  scoreMin: null,
  selectedTags: [],
  tagAndFilter: false,
  convertToBr: false,
};

const offlineCard = {
  id: "offline-persistence-card",
  deckId: offlineDeck.id,
  uid: offlineDeck.uid,
  frontText: "offline apple",
  backText: "offline りんご",
  tags: [],
  uniqueKey: "offline-card-1",
  score: 0,
  numberOfSeen: 0,
  interval: 0,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
};

const firestorePort = process.env.VITE_DB_PORT ?? "8080";
const firestoreRequests = `http://db:${firestorePort}/**`;

const persistedFrontText = async () => {
  const document = await getDocument("card", offlineCard.id);
  // biome-ignore lint/suspicious/noUnnecessaryConditions: Biome ignores noUncheckedIndexedAccess; remove after biomejs/biome#11277.
  return document.fields.frontText?.stringValue;
};

test("restores cached data after reload and syncs an offline write after reconnecting", async ({ page }) => {
  await routeAnonymousAuth(page, offlineDeck.uid);
  await seedConfig(page);
  await seedDeckAndCards(offlineDeck, [offlineCard]);

  await page.goto("/");
  await expect(page.getByText(offlineDeck.name)).toBeVisible();
  await page.getByRole("button", { name: `View ${offlineDeck.name}` }).click();
  await expect(page.getByText(offlineCard.frontText)).toBeVisible();
  await page.goto("/");

  await page.route(firestoreRequests, (route) => route.abort("internetdisconnected"));
  await page.reload();

  await expect(page.getByText(offlineDeck.name)).toBeVisible();
  await page.getByRole("button", { name: `View ${offlineDeck.name}` }).click();
  await expect(page.getByText(offlineCard.frontText)).toBeVisible();

  await page.getByRole("button", { name: `Open actions for ${offlineCard.frontText}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.locator('textarea[name="frontText"]').fill("updated offline apple");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("button", { name: "Saving…" })).toBeDisabled();
  await expect.poll(persistedFrontText).toBe(offlineCard.frontText);

  await page.unroute(firestoreRequests);

  await expect(page).toHaveURL(new RegExp(`/deck/${offlineDeck.id}$`));
  await expect(page.getByText("updated offline apple")).toBeVisible();
  await expect.poll(persistedFrontText).toBe("updated offline apple");
});
