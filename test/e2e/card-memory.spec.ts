import { createAnonymousDeck } from "./ui-helpers";
import { expect, test } from "./fixtures";

test("CARD-VIEW-06 shows FSRS memory after a rating, reload, and offline navigation", async ({
  fixture,
  page,
  context,
}) => {
  await fixture.apply(page);
  const local = await createAnonymousDeck(page);
  const { deck, first: card } = local;

  await page.goto(`/card/${card.id}`);
  await expect(page.getByText("No FSRS memory state yet. It will appear after a rated study answer.")).toBeVisible();
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toHaveCount(0);
  await page.goto(`/deck/${deck.id}/start`);
  await page.getByRole("button", { name: "Start 2 cards" }).click();
  const frontText = await page.locator("#frontText").innerText();
  const rated = frontText === local.first.frontText ? local.first : local.second;
  const other = rated === local.first ? local.second : local.first;
  const ratedId = rated.id;
  await page.getByRole("button", { name: "Swipe right" }).click();
  await expect(page.getByText(other.frontText, { exact: true })).toBeVisible();
  await page.goto(`/card/${ratedId}`);
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  await expect(page.locator("p").filter({ hasText: /As of / })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  await context.setOffline(true);
  // Keep the loaded shell and exercise cached navigation without a server response.
  await page.evaluate((id) => {
    window.history.pushState(window.history.state, "", `/card/${encodeURIComponent(id)}`);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  }, other.id);
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole("img", { name: /Forgetting curve/ })).toBeVisible();
  await context.setOffline(false);
});
