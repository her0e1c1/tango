import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { progressOf, readProgress, readSession } from "./study-helpers";

const revealAnswer = async (page: Page, frontText: string) => {
  await page.getByRole("button", { name: frontText, exact: true }).click();
  return page.getByRole("region", { name: "Study answer" });
};

const selectBackText = async (page: Page, backText: string) => {
  const textRect = await page.getByText(backText, { exact: true }).evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return { left: rect.left, right: rect.right, y: rect.top + rect.height / 2 };
  });
  await page.mouse.move(textRect.left + 1, textRect.y);
  await page.mouse.down();
  await page.mouse.move(textRect.right - 1, textRect.y, { steps: 5 });
  await page.mouse.up();
};

test("SWIPE-01 reveals the current Card answer without changing progress", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  const before = await readProgress(currentCard.id);
  const answerRegion = await revealAnswer(page, currentCard.frontText);

  await expect(answerRegion).toBeVisible();
  await expect(page.getByText(currentCard.backText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual(before);
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);
});

test("SWIPE-15 selects answer text without changing the Card state", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await revealAnswer(page, currentCard.frontText);
  await selectBackText(page, currentCard.backText);

  await expect(page.getByText(currentCard.backText, { exact: true })).toBeVisible();
  await expect
    .poll(async () => page.evaluate(() => window.getSelection()?.toString() ?? ""))
    .toContain(currentCard.backText);
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressOf(currentCard));
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);
});

test("SWIPE-18 returns to the same Card front when answer overlays are disabled", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await revealAnswer(page, currentCard.frontText);
  await expect(page.getByRole("button", { name: "Swipe left" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Swipe right" })).toHaveCount(0);
  await page.getByText(currentCard.backText, { exact: true }).click();

  await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(currentCard.backText, { exact: true })).toBeHidden();
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressOf(currentCard));
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);
});

test("SWIPE-19 scrolls a long answer without changing the Card state", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  const answerRegion = await revealAnswer(page, currentCard.frontText);
  const initialScroll = await answerRegion.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    scrollTop: element.scrollTop,
  }));
  expect(initialScroll.scrollHeight).toBeGreaterThan(initialScroll.clientHeight);
  expect(initialScroll.scrollTop).toBe(0);
  await answerRegion.hover();
  await page.mouse.wheel(0, initialScroll.clientHeight);

  await expect.poll(async () => answerRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(answerRegion).toContainText(currentCard.backText.split("\n").at(-1) ?? currentCard.backText);
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressOf(currentCard));
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);
});

test("SWIPE-20 runs the mapped left overlay action once and shows the next Card front", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await revealAnswer(page, currentCard.frontText);
  await page.getByRole("button", { name: "Swipe left" }).click();

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      score: currentCard.score + 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});

test("SWIPE-21 runs the mapped right overlay action once and shows the next Card front", async ({ fixture, page }) => {
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  const nextCard = fixture.card("card-2");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  await revealAnswer(page, currentCard.frontText);
  await page.getByRole("button", { name: "Swipe right" }).click();

  await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
  await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
  await expect
    .poll(() => readProgress(currentCard.id))
    .toEqual({
      score: currentCard.score - 1,
      numberOfSeen: currentCard.numberOfSeen + 1,
    });
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex + 1);
});

test("SWIPE-22 keeps the full answer width beneath overlays on a narrow viewport", async ({ fixture, page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  const answerRegion = await revealAnswer(page, currentCard.frontText);
  const answerContent = page.locator("[data-study-answer-content]");
  const backTextSurface = answerContent.locator(":scope > *").first();
  const leftOverlayButton = page.getByRole("button", { name: "Swipe left" });
  const rightOverlayButton = page.getByRole("button", { name: "Swipe right" });
  const answerText = page.getByText(currentCard.backText, { exact: true });
  const answerRegionBounds = await answerRegion.boundingBox();
  const backTextSurfaceBounds = await backTextSurface.boundingBox();
  const leftOverlayBounds = await leftOverlayButton.boundingBox();
  const rightOverlayBounds = await rightOverlayButton.boundingBox();
  if (
    answerRegionBounds == null ||
    backTextSurfaceBounds == null ||
    leftOverlayBounds == null ||
    rightOverlayBounds == null
  ) {
    throw new Error("Expected visible answer region, back text, and overlays");
  }

  expect(backTextSurfaceBounds.x).toBe(answerRegionBounds.x);
  expect(backTextSurfaceBounds.width).toBe(answerRegionBounds.width);
  expect(leftOverlayBounds.x + leftOverlayBounds.width).toBeGreaterThan(backTextSurfaceBounds.x);
  expect(rightOverlayBounds.x).toBeLessThan(backTextSurfaceBounds.x + backTextSurfaceBounds.width);

  await expect(answerText).toBeVisible();
  await expect(leftOverlayButton).toBeVisible();
  await expect(rightOverlayButton).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressOf(currentCard));
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);
});

test("SWIPE-23 scrolls a long answer with wheel and touch from edge overlays", async ({ fixture, page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const deck = fixture.deck();
  const session = fixture.session();
  const currentCard = fixture.card("card-1");
  await fixture.apply(page);

  await page.goto(`/deck/${deck.id}/study`);
  const answerRegion = await revealAnswer(page, currentCard.frontText);
  const initialScroll = await answerRegion.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    scrollTop: element.scrollTop,
  }));
  expect(initialScroll.scrollHeight).toBeGreaterThan(initialScroll.clientHeight);
  expect(initialScroll.scrollTop).toBe(0);

  const leftOverlay = page.getByRole("button", { name: "Swipe left" });
  const rightOverlay = page.getByRole("button", { name: "Swipe right" });
  const rightOverlayBounds = await rightOverlay.boundingBox();
  if (rightOverlayBounds == null) throw new Error("Expected a visible right back text overlay");
  expect(rightOverlayBounds.x + rightOverlayBounds.width).toBeLessThan(page.viewportSize()?.width ?? 0);
  await leftOverlay.hover();
  await page.mouse.wheel(0, initialScroll.clientHeight);

  await expect.poll(async () => answerRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await answerRegion.evaluate((element) => {
    element.scrollTop = 0;
  });

  const touchSession = await page.context().newCDPSession(page);
  const touchX = rightOverlayBounds.x + rightOverlayBounds.width / 2;
  const touchStartY = rightOverlayBounds.y + rightOverlayBounds.height * 0.75;
  const touchEndY = rightOverlayBounds.y + rightOverlayBounds.height * 0.25;
  await touchSession.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await touchSession.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 0, x: touchX, y: touchStartY }],
  });
  await touchSession.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 0, x: touchX, y: touchEndY }],
  });
  await touchSession.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

  await expect.poll(async () => answerRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(leftOverlay).toBeVisible();
  await expect(rightOverlay).toBeVisible();
  await expect(page.getByText(currentCard.backText, { exact: true })).toBeVisible();
  await expect.poll(() => readProgress(currentCard.id)).toEqual(progressOf(currentCard));
  await expect.poll(async () => (await readSession(page, deck.id))?.currentIndex).toBe(session.currentIndex);
});
