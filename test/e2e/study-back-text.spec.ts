import type { Page } from "@playwright/test";

import { expect, test } from "./utils/fixtures";
import { readProgress, readSession } from "./utils/study-helpers";

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

test("STUDY-BACK-TEXT-01 reveals the current Card answer without changing progress", async ({ fixture, page }) => {
  const { deck, session, currentCard, before } =
    await test.step("Given: An active study session with an unrevealed card", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      await fixture.apply(page);

      await page.goto(`/deck/${deck.id}/study`);
      const before = await readProgress(currentCard.id);
      return { deck, session, currentCard, before };
    });
  const { answerRegion } = await test.step("When: Reveal the current card answer", async () => {
    const answerRegion = await revealAnswer(page, currentCard.frontText);
    return { answerRegion };
  });
  await test.step("Then: The answer is visible without changing progress or position", async () => {
    await expect(answerRegion).toBeVisible();
    await expect(page.getByText(currentCard.backText, { exact: true })).toBeVisible();
    await expect.poll(() => readProgress(currentCard.id)).toEqual(before);
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex);
  });
});

test("STUDY-BACK-TEXT-02 selects answer text without changing the Card state", async ({ fixture, page }) => {
  const { deck, session, currentCard } =
    await test.step("Given: An active study session with answer text", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      await fixture.apply(page);
      return { deck, session, currentCard };
    });
  await test.step("When: Reveal and select the current card answer", async () => {
    await page.goto(`/deck/${deck.id}/study`);
    await revealAnswer(page, currentCard.frontText);
    await selectBackText(page, currentCard.backText);
  });
  await test.step("Then: The answer text is selected without rating or advancing", async () => {
    await expect(page.getByText(currentCard.backText, { exact: true })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => window.getSelection()?.toString() ?? ""))
      .toContain(currentCard.backText);
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex);
  });
});

test("STUDY-BACK-TEXT-03 returns to the same Card front when answer overlays are disabled", async ({
  fixture,
  page,
}) => {
  const { deck, session, currentCard } =
    await test.step("Given: The current answer is open with overlay actions disabled", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      await fixture.apply(page);

      await page.goto(`/deck/${deck.id}/study`);
      await revealAnswer(page, currentCard.frontText);
      await expect(page.getByRole("button", { name: "Swipe left" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Swipe right" })).toHaveCount(0);
      return { deck, session, currentCard };
    });
  await test.step("When: Click the answer text", async () => {
    await page.getByText(currentCard.backText, { exact: true }).click();
  });
  await test.step("Then: The same card front returns without changing progress", async () => {
    await expect(page.getByText(currentCard.frontText, { exact: true })).toBeVisible();
    await expect(page.getByText(currentCard.backText, { exact: true })).toBeHidden();
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex);
  });
});

test("STUDY-BACK-TEXT-04 scrolls a long answer without changing the Card state", async ({ fixture, page }) => {
  const { deck, session, currentCard, answerRegion, initialScroll } =
    await test.step("Given: A long answer open at the top of its scroll region", async () => {
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
      return { deck, session, currentCard, answerRegion, initialScroll };
    });
  await test.step("When: Scroll the answer with the mouse wheel", async () => {
    await answerRegion.hover();
    await page.mouse.wheel(0, initialScroll.clientHeight);
  });
  await test.step("Then: The answer scrolls without changing the card or session", async () => {
    await expect.poll(async () => answerRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(answerRegion).toContainText(currentCard.backText.split("\n").at(-1) ?? currentCard.backText);
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex);
  });
});

test("STUDY-BACK-TEXT-05 runs the mapped left overlay action once and shows the next Card front", async ({
  fixture,
  page,
}) => {
  const { deck, session, currentCard, nextCard } =
    await test.step("Given: The current answer is open with a mapped left overlay", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      const nextCard = fixture.card("card-2");
      await fixture.apply(page);

      await page.goto(`/deck/${deck.id}/study`);
      await revealAnswer(page, currentCard.frontText);
      return { deck, session, currentCard, nextCard };
    });
  await test.step("When: Activate the left answer overlay", async () => {
    await page.getByRole("button", { name: "Swipe left" }).click();
  });
  await test.step("Then: The action saves once and shows the next card front", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
    await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex + 1);
  });
});

