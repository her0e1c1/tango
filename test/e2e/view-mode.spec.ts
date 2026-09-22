import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { readProgress, readSession } from "./study-helpers";

const enterViewMode = async (page: Page) => {
  await page.getByRole("button", { name: "Open card actions" }).click();
  await page.getByRole("button", { name: "View mode", exact: true }).click();
  await page.getByRole("button", { name: "Close card actions" }).click();
};

const readViewMode = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("tango-config") ?? "{}").state?.preferences?.controls?.viewMode);

const touchScroll = async (page: Page, surface: Locator) => {
  const box = await surface.boundingBox();
  if (box === null) throw new Error("Missing reading surface");
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  const x = box.x + box.width / 2;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 0, x, y: box.y + box.height * 0.8 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 0, x, y: box.y + box.height * 0.2 }],
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await session.detach();
};

const readLongFront = async (page: Page) => {
  const surface = page.getByRole("region", { name: "Card front text" });
  await expect(surface).toBeVisible();
  const box = await surface.boundingBox();
  if (box === null) throw new Error("Missing reading surface");
  await surface.hover();
  await page.mouse.wheel(0, box.height);
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await surface.focus();
  for (const key of ["ArrowDown", "Space", "PageDown"]) {
    await surface.press("Home");
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
    await surface.press(key);
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  }
  await surface.press("Home");
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
  await touchScroll(page, surface);
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  for (const key of ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Space", "PageDown", "PageUp"]) {
    await surface.focus();
    await page.keyboard.press(key);
  }
  for (const [dx, dy] of [
    [-80, 0],
    [80, 0],
    [0, -60],
    [0, 60],
  ]) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + (dx ?? 0), y + (dy ?? 0), { steps: 5 });
    await page.mouse.up();
    await expect(surface).toBeVisible();
  }
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await surface.focus();
  await surface.press("End");
  await expect
    .poll(() => surface.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1))
    .toBe(true);
  await expect.poll(() => readViewMode(page)).toBe(true);
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await surface.press("Home");
  await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
};

for (const scenario of [
  { id: "STUDY-CONTROLS-06", route: "study" },
  { id: "DECK-NAVIGATION-14", route: "view" },
]) {
  test(`${scenario.id} scrolls the entire front without gesture actions or accidental exit`, async ({
    fixture,
    page,
  }) => {
    const deck = fixture.deck();
    const card = fixture.card("card-1");
    await page.setViewportSize({ width: 320, height: 568 });
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    const before = await readProgress(card.id);
    await enterViewMode(page);
    await readLongFront(page);
    await expect(page).toHaveURL(`/deck/${deck.id}/${scenario.route}`);
    await expect(page.getByRole("region", { name: "Card front text" })).toContainText(card.frontText);
    expect(await readProgress(card.id)).toEqual(before);
    if (scenario.route === "study") {
      expect((await readSession(page, deck.id))?.currentIndex).toBe(0);
      await page.getByRole("button", { name: "Open study help" }).click();
      await expect(page.getByRole("dialog")).toContainText("Exit view mode and keep the front visible");
      await expect(page.getByRole("dialog")).toContainText("Space scrolls the front text");
    }
  });
}

for (const scenario of [
  { id: "STUDY-CONTROLS-07", route: "study", answer: "Study answer" },
  { id: "DECK-NAVIGATION-15", route: "view", answer: "Card answer" },
]) {
  test(`${scenario.id} exits view mode with a tap or Enter before flipping the card`, async ({ fixture, page }) => {
    const deck = fixture.deck();
    const card = fixture.card("card-1");
    await fixture.apply(page);
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    await enterViewMode(page);
    await page.getByRole("region", { name: "Card front text" }).getByText(card.frontText, { exact: true }).click();
    await expect.poll(() => readViewMode(page)).toBe(false);
    await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    await enterViewMode(page);
    await page.getByRole("region", { name: "Card front text" }).focus();
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter");
    await page.keyboard.up("Enter");
    await expect.poll(() => readViewMode(page)).toBe(false);
    await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("region", { name: scenario.answer })).toContainText(card.backText);
    await page.getByRole("region", { name: scenario.answer }).getByText(card.backText, { exact: true }).click();
    await expect(page.getByRole("region", { name: scenario.answer })).toHaveCount(0);
  });
}

for (const scenario of [
  { id: "STUDY-CONTROLS-08", route: "study", next: "Swipe right" },
  { id: "DECK-NAVIGATION-16", route: "view", next: "Next card" },
]) {
  test(`${scenario.id} keeps button actions and autoplay available in view mode`, async ({ fixture, page }) => {
    const deck = fixture.deck();
    const first = fixture.card("card-1");
    await fixture.apply(page, { preferences: { study: { cardInterval: 1 }, controls: { viewMode: true } } });
    await page.goto(`/deck/${deck.id}/${scenario.route}`);
    const before = await readProgress(first.id);
    await page.getByRole("button", { name: scenario.next, exact: true }).click();
    const surface = page.getByRole("region", { name: "Card front text" });
    await expect(surface).toContainText(fixture.card("card-2").frontText);
    await expect.poll(() => surface.evaluate((element) => element.scrollTop)).toBe(0);
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(surface).toContainText(fixture.card("card-3").frontText);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect.poll(() => readViewMode(page)).toBe(true);
    if (scenario.route === "view") expect(await readProgress(first.id)).toEqual(before);
    else await expect.poll(() => readProgress(first.id)).toEqual({ ...before, numberOfSeen: first.numberOfSeen + 1 });
  });
}

test("STUDY-CONTROLS-09 shares and persists view mode across Study and Deck viewing", async ({ fixture, page }) => {
  const deck = fixture.deck();
  await fixture.apply(page);
  await page.goto(`/deck/${deck.id}/study`);
  await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
  await enterViewMode(page);
  await page.reload();
  await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
  await page.goto(`/deck/${deck.id}/view`);
  await expect(page.getByRole("region", { name: "Card front text" })).toBeVisible();
  await page
    .getByRole("region", { name: "Card front text" })
    .getByText(fixture.card("card-1").frontText, { exact: true })
    .click();
  await page.goto(`/deck/${deck.id}/study`);
  await page.reload();
  await expect(page.getByRole("button", { name: fixture.card("card-1").frontText, exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Card front text" })).toHaveCount(0);
  await expect.poll(() => readViewMode(page)).toBe(false);
});
