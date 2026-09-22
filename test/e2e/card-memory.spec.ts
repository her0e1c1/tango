import { expect, readLocalData, test } from "./fixtures";
import { readSession } from "./study-helpers";

test("CARD-VIEW-06 shows FSRS memory after a rating, reload, and offline navigation", async ({
  fixture,
  page,
  context,
}) => {
  const deck = fixture.deck();
  const card = fixture.card();
  await fixture.apply(page);
  await page.goto(`/card/${card.id}`);
  await expect(page.getByText("No FSRS memory state yet. It will appear after a rated study answer.")).toBeVisible();
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toHaveCount(0);
  await page.goto(`/deck/${deck.id}/start`);
  await page.getByRole("button", { name: "Start 2 cards" }).click();
  const session = await readSession(page, deck.id);
  const ratedId = session?.cardOrderIds[0];
  if (ratedId === undefined) throw new Error("Missing study card");
  await page.getByRole("button", { name: "Swipe right" }).click();
  await expect
    .poll(async () => (await readLocalData(page)).cardStudyStates.find((value) => value.cardId === ratedId)?.fsrs)
    .toBeDefined();
  await page.goto(`/card/${ratedId}`);
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  await expect(page.locator("p").filter({ hasText: /As of / })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  await context.setOffline(true);
  // Keep the loaded shell and exercise cached navigation without a server response.
  await page.evaluate(
    (id) => {
      window.history.pushState(window.history.state, "", `/card/${encodeURIComponent(id)}`);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    },
    card.id === ratedId ? fixture.card("card-2").id : card.id
  );
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  await context.setOffline(false);
});
