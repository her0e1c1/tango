import { expect, requireDocument, test } from "./utils/fixtures";
import { readSession } from "./utils/study-helpers";

test("DECK-NAVIGATION-12 shows held review counts and opens existing study settings", async ({ fixture, page }) => {
  const deck = fixture.deck();
  await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
  const before = await requireDocument("deck", deck.id);
  await page.goto("/");
  await expect(page.getByRole("article", { name: deck.name, exact: true })).toBeVisible();
  await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
  await page.getByText("About counts", { exact: true }).click();
  await expect(page.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
  const review = page.getByRole("button", { name: `Review ${deck.name}`, exact: true });
  await review.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/deck/${deck.id}/start`);
  expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
  expect(await requireDocument("deck", deck.id)).toEqual(before);
});

test("DECK-NAVIGATION-13 updates the list when a review deadline arrives", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const future = fixture.card("card-future");
  await fixture.apply(page, { preferences: { study: { useCardInterval: true } } });
  const before = await requireDocument("card", future.id);
  const state = fixture.state.remote.cards.find((value) => value.id === future.id);
  if (!state?.fsrs) throw new Error("Expected a future review deadline");
  const deadline = new Date(state.fsrs.dueAt);
  await page.goto("/");
  await expect(page.getByRole("article", { name: deck.name, exact: true })).toBeVisible();
  await page.clock.install({ time: new Date(deadline.getTime() - 1000) });
  await page.clock.pauseAt(new Date(deadline.getTime() - 500));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("1 due · 1 new", { exact: true })).toHaveCount(2);
  await page.clock.runFor(500);
  await expect(page.getByText("2 due · 1 new", { exact: true })).toHaveCount(2);
  expect(await readSession(fixture.user().uid, deck.id)).toBeUndefined();
  expect(await requireDocument("card", future.id)).toEqual(before);
});
