import { expect, readLocalData, setDocument, test } from "./fixtures";
import { readSession } from "./study-helpers";

test("DECK-NAVIGATION-12 opens existing study setup from the Deck review counts", async ({ fixture, page }) => {
  const deck = fixture.deck();
  await fixture.apply(page, {
    preferences: { study: { useCardInterval: true, maxNumberOfCardsToLearn: 1, shuffled: true } },
  });
  await page.goto("/");
  const summary = page.getByRole("region", { name: "Review summary" });
  const review = page.getByRole("region", { name: "Review now", exact: true });
  await expect(summary.getByText("Due now: 1", { exact: true })).toBeVisible();
  await expect(summary.getByText("New: 1", { exact: true })).toBeVisible();
  await expect(summary.getByText(/currently available on this device/)).toBeVisible();
  await expect(review.getByText("3 cards", { exact: true })).toBeVisible();
  await expect(review.getByText("Due now: 1", { exact: true })).toBeVisible();
  await expect(review.getByText("New: 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Studying" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Other decks" })).toHaveCount(0);
  const before = await readLocalData(page);
  const button = review.getByRole("button", { name: `Review ${deck.name}`, exact: true });
  await button.focus();
  await button.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/deck/${deck.id}/start$`));
  await expect(page.getByRole("button", { name: "Start 1 card", exact: true })).toBeVisible();
  expect(await readSession(page, deck.id)).toBeUndefined();
  expect(await readLocalData(page)).toEqual(before);
});

test("DECK-NAVIGATION-13 refreshes Deck review counts at the exact deadline without saving", async ({ fixture, page }) => {
  const now = Date.now();
  const deadline = now + 60_000;
  const future = fixture.card("card-future");
  await page.clock.install({ time: new Date(now) });
  await fixture.seedRemote();
  // Keep the fixture's future Card close to the browser clock without changing the shared fixture.
  await setDocument("card", future.id, { ...future, nextSeeingAt: new Date(deadline) });
  await fixture.apply(page, { remote: false, preferences: { study: { useCardInterval: true } } });
  await page.goto("/");
  const summary = page.getByRole("region", { name: "Review summary" });
  const review = page.getByRole("region", { name: "Review now", exact: true });
  await expect(summary.getByText("Due now: 1", { exact: true })).toBeVisible();
  const before = await readLocalData(page);
  await page.clock.pauseAt(new Date(deadline - 1));
  await expect(summary.getByText("Due now: 1", { exact: true })).toBeVisible();
  await expect(review.getByText("Due now: 1", { exact: true })).toBeVisible();
  await page.clock.runFor(1);
  await expect(summary.getByText("Due now: 2", { exact: true })).toBeVisible();
  await expect(review.getByText("Due now: 2", { exact: true })).toBeVisible();
  await expect(summary.getByText("New: 1", { exact: true })).toBeVisible();
  expect(await readLocalData(page)).toEqual(before);
});
