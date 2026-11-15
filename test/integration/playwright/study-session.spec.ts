import { expect, test, type Page } from "@playwright/test";

async function studySnapshot(page: Page) {
  return page.evaluate(async () => {
    const cardPath = "/src/entities/card/index.ts";
    const sessionPath = "/src/entities/study-session/index.ts";
    const preferencePath = "/src/entities/preference/index.ts";
    const responsePath = "/test/integration/playwright/persistence.ts";
    const [cards, sessions, preferences, responses] = await Promise.all([
      import(cardPath),
      import(sessionPath),
      import(preferencePath),
      import(responsePath),
    ]);
    return {
      cards: cards.getCards(),
      session: sessions.getStudySession("playwright-deck"),
      preferences: preferences.getPreferences(),
      answers: responses.savedAnswers,
      saves: responses.saveRequests,
    };
  });
}

const modifiers = [{ ctrlKey: true }, { metaKey: true }, { altKey: true }];

for (const controls of ["off", "on"]) {
  test(`PLAYWRIGHT-STUDY-SESSION-40 ignores modified ArrowRight then rates normally with controls ${controls}`, async ({
    page,
    baseURL,
  }) => {
    const externalRequests: string[] = [];
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });

    const before =
      await test.step("Given: Real stores contain a ready three-Card study with successful save responses", async () => {
        await page.route("**/*", async (route) => {
          const url = route.request().url();
          if (new URL(url).origin !== baseURL) {
            externalRequests.push(url);
            await route.abort();
            return;
          }
          await route.continue();
        });
        await page.clock.setFixedTime(Date.UTC(2026, 6, 1, 12));
        await page.goto(`/test/integration/playwright/index.html?controls=${controls}`);
        await expect(page.getByText("First prompt", { exact: true })).toBeVisible();
        await expect(page.getByText("1 / 3", { exact: true })).toBeVisible();
        await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("0");
        await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Swipe right: Good", exact: true })).toHaveCount(
          controls === "on" ? 1 : 0
        );
        return studySnapshot(page);
      });

    for (const modifier of modifiers) {
      const delivery = await test.step(`When: Deliver ArrowRight with ${JSON.stringify(modifier)}`, async () =>
        page.evaluate((modifier) => {
          // Browser-reserved chords must reach the application's real listener for this contract.
          const event = new KeyboardEvent("keydown", {
            key: "ArrowRight",
            ...modifier,
            bubbles: true,
            cancelable: true,
          });
          let delivered = false;
          const observe = (received: KeyboardEvent) => {
            delivered = received === event;
          };
          window.addEventListener("keydown", observe);
          document.body.dispatchEvent(event);
          window.removeEventListener("keydown", observe);
          return { delivered, defaultPrevented: event.defaultPrevented };
        }, modifier));

      await test.step("Then: The modified input propagates without changing study, controls, or outgoing answers", async () => {
        expect(delivery).toEqual({ delivered: true, defaultPrevented: false });
        await expect(page.getByText("First prompt", { exact: true })).toBeVisible();
        await expect(page.getByText("1 / 3", { exact: true })).toBeVisible();
        await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("0");
        await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
        expect(await studySnapshot(page)).toEqual(before);
      });
    }

    await test.step("When: Press ordinary ArrowRight once", async () => {
      await page.keyboard.press("ArrowRight");
    });

    await test.step("Then: The real study workflow rates Good once and displays the next Card without external connections", async () => {
      await expect(page.getByText("Second prompt", { exact: true })).toBeVisible();
      await expect(page.getByText("2 / 3", { exact: true })).toBeVisible();
      await expect(page.getByRole("slider", { name: "Study progress" })).toHaveValue("1");
      const after = await studySnapshot(page);
      expect(after.session.currentIndex).toBe(1);
      expect(after.answers).toHaveLength(1);
      expect(after.answers[0]).toMatchObject({ cardId: "playwright-card-1", rating: "good" });
      expect(after.cards.find((card: { id: string }) => card.id === "playwright-card-1").fsrs).not.toBeNull();
      expect(externalRequests).toEqual([]);
      expect(browserErrors).toEqual([]);
    });
  });
}