test("STUDY-BACK-TEXT-06 runs the mapped right overlay action once and shows the next Card front", async ({
  fixture,
  page,
}) => {
  const { deck, session, currentCard, nextCard } =
    await test.step("Given: The current answer is open with a mapped right overlay", async () => {
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      const nextCard = fixture.card("card-2");
      await fixture.apply(page);

      await page.goto(`/deck/${deck.id}/study`);
      await revealAnswer(page, currentCard.frontText);
      return { deck, session, currentCard, nextCard };
    });
  await test.step("When: Activate the right answer overlay", async () => {
    await page.getByRole("button", { name: "Swipe right" }).click();
  });
  await test.step("Then: The action saves once and shows the next card front", async () => {
    await expect(page.getByText(nextCard.frontText, { exact: true })).toBeVisible();
    await expect(page.getByText(nextCard.backText, { exact: true })).toBeHidden();
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 1 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex + 1);
  });
});

test("STUDY-BACK-TEXT-07 keeps the full answer width beneath overlays on a narrow viewport", async ({
  fixture,
  page,
}) => {
  const { deck, session, currentCard } =
    await test.step("Given: A narrow viewport with a long-answer study card", async () => {
      await page.setViewportSize({ width: 320, height: 568 });
      const deck = fixture.deck();
      const session = fixture.session();
      const currentCard = fixture.card("card-1");
      await fixture.apply(page);
      return { deck, session, currentCard };
    });
  const { answerRegion } = await test.step("When: Open study and reveal the answer", async () => {
    await page.goto(`/deck/${deck.id}/study`);
    const answerRegion = await revealAnswer(page, currentCard.frontText);
    return { answerRegion };
  });
  await test.step("Then: The answer fills the region beneath both overlays without advancing", async () => {
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
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex);
  });
});

test("STUDY-BACK-TEXT-08 scrolls a long answer with wheel and touch from edge overlays", async ({ fixture, page }) => {
  const { deck, session, currentCard, answerRegion, initialScroll, leftOverlay, rightOverlay, rightOverlayBounds } =
    await test.step("Given: A long answer open at the top with visible edge overlays", async () => {
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
      await expect(leftOverlay).toBeVisible();
      await expect(rightOverlay).toBeVisible();
      const rightOverlayBounds = await rightOverlay.boundingBox();
      if (rightOverlayBounds == null) throw new Error("Expected a visible right back text overlay");
      expect(rightOverlayBounds.x + rightOverlayBounds.width).toBeLessThan(page.viewportSize()?.width ?? 0);
      return { deck, session, currentCard, answerRegion, initialScroll, leftOverlay, rightOverlay, rightOverlayBounds };
    });
  await test.step("When: Scroll from the left overlay with the mouse wheel", async () => {
    await leftOverlay.hover();
    await page.mouse.wheel(0, initialScroll.clientHeight);
  });
  await test.step("Then: The answer scrolls from the overlay", async () => {
    await expect.poll(async () => answerRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  });
  await test.step("When: Reset scrolling and drag upward from the right overlay by touch", async () => {
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
  });
  await test.step("Then: Touch scrolls the answer without rating or advancing", async () => {
    await expect.poll(async () => answerRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(leftOverlay).toBeVisible();
    await expect(rightOverlay).toBeVisible();
    await expect(page.getByText(currentCard.backText, { exact: true })).toBeVisible();
    await expect.poll(() => readProgress(currentCard.id)).toEqual({ reps: 0 });
    await expect
      .poll(async () => (await readSession(fixture.user().uid, deck.id))?.currentIndex)
      .toBe(session.currentIndex);
  });
});
