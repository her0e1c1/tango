import type { Page } from "@playwright/test";

import { expect, readLocalData, requireDocument, test } from "./fixtures";
import { readSession } from "./study-helpers";

const readPreferences = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences);

const intervalDescription =
  "Seconds between cards. At 0, cards do not advance automatically, and the play/pause button and progress slider are hidden.";

test("SETTINGS-10 Zero autoplay interval is explained and saved without resetting other preferences", async ({
  fixture,
  page,
}) => {
  await fixture.apply(page, {
    preferences: { study: { defaultAutoPlay: true }, controls: { showPlaybackControls: true } },
  });
  await page.goto("/settings");
  const interval = page.getByRole("slider", { name: "Autoplay interval" });
  await expect(interval).toHaveValue("60");
  await expect(interval).toHaveAttribute("min", "0");
  await expect(interval).toHaveAttribute("max", "60");
  const preferences = await readPreferences(page);
  const savedData = await readLocalData(page);

  await interval.focus();
  await page.keyboard.press("Home");
  await expect(interval).toHaveValue("0");
  await expect(interval).toHaveAttribute("aria-valuetext", "No automatic advance (0 seconds)");
  await expect(interval).toHaveAccessibleDescription(intervalDescription);
  await expect(page.getByText(intervalDescription, { exact: true })).toBeVisible();
  await expect(page.getByText("No automatic advance (0s)", { exact: true })).toBeVisible();
  await expect
    .poll(() => readPreferences(page))
    .toEqual({ ...preferences, study: { ...preferences.study, cardInterval: 0 } });

  await page.reload();
  await expect(interval).toHaveValue("0");
  await expect(interval).toHaveAttribute("aria-valuetext", "No automatic advance (0 seconds)");
  await expect(interval).toHaveAccessibleDescription(intervalDescription);
  await expect(page.getByText("No automatic advance (0s)", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Start autoplay" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Show playback controls" })).toBeChecked();

  await interval.focus();
  await page.keyboard.press("End");
  await expect(interval).toHaveValue("60");
  await expect(interval).toHaveAttribute("aria-valuetext", "60 seconds");
  await expect(page.getByText("60s", { exact: true })).toBeVisible();
  await expect.poll(() => readPreferences(page)).toEqual(preferences);
  expect(await readLocalData(page)).toEqual(savedData);
});

test("SETTINGS-11 Restoring a positive interval preserves the active study session and playback preferences", async ({
  fixture,
  page,
}) => {
  const deck = fixture.deck();
  await page.clock.install();
  await fixture.apply(page, {
    preferences: {
      study: { cardInterval: 0, defaultAutoPlay: true, shuffled: false },
      controls: { showPlaybackControls: true },
    },
  });
  await page.goto(`/deck/${deck.id}/start`);
  await page.getByRole("button", { name: `Start ${String(fixture.state.remote.cards.length)} cards` }).click();
  await expect.poll(() => readSession(page, deck.id)).toMatchObject({ currentIndex: 0 });
  const session = await readSession(page, deck.id);
  if (session === undefined) throw new Error("Expected a newly started study session");
  const firstCard = fixture.state.remote.cards.find((card) => card.id === session.cardOrderIds[0]);
  const secondCard = fixture.state.remote.cards.find((card) => card.id === session.cardOrderIds[1]);
  if (firstCard === undefined || secondCard === undefined) throw new Error("Expected at least two study Cards");
  const preferences = await readPreferences(page);

  await expect(page.getByRole("button", { name: firstCard.frontText, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^(Play|Pause)$/ })).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Study progress" })).toHaveCount(0);
  await page.clock.runFor(1250);
  expect(await readSession(page, deck.id)).toEqual(session);
  await page.getByRole("button", { name: "Open study help" }).click();
  const help = page.getByRole("dialog", { name: "Study controls" });
  await expect(help.getByText("Autoplay is unavailable while the card interval is 0", { exact: true })).toBeVisible();
  await expect(
    help.getByText("Playback controls are unavailable while the card interval is 0", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Close help", exact: true }).click();
  // Exercise the page shortcut instead of activating the help button restored by focus management.
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.keyboard.press("Space");
  await page.clock.runFor(1250);
  expect(await readSession(page, deck.id)).toEqual(session);
  expect(await readPreferences(page)).toEqual(preferences);
  await expect(page.getByRole("button", { name: firstCard.frontText, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Swipe right", exact: true }).click();
  await expect(page.getByRole("button", { name: secondCard.frontText, exact: true })).toBeVisible();
  const continuedPosition = { sessionId: session.sessionId, cardOrderIds: session.cardOrderIds, currentIndex: 1 };
  await expect.poll(() => readSession(page, deck.id)).toMatchObject(continuedPosition);
  const deckBeforeSettings = await requireDocument("deck", deck.id);
  const cardsBeforeSettings = await Promise.all(
    fixture.state.remote.cards.map((card) => requireDocument("card", card.id))
  );

  await page.getByRole("button", { name: "Open card actions", exact: true }).click();
  await page.getByRole("button", { name: "Back to deck list", exact: true }).click();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const interval = page.getByRole("slider", { name: "Autoplay interval" });
  await expect(interval).toHaveValue("0");
  await interval.focus();
  await page.keyboard.press("End");
  const restoredPreferences = { ...preferences, study: { ...preferences.study, cardInterval: 60 } };
  await expect.poll(() => readPreferences(page)).toEqual(restoredPreferences);
  expect(await readSession(page, deck.id)).toMatchObject(continuedPosition);

  await page.goto("/");
  await page.getByRole("button", { name: `Continue ${deck.name}`, exact: true }).click();
  await expect(page.getByRole("button", { name: secondCard.frontText, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Study progress" })).toBeVisible();
  expect(await readSession(page, deck.id)).toMatchObject(continuedPosition);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  expect(await readPreferences(page)).toEqual(restoredPreferences);
  expect(await requireDocument("deck", deck.id)).toEqual(deckBeforeSettings);
  expect(await Promise.all(fixture.state.remote.cards.map((card) => requireDocument("card", card.id)))).toEqual(
    cardsBeforeSettings
  );
});
