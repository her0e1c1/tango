import { expect, test } from "./fixtures";
import { readSession } from "./study-helpers";

test("SETTINGS-03 applies review scheduling to the next study session", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const dueCard = fixture.card("card-due");
  const futureCard = fixture.card("card-future");
  const unscheduledCard = fixture.card("card-unscheduled");
  await fixture.apply(page);
  await page.goto("/settings");

  const respectReviewSchedule = page.getByRole("checkbox", { name: "Respect review schedule" });
  await expect(respectReviewSchedule).not.toBeChecked();
  await respectReviewSchedule.locator("xpath=parent::label").click();
  await expect(respectReviewSchedule).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.study?.useCardInterval
      )
    )
    .toBe(true);

  await page.reload();
  await expect(respectReviewSchedule).toBeChecked();
  await page.goto(`/deck/${deck.id}/start`);
  await page.getByRole("button", { name: "Start 2 cards" }).click();

  const session = await readSession(page, deck.id);
  expect(session?.cardOrderIds).toHaveLength(2);
  expect(session?.cardOrderIds).toEqual(expect.arrayContaining([dueCard.id, unscheduledCard.id]));
  expect(session?.cardOrderIds).not.toContain(futureCard.id);
});
